import type {
  Gap,
  GapCategory,
  GapSeverity,
  ModelStationOutput,
  ProductionMapCategoryKey,
  ProductionChecklist,
  ToolSuggestion,
} from './types';
import type { ManagedStationResponse } from '../../shared/station';

const VALID_SEVERITY: GapSeverity[] = ['critical', 'warning', 'info'];
const VALID_CATEGORIES: GapCategory[] = [
  'SECURITY & AUTH', 'DATABASE & DATA', 'ERROR HANDLING', 'DEPLOYMENT',
  'PERFORMANCE', 'MISSING FEATURES', 'EDGE CASES & RISKS', 'LANDING & MARKETING'
];
const VALID_MAP_CATEGORIES: ProductionMapCategoryKey[] = [
  'appFlow',
  'frontend',
  'backend',
  'auth',
  'database',
  'payments',
  'deployment',
  'monitoring',
  'security',
  'testing',
  'landing',
  'errorHandling',
];
const MAP_CATEGORY_RULES: Array<{ key: ProductionMapCategoryKey; match: RegExp }> = [
  { key: 'monitoring', match: /\b(monitor|monitoring|observability|sentry|logrocket|posthog|analytics|telemetry|logs?)\b/i },
  { key: 'errorHandling', match: /\b(error handling|error boundary|exception|unhandled|crash|fallback|failure|failures|rejected promise)\b/i },
  { key: 'auth', match: /\b(auth|login|logout|session|jwt|oauth|supabase auth|protected route|role|roles|permission|permissions)\b/i },
  { key: 'payments', match: /\b(payment|payments|billing|checkout|stripe|polar|paddle|subscription|webhook|lemon squeezy|lemonsqueezy|invoice)\b/i },
  { key: 'backend', match: /\b(backend|api|server|route|handler|endpoint|station run|station runs|fastify|express)\b/i },
  { key: 'security', match: /\b(security|secret|secrets|rate limit|ratelimit|csrf|xss|bot|abuse|signature)\b/i },
  { key: 'database', match: /\b(database|data|postgres|mysql|mongo|schema|migration|storage|rls|supabase|repository)\b/i },
  { key: 'deployment', match: /\b(deploy|deployment|hosting|vercel|netlify|docker|ci|pipeline|environment|env|release)\b/i },
  { key: 'testing', match: /\b(test|testing|spec|coverage|vitest|jest|playwright|cypress|qa)\b/i },
  { key: 'landing', match: /\b(landing|marketing|homepage|hero|cta|pricing|seo|sitemap|robots|onboarding|funnel)\b/i },
  { key: 'frontend', match: /\b(frontend|react|ui|component|layout|state|loading|client)\b/i },
  { key: 'appFlow', match: /\b(app flow|ux|user flow|journey|activation|empty state)\b/i },
];
const SEVERITY_RANK: Record<GapSeverity, number> = { info: 0, warning: 1, critical: 2 };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function clampScore(v: unknown, fallback = 50): number {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function stableVisibleScore(v: unknown, fallback = 50): number {
  const clamped = clampScore(v, fallback);
  return Math.max(0, Math.min(100, Math.round(clamped / 5) * 5));
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((item): item is string => typeof item === 'string');
}

function isProductionMapCategoryKey(value: unknown): value is ProductionMapCategoryKey {
  return typeof value === 'string' && VALID_MAP_CATEGORIES.includes(value as ProductionMapCategoryKey);
}

function uniqueMapCategories(values: ProductionMapCategoryKey[]): ProductionMapCategoryKey[] {
  const seen = new Set<ProductionMapCategoryKey>();
  const out: ProductionMapCategoryKey[] = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return out;
}

function fallbackMapCategoryForGap(category: GapCategory, text: string): ProductionMapCategoryKey {
  switch (category) {
    case 'SECURITY & AUTH':
      return /\b(auth|login|session|oauth|jwt|role|permission|protected route)\b/i.test(text) ? 'auth' : 'security';
    case 'DATABASE & DATA':
      return 'database';
    case 'ERROR HANDLING':
      return 'errorHandling';
    case 'DEPLOYMENT':
      return 'deployment';
    case 'PERFORMANCE':
      return 'frontend';
    case 'LANDING & MARKETING':
      return 'landing';
    case 'EDGE CASES & RISKS':
      return 'testing';
    case 'MISSING FEATURES':
    default:
      return 'appFlow';
  }
}

function inferMapCategories(
  category: GapCategory,
  title: string,
  detail: string,
  copyPrompt: string,
  explicitPrimary: unknown,
  explicitAffected: unknown
): ProductionMapCategoryKey[] {
  const text = [category, title, detail, copyPrompt].filter(Boolean).join(' ');
  const fallback = fallbackMapCategoryForGap(category, text);
  const matched = MAP_CATEGORY_RULES.filter((rule) => rule.match.test(text)).map((rule) => rule.key);
  const explicit = isProductionMapCategoryKey(explicitPrimary) ? [explicitPrimary] : [];
  const affected = Array.isArray(explicitAffected)
    ? explicitAffected.filter(isProductionMapCategoryKey)
    : [];

  const primarySeed = matched[0] ? [matched[0], fallback] : [fallback];
  return uniqueMapCategories([...explicit, ...primarySeed, ...matched, ...affected]);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 52);
}

