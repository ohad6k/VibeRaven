"""Run the eight unchanged synthetic fixtures against pinned scanners.

No hosted database, provider credentials, fixture dependency installs, or shell
command construction. Local receipts can contain paths; do not publish them.
"""
from pathlib import Path
import base64
import datetime
import hashlib
import json
import os
import platform
import shutil
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parent
PIN = 'ba63656f6d1b7cfae7f3be32e9a0a1749659fe5c'
REPO_URL = 'https://github.com/AgentJDrew/rls-guard.git'
VIBERAVEN = '1.6.3'


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def hashes(root):
    return {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(root.rglob('*')) if p.is_file()
            and '.git' not in p.parts and '__pycache__' not in p.parts}


def run(command, cwd, receipt, env=None):
    receipt.mkdir(parents=True, exist_ok=True)
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    process = subprocess.run(command, cwd=cwd, env=env, capture_output=True, timeout=240)
    record = dict(command=command, cwd=str(cwd), started_utc=started,
                  finished_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  exit_code=process.returncode,
                  stdout=process.stdout.decode('utf-8', errors='replace'),
                  stderr=process.stderr.decode('utf-8', errors='replace'),
                  stdout_base64=base64.b64encode(process.stdout).decode('ascii'),
                  stderr_base64=base64.b64encode(process.stderr).decode('ascii'))
    save(receipt / 'execution.json', record)
    (receipt / 'stdout.bin').write_bytes(process.stdout)
    (receipt / 'stderr.bin').write_bytes(process.stderr)
    return record


def findings(tool, value):
    if tool == 'viberaven':
        return sorted([g['id'], g['severity']] for g in value['gaps']
                      if g['id'] != 'missing_monitoring')
    return sorted([g['rule_id'], g['severity']] for g in value['findings'])


def main():
    if sys.version_info < (3, 10):
        raise RuntimeError('Python 3.10 or newer is required')
    fixtures = ROOT / 'fixtures'
    expected_hashes = json.loads((ROOT / 'fixture-hashes.json').read_text(encoding='utf-8'))
    before = hashes(fixtures)
    if before != expected_hashes:
        raise RuntimeError('Fixture hashes differ from the original comparison')
    run_id = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S.%fZ') + '-' + uuid.uuid4().hex[:8]
    receipts = ROOT / 'receipts' / run_id
    receipts.mkdir(parents=True)
    git = shutil.which('git')
    npx = shutil.which('npx.cmd') or shutil.which('npx')
    npm = shutil.which('npm.cmd') or shutil.which('npm')
    node = shutil.which('node')
    if not all([git, npx, npm, node]):
        raise RuntimeError('Git, Node.js and npm/npx must be available on PATH')
    repo = ROOT / '.tools' / 'rls-guard'
    repo.parent.mkdir(parents=True, exist_ok=True)
    if not repo.exists():
        cloned = run([git, 'clone', '--no-checkout', REPO_URL, str(repo)], ROOT, receipts / 'clone')
        if cloned['exit_code'] != 0:
            raise RuntimeError('Clone failed; inspect the local clone receipt')
        checked = run([git, 'checkout', '--detach', PIN], repo, receipts / 'checkout')
        if checked['exit_code'] != 0:
            raise RuntimeError('Pinned checkout failed; inspect the local checkout receipt')
    head = run([git, 'rev-parse', 'HEAD'], repo, receipts / 'git-head')
    if head['exit_code'] != 0 or head['stdout'].strip() != PIN:
        raise RuntimeError('Existing tool checkout is not at the declared pin; use a fresh directory')
    clean = run([git, 'status', '--porcelain', '--untracked-files=all', '--ignored'],
                repo, receipts / 'git-status')
    if clean['exit_code'] != 0 or clean['stdout'].strip():
        raise RuntimeError('Tool checkout contains modified, untracked or ignored files; use a fresh directory')
    source_before = hashes(repo / 'src')
    env = os.environ.copy()
    env['PYTHONPATH'] = str(repo / 'src')
    env['PYTHONDONTWRITEBYTECODE'] = '1'
    guard = [sys.executable, '-m', 'rls_guard.cli']
    metadata = dict(viberaven_version=VIBERAVEN, rls_guard_commit=PIN,
                    python_version=platform.python_version(),
                    fixture_hashes_before=before, source_hashes_before=source_before)
    metadata['git_status'] = clean
    metadata['rls_guard_version'] = run(guard + ['--version'], ROOT, receipts / 'guard-version', env)
    metadata['npm_package'] = run([npm, 'view', 'viberaven@' + VIBERAVEN,
                                  'version', 'dist.integrity', 'dist.shasum', '--json'],
                                 ROOT, receipts / 'npm-package')
    metadata['node'] = run([node, '--version'], ROOT, receipts / 'node-version')
    metadata['npm'] = run([npm, '--version'], ROOT, receipts / 'npm-version')
    for key in ['rls_guard_version', 'npm_package', 'node', 'npm']:
        if metadata[key]['exit_code'] != 0:
            raise RuntimeError('Tool metadata command failed: ' + key)
    baseline = json.loads((ROOT / 'observed-results.json').read_text(encoding='utf-8'))
    results = []
    mismatches = []
    for case in baseline['cases']:
        name = case['case']
        for tool in ['viberaven', 'rls-guard']:
            dest = receipts / name / tool / 'input'
            shutil.copytree(fixtures / name, dest)
            input_before = hashes(dest)
            command = (guard + ['scan', str(dest), '--format', 'json'] if tool == 'rls-guard'
                       else [npx, '-y', 'viberaven@' + VIBERAVEN, 'check', '--json', str(dest)])
            record = run(command, dest, dest.parent, env if tool == 'rls-guard' else None)
            input_after = hashes(dest)
            record.update(case=name, tool=tool, input_hashes_before=input_before,
                          input_hashes_after={k: input_after.get(k) for k in input_before})
            if record['input_hashes_before'] != record['input_hashes_after']:
                mismatches.append(name + ' ' + tool + ': inputs changed')
            try:
                decoded = json.loads(record['stdout'])
                observed = dict(exit_code=record['exit_code'], sql_findings=findings(tool, decoded))
                record['observed'] = observed
                if observed != case[tool]:
                    mismatches.append(name + ' ' + tool + ': differs from saved baseline')
                if tool == 'rls-guard' and decoded.get('warnings') != []:
                    mismatches.append(name + ' rls-guard: parser warning')
                if record['stderr']:
                    mismatches.append(name + ' ' + tool + ': nonempty stderr')
            except (ValueError, KeyError, TypeError):
                mismatches.append(name + ' ' + tool + ': output not expected JSON')
            save(dest.parent / 'execution.json', record)
            results.append(record)
            print(name, tool, record['exit_code'], flush=True)
    metadata['fixture_hashes_after'] = hashes(fixtures)
    metadata['source_hashes_after'] = hashes(repo / 'src')
    if before != metadata['fixture_hashes_after'] or source_before != metadata['source_hashes_after']:
        mismatches.append('Original fixture or scanner source hashes changed')
    save(receipts / 'metadata.json', metadata)
    save(receipts / 'results.json', dict(fixture_count=8, tool_runs=len(results), results=results,
                                         mismatches=mismatches, status='FAIL' if mismatches else 'PASS'))
    if mismatches:
        raise RuntimeError('; '.join(mismatches))
    print('PASS 16/16 scanner runs match the saved baseline; fixture and source hashes unchanged')
    print('Local receipts: ' + str(receipts))


if __name__ == '__main__':
    main()
