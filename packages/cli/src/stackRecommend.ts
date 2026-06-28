import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface StackRecommendation {
  frontend: string;
  ui: string;
  database: string;
  auth: string;
  deploy: string;
  detected: boolean;
  reason: string;
}

const DEFAULT_STACK: StackRecommendation = {
  frontend: 'react',
  ui: 'tailwind + shadcn/ui',
  database: 'supabase',
  auth: 'supabase',
  deploy: 'vercel',
  detected: false,
  reason: 'Agent-default stack for lowest launch friction when repo signals are ambiguous'
};

export async function recommendStack(cwd: string = process.cwd()): Promise<StackRecommendation> {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) {
    return DEFAULT_STACK;
  }

  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const names = Object.keys(deps).join(' ').toLowerCase();

  const rec: StackRecommendation = {
    ...DEFAULT_STACK,
    detected: true,
    reason: 'Inferred from package.json dependencies'
  };

  if (names.includes('next')) {
    rec.frontend = 'next.js (react)';
    rec.deploy = 'vercel';
  } else if (names.includes('vite') || names.includes('react')) {
    rec.frontend = 'react';
  }

  if (names.includes('@supabase/supabase-js') || names.includes('supabase')) {
    rec.database = 'supabase';
    rec.auth = 'supabase';
  } else if (names.includes('@neondatabase') || names.includes('drizzle')) {
    rec.database = names.includes('neon') ? 'neon' : 'postgres';
  }

  if (names.includes('tailwindcss')) {
    rec.ui = names.includes('@radix-ui') ? 'tailwind + shadcn/ui' : 'tailwind';
  }

  if (names.includes('@clerk/')) {
    rec.auth = 'clerk';
  }

  return rec;
}