function normalizeToolSuggestion(v: unknown): ToolSuggestion | null {
  if (!isRecord(v)) return null;
  const name = typeof v.name === 'string' ? v.name.trim() : '';
  const url = typeof v.url === 'string' ? v.url.trim() : '';
  if (!name || !url) return null;
  return { name, url, reason: typeof v.reason === 'string' ? v.reason : '' };
}

export function normalizeGap(v: unknown): Gap | null {
  if (!isRecord(v)) return null;
  const title = typeof v.title === 'string' ? v.title.trim() : '';
  const copyPrompt = typeof v.copyPrompt === 'string' ? v.copyPrompt.trim() : '';
  if (!title || !copyPrompt) return null;

  const severity = VALID_SEVERITY.includes(v.severity as GapSeverity)
    ? (v.severity as GapSeverity)
    : 'warning';

  const category = VALID_CATEGORIES.includes(v.category as GapCategory)
    ? (v.category as GapCategory)
    : 'MISSING FEATURES';

  const toolSuggestions = Array.isArray(v.toolSuggestions)
    ? v.toolSuggestions.map(normalizeToolSuggestion).filter((t): t is ToolSuggestion => t !== null)
    : [];

  const affectedMapCategories = inferMapCategories(
    category,
    title,
    typeof v.detail === 'string' ? v.detail : '',
    copyPrompt,
    v.primaryMapCategory,
    v.affectedMapCategories
  );

  return {
    id: typeof v.id === 'string' && v.id.trim() ? v.id.trim() : `gap-${slugify(title) || 'root'}`,
    category,
    severity,
    title,
    detail: typeof v.detail === 'string' ? v.detail : '',
    copyPrompt,
    toolSuggestions,
    mcpSuggestion: typeof v.mcpSuggestion === 'string' ? v.mcpSuggestion : null,
    primaryMapCategory: affectedMapCategories[0],
    affectedMapCategories,
  };
}

function rootGapKey(gap: Gap): string {
  const titleKey = slugify(gap.title);
  if (titleKey) {
    return titleKey;
  }
  return slugify([gap.category, gap.copyPrompt].join(' ')) || gap.id;
}

