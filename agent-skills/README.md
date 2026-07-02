# VibeRaven Agent Skills

Skills that teach AI coding agents to use VibeRaven — the control layer for AI-built products. Everything runs locally: no login, no API key, no telemetry.

Install with the Agent Skills CLI:

```bash
npx -y skills add ohad6k/VibeRaven --skill viberaven
npx -y skills add ohad6k/VibeRaven --skill architecture-context
npx -y skills add ohad6k/VibeRaven --skill architecture-plan
npx -y skills add ohad6k/VibeRaven --skill what-broke
npx -y skills add ohad6k/VibeRaven --skill production-context
npx -y skills add ohad6k/VibeRaven --skill go-live
```

## The skills

**`viberaven`** — the router. Teaches agents the local loop: run `npx -y viberaven check` for an offline launch verdict, read `.viberaven/` artifacts, apply fixes with `npx -y viberaven fix --gap <id>`, repeat until the gate is clear. Points at the Studio (`npx -y viberaven`) when the user wants to see and control the product.

**`architecture-context`** — the question gate. For vague feature work, asks the missing low-level product questions before any edit, then hands the answers to `architecture-plan`.

**`architecture-plan`** — the plan gate. Turns answered product questions plus repo evidence into a file-based workstream architecture plan before implementation.

**`what-broke`** — version context. Stops agents from patching blind when a working app regressed. Builds release context from git tags, diffs, and changelogs, then connects the change to provider reality (database, storage, deployment, runtime).

**`production-context`** — production memory. Keeps a compact `.viberaven/production-context.md` of boundaries, incidents, migrations, and fragile paths so the next agent action starts from what is dangerous, not just what exists.

**`go-live`** — the launch path. Takes a local app from repo state to GitHub remote to Vercel deployment with explicit build, push, deployment, and live-URL proof.

Each skill can end with `Next skill:`; continue with that skill unless user input, auth, or provider proof is required.

## The loop agents follow

```bash
npx -y viberaven check          # offline checks, 🔴/🟡/⚪ verdict, CI exit codes
npx -y viberaven fix            # list gaps with safe automatic recipes
npx -y viberaven fix --gap <id> # apply one recipe
npx -y viberaven --strict       # final gate before deploy or CI
```

Agents read `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, and `.viberaven/context-map.json`, fix one repo-code gap, then re-run `check`. Scans are local and free.

For Vercel + Supabase launch checks:

```bash
npx -y viberaven audit --vercel-supabase
```
