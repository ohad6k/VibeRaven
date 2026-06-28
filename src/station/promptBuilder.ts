import type { ScanResult } from './types';

export function buildAnalysisPrompt(
  scan: ScanResult,
  specContent?: string,
  productionConnectionContext?: string,
  scannerEvidenceContext?: string,
  stackWiringContext?: string,
  stackAutomationContext?: string
): string {
  const sections: string[] = [];

  const detectedStack = (Object.entries(scan.stackSignals) as Array<[string, boolean | undefined]>)
    .filter(([, v]) => v === true)
    .map(([k]) => k)
    .join(', ');

  sections.push(`## PROJECT CONTEXT
Total files in repo: ${scan.totalFilesScanned}
Files analyzed: ${scan.files.length}
Detected stack signals: ${detectedStack || 'none detected'}
All dependencies: ${scan.packageDeps.join(', ') || 'none found'}
Secret files found (contents not read): ${scan.secretsFound.join(', ') || 'none'}
`);

  if (scan.fileTree) {
    sections.push(`## FILE TREE (compact)
${scan.fileTree}
`);
  }

  if (specContent && specContent.trim().length > 0) {
    sections.push(`## PROJECT SPEC (SPEC.md)
${specContent.slice(0, 4000)}
`);
  }

  const filesWithContent = scan.files.filter((f) => !f.isSecret && f.content !== null && f.content.trim().length > 0);
  if (filesWithContent.length > 0) {
    sections.push('## FILE CONTENTS (highest relevance first)');
    for (const file of filesWithContent) {
      const safePath = file.path.replace(/[\r\n]/g, ' ');
      const escapedContent = (file.content as string).replace(/`{3}/g, '\\`\\`\\`');
      sections.push(`### ${safePath} (heat: ${file.heat})\n\`\`\`\n${escapedContent}\n\`\`\`\n`);
    }
  }

  if (productionConnectionContext && productionConnectionContext.trim().length > 0) {
    sections.push(productionConnectionContext.trim());
  }

  if (scannerEvidenceContext && scannerEvidenceContext.trim().length > 0) {
    sections.push(`## LOCAL SCANNER EVIDENCE
${scannerEvidenceContext.trim()}
`);
  }

  if (stackWiringContext && stackWiringContext.trim().length > 0) {
    sections.push(stackWiringContext.trim());
  }

  if (stackAutomationContext && stackAutomationContext.trim().length > 0) {
    sections.push(stackAutomationContext.trim());
  }

  sections.push(`## YOUR TASK

You are a senior software engineer reviewing a vibe-coded project for production readiness.
Analyze everything above and return ONLY valid JSON with this exact structure:

{
  "score": 75,
  "scoreLabel": "Stable",
  "summary": "2 critical gaps before launch",
  "archetype": "saas-app",
  "gaps": [
    {
      "id": "unique-kebab-id",
      "category": "SECURITY & AUTH",
      "severity": "critical",
      "title": "No rate limiting on API routes",
      "detail": "Any user can spam your API endpoints causing cost and abuse.",
      "primaryMapCategory": "security",
      "affectedMapCategories": ["security", "backend", "auth"],
      "copyPrompt": "Harden API rate limiting. First inspect src, route handlers, middleware, and existing auth/session helpers. Identify every public or write-heavy endpoint that can be abused. Implement: 1. Add Upstash rate limiting to sensitive API routes. 2. Use conservative defaults such as 10 requests per minute per IP for auth/write endpoints. 3. Return clear 429 responses without leaking internals. Constraints: Preserve existing API contracts unless they are unsafe. Do not rely on client-side checks for server protection. Verification: Add or update tests/manual checks for allowed and rate-limited requests. Run the relevant test suite and TypeScript check. Summarize what changed and what scanner/rescan evidence should confirm.",
      "toolSuggestions": [
        {
          "name": "Upstash Rate Limit",
          "url": "https://upstash.com/docs/redis/sdks/ratelimit-ts/overview",
          "reason": "Best rate limiter for serverless/edge"
        }
      ],
      "mcpSuggestion": null
    }
  ],
  "stackDetected": ["nextjs", "supabase", "typescript"],
  "missingLayers": ["landing-page", "error-monitoring"],
  "quickWins": ["Add .env.example", "Add error boundary to root layout"],
  "productionChecklist": {
    "security": 40,
    "database": 80,
    "auth": 60,
    "errorHandling": 30,
    "deployment": 70,
    "testing": 10,
    "landing": 50,
    "monitoring": 0
  }
}

Gap categories must be one of:
SECURITY & AUTH, DATABASE & DATA, ERROR HANDLING, DEPLOYMENT,
PERFORMANCE, MISSING FEATURES, EDGE CASES & RISKS, LANDING & MARKETING

Mission Map category keys must be one of:
appFlow, frontend, backend, auth, database, payments, deployment, monitoring, security, testing, landing, errorHandling

Severity: critical (blocks launch), warning (should fix soon), info (nice to have)
Score: 0-100 overall production readiness. Be honest — most vibe-coded projects score 30-60.
Use a stable scoring rubric: the same evidence should receive the same score on repeat scans. Do not move the score up or down for wording variety; only change it when the scanned evidence changes.

Return unique root gaps, not one copy of the same root problem for each affected section. For each gap:
- Set primaryMapCategory to the single Mission Map section that should own/count the blocker.
- Set affectedMapCategories to related sections that the blocker touches, but do not duplicate the gap for those sections.
- Example: "No production error monitoring is wired up" should be one monitoring gap with affectedMapCategories such as ["monitoring", "errorHandling", "auth", "payments", "backend"], not separate auth, billing, backend, and error gaps.
- Example: "Auth enforcement is split across app layers" should be one auth or security gap, depending on the strongest evidence, not repeated across every protected route.

For toolSuggestions: suggest real tools that solve this specific gap.
- Database gaps: suggest Supabase, PlanetScale, Neon, Turso, or MongoDB Atlas based on detected stack.
- Auth gaps: suggest Supabase Auth, Clerk, NextAuth, or Lucia based on detected stack.
- Monitoring: suggest Sentry, LogRocket, or PostHog.
- Deployment: suggest Vercel, Railway, Fly.io, or Render.

Every copyPrompt must be ready to paste into a coding agent. Use this VibeRaven execution structure inside the string:

1. Start with the outcome in one sentence.
2. Include a "First inspect" paragraph naming concrete files, directories, or helpers from the scanned project when possible.
3. Include an "Implement" section with numbered steps.
4. Include a "Constraints" section with safety rules and behavior that must not break.
5. Include a "Verification" section with tests, commands, manual checks, or scanner evidence.
6. End by asking the agent to "Summarize what changed" and what remains manual or external.

Make each gap Raven-friendly: include a concrete copyPrompt, likely tool paths where relevant, and verification steps the user or scanner can check after implementation. Do not claim external dashboard setup is complete from repo evidence alone. If a step needs a provider dashboard, account, MCP connection, billing console, OAuth callback, RLS setting, alert route, or any other external system, say so explicitly and mark it as manual or MCP-verifiable instead of repo-verifiable.

Be specific. A vibe coder needs to know EXACTLY what to do, not generic advice.
Return ONLY the JSON object — no markdown, no explanation.
`);

  return sections.join('\n');
}
