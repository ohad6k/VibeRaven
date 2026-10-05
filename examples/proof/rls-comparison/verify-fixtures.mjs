import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('.', import.meta.url));
const fixtures = join(root, 'fixtures');
const expectedHashes = JSON.parse(readFileSync(join(root, 'fixture-hashes.json'), 'utf8'));
function hashes(directory) {
  const result = {};
  function visit(path) {
    for (const item of readdirSync(path, { withFileTypes: true })) {
      const next = join(path, item.name);
      if (item.isDirectory()) visit(next);
      else if (item.isFile()) result[relative(directory, next).split('\\').join('/')] = createHash('sha256').update(readFileSync(next)).digest('hex');
    }
  }
  visit(directory);
  return result;
}
assert.deepEqual(hashes(fixtures), expectedHashes, 'Fixture hashes differ from the original comparison');
const uidA = '00000000-0000-0000-0000-000000000001';
const uidB = '00000000-0000-0000-0000-000000000002';
const exposedCases = new Set(['missing_rls', 'private_select_true', 'later_disable', 'commented_enable']);
const evidence = { scope: 'Exact fixture SQL in disposable local PGlite 0.5.8; auth.uid shim; no hosted Supabase', results: [] };
for (const name of readdirSync(fixtures).sort()) {
  const db = new PGlite();
  const record = { case: name };
  try {
    record.version = (await db.query('select version()')).rows[0].version;
    await db.exec(`create role authenticated nologin nobypassrls; create role anon nologin nobypassrls;
      create schema auth; create function auth.uid() returns uuid language sql stable as
      $$ select current_setting('request.jwt.claim.sub', true)::uuid $$;
      grant usage on schema public, auth to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;`);
    const migrations = join(fixtures, name, 'supabase', 'migrations');
    record.migrations = readdirSync(migrations).sort();
    for (const file of record.migrations) await db.exec(readFileSync(join(migrations, file), 'utf8'));
    const catalog = name === 'public_catalog';
    if (catalog) await db.exec(`insert into catalog values ('${uidA}','Public A'),('${uidB}','Public B'); set role anon;`);
    else await db.exec(`insert into notes values ('${uidA}','${uidA}','A'),('${uidB}','${uidB}','B'); set role authenticated;`);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uidA]);
    record.role = (await db.query('select current_user, rolsuper, rolbypassrls from pg_roles where rolname=current_user')).rows[0];
    assert.equal(record.role.rolsuper, false);
    assert.equal(record.role.rolbypassrls, false);
    record.visibleRows = (await db.query(`select id from ${catalog ? 'catalog' : 'notes'} order by id`)).rows;
    record.expectedVisibleRows = catalog || exposedCases.has(name) ? 2 : 1;
    record.expectedVisibleIds = record.expectedVisibleRows === 2 ? [uidA, uidB] : [uidA];
    assert.deepEqual(record.visibleRows, record.expectedVisibleIds.map(id => ({ id })));
    if (name === 'update_using_fallback') {
      record.ownUpdate = (await db.query("update notes set body='Own edit' where id=$1 returning id", [uidA])).rows;
      assert.deepEqual(record.ownUpdate, [{ id: uidA }]);
      try { await db.query('update notes set owner_id=$1 where id=$2', [uidB, uidA]); }
      catch (error) { record.transferDenial = { code: error.code, message: error.message }; }
      assert.equal(record.transferDenial?.code, '42501');
    }
    record.status = 'PASS';
  } catch (error) {
    record.status = 'FAIL';
    record.error = String(error);
    process.exitCode = 1;
  } finally {
    await db.close();
    evidence.results.push(record);
  }
}
assert.deepEqual(hashes(fixtures), expectedHashes, 'Runtime changed fixture inputs');
assert.equal(evidence.results.length, 8);
const runId = 'runtime-' + new Date().toISOString().replaceAll(':', '-') + '-' + randomUUID().slice(0, 8);
const receipt = join(root, 'receipts', runId);
mkdirSync(receipt, { recursive: true });
writeFileSync(join(receipt, 'runtime-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
for (const record of evidence.results) console.log(`${record.status} ${record.case}: ${record.visibleRows?.length} visible rows${record.transferDenial ? ', ownership transfer denied ' + record.transferDenial.code : ''}`);
console.log(`${process.exitCode ? 'FAIL' : 'PASS'} 8/8 expected SELECT checks; own UPDATE and ownership-transfer checks recorded`);
console.log('Local receipts: ' + receipt);