function mergeToolSuggestions(a: ToolSuggestion[], b: ToolSuggestion[]): ToolSuggestion[] {
  const seen = new Set<string>();
  const out: ToolSuggestion[] = [];
  for (const tool of [...a, ...b]) {
    const key = `${tool.name.trim().toLowerCase()}|${tool.url.trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(tool);
    }
  }
  return out;
}

function mergeRootGaps(a: Gap, b: Gap): Gap {
  const severity = SEVERITY_RANK[b.severity] > SEVERITY_RANK[a.severity] ? b.severity : a.severity;
  return {
    ...a,
    severity,
    detail: b.detail.length > a.detail.length ? b.detail : a.detail,
    copyPrompt: b.copyPrompt.length > a.copyPrompt.length ? b.copyPrompt : a.copyPrompt,
    toolSuggestions: mergeToolSuggestions(a.toolSuggestions, b.toolSuggestions),
    mcpSuggestion: a.mcpSuggestion ?? b.mcpSuggestion,
    primaryMapCategory: a.primaryMapCategory,
    affectedMapCategories: a.affectedMapCategories,
  };
}

function dedupeRootGaps(gaps: Gap[]): Gap[] {
  const byKey = new Map<string, Gap>();
  const order: string[] = [];
  for (const gap of gaps) {
    const key = rootGapKey(gap);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, gap);
      order.push(key);
      continue;
    }
    byKey.set(key, mergeRootGaps(existing, gap));
  }
  return order.map((key) => byKey.get(key)).filter((gap): gap is Gap => Boolean(gap));
}

function normalizeChecklist(v: unknown): ProductionChecklist {
  const defaults: ProductionChecklist = {
    security: 50, database: 50, auth: 50, errorHandling: 50,
    deployment: 50, testing: 50, landing: 50, monitoring: 50
  };
  if (!isRecord(v)) return defaults;
  return {
    security: clampScore(v.security),
    database: clampScore(v.database),
    auth: clampScore(v.auth),
    errorHandling: clampScore(v.errorHandling),
    deployment: clampScore(v.deployment),
    testing: clampScore(v.testing),
    landing: clampScore(v.landing),
    monitoring: clampScore(v.monitoring),
  };
}

export function normalizeModelOutput(raw: Partial<ModelStationOutput>): ModelStationOutput {
  const gaps = Array.isArray(raw.gaps)
    ? raw.gaps.map(normalizeGap).filter((g): g is Gap => g !== null)
    : [];
  const uniqueGaps = dedupeRootGaps(gaps);

  return {
    score: stableVisibleScore(raw.score),
    scoreLabel: typeof raw.scoreLabel === 'string' && raw.scoreLabel.trim() ? raw.scoreLabel : 'Drifting',
    summary: typeof raw.summary === 'string' && raw.summary.trim() ? raw.summary : 'Scan complete.',
    archetype: typeof raw.archetype === 'string' && raw.archetype.trim() ? raw.archetype : 'unknown',
    gaps: uniqueGaps,
    stackDetected: toStringArray(raw.stackDetected),
    missingLayers: toStringArray(raw.missingLayers),
    quickWins: toStringArray(raw.quickWins),
    productionChecklist: normalizeChecklist(raw.productionChecklist),
  };
}

export function adaptManagedStationResponse(response: ManagedStationResponse): ModelStationOutput {
  const structured = parseManagedStructuredOutput(response.output);
  if (structured) {
    return structured;
  }

  const scoreMap: Record<string, number> = { stable: 75, drifting: 50, chaos: 25 };
  const labelMap: Record<string, string> = { stable: 'Stable', drifting: 'Drifting', chaos: 'Chaos' };
  const score = scoreMap[response.status] ?? 50;

  const gaps: Gap[] = [];
  if (response.output && response.output.trim()) {
    gaps.push({
      id: 'managed-output',
      category: 'MISSING FEATURES',
      severity: 'warning',
      title: 'Station recommendation',
      detail: response.reason,
      copyPrompt: response.output,
      toolSuggestions: [],
      mcpSuggestion: null,
      primaryMapCategory: 'appFlow',
      affectedMapCategories: ['appFlow'],
    });
  }

  const checklist: ProductionChecklist = {
    security: score, database: score, auth: score, errorHandling: score,
    deployment: score, testing: score, landing: score, monitoring: score,
  };

  return {
    score,
    scoreLabel: labelMap[response.status] ?? 'Drifting',
    summary: response.reason,
    archetype: 'unknown',
    gaps,
    stackDetected: [],
    missingLayers: [],
    quickWins: [],
    productionChecklist: checklist,
  };
}

function parseManagedStructuredOutput(output: string): ModelStationOutput | null {
  try {
    const parsed = JSON.parse(output) as Partial<ModelStationOutput>;
    if (!Array.isArray(parsed.gaps) || !isRecord(parsed.productionChecklist)) {
      return null;
    }
    return normalizeModelOutput(parsed);
  } catch {
    return null;
  }
}
