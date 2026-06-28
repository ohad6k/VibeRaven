import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const START = '<!-- VIBERICE:START -->';
const END = '<!-- VIBERICE:END -->';

export async function writeManagedSpec(root: string, lines: string[]): Promise<{ summary: string[] }> {
  const specPath = join(root, 'SPEC.md');

  let previous = '';
  try {
    previous = await fs.readFile(specPath, 'utf8');
  } catch {
    previous = '';
  }

  const next = buildNextSpec(previous, lines);

  await fs.writeFile(specPath, next, 'utf8');

  return {
    summary: summarizeDiff(extractManagedLines(previous), lines)
  };
}

function buildNextSpec(previous: string, lines: string[]): string {
  const managedBlock = [START, ...lines, END].join('\n');
  const existing = findManagedSpan(previous);

  if (existing !== null) {
    return `${previous.slice(0, existing.start)}${managedBlock}${previous.slice(existing.end)}`;
  }

  return previous ? `${managedBlock}\n${previous}` : `${managedBlock}\n`;
}

function summarizeDiff(previousManagedLines: string[], nextManagedLines: string[]): string[] {
  const previousLines = new Set(previousManagedLines);
  const emitted = new Set<string>();

  return nextManagedLines
    .filter((line) => line.startsWith('- ') || line.startsWith('## '))
    .filter((line) => !previousLines.has(line))
    .filter((line) => {
      if (emitted.has(line)) {
        return false;
      }

      emitted.add(line);
      return true;
    })
    .slice(0, 5)
    .map((line) => `added ${line.replace(/^[-# ]+/, '')}`);
}

function findManagedSpan(contents: string): { start: number; end: number } | null {
  const start = contents.indexOf(START);
  if (start === -1) {
    return null;
  }

  const end = contents.indexOf(END, start + START.length);
  if (end === -1) {
    return null;
  }

  return {
    start,
    end: end + END.length
  };
}

function extractManagedLines(contents: string): string[] {
  const span = findManagedSpan(contents);
  if (span === null) {
    return [];
  }

  return contents
    .slice(span.start + START.length, span.end - END.length)
    .split(/\r?\n/)
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.length > 0);
}
