# VibeRaven Agent Skills

This directory contains the public VibeRaven production-readiness skill for AI coding agents.

After this directory is published in the public VibeRaven GitHub repository, users can install it with the Agent Skills CLI:

```bash
npx skills add ohad6k/VibeRaven --skill viberaven-production-readiness --full-depth
```

The skill teaches agents to use VibeRaven as the Agent Context + Production Gate:

```bash
npx -y viberaven --agent-mode
```

Agents read `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, and `.viberaven/context-map.json`, fix one repo-code gap, then run:

```bash
npx -y viberaven --verify
npx -y viberaven --strict
```

For Vercel + Supabase launch checks:

```bash
npx -y viberaven audit --vercel-supabase
```
