# The AI Crew Starter Kit

Build a team of AI agents on Claude Code + Obsidian, and the foreman that checks their work before it ships. These are the actual files I run, cleaned up so you can adapt them to your business.

---

## 1. The folder structure

```
your-vault/                  ← Obsidian: the shared brain (memory)
  about-me.md
  anti-ai-writing-style.md
  Projects/  Resources/  Daily-Log/
your-repo/
  .claude/agents/            ← one markdown file per agent
    prospector.md  copywriter.md  social-listener.md
    seo.md  researcher.md  knowledge-keeper.md  editor.md
```

The vault is the memory. The agent files are the team. Files = memory. Memory = consistency.

---

## 2. The two files that replace long prompts

**about-me.md** — who you are, how you work, how you write, your goals, your current focus. Every agent reads this first, so you stop re-explaining yourself.

**anti-ai-writing-style.md** — every phrase and pattern you never want the AI to use. Example lines:
```
- No em-dashes. Use periods and commas.
- Never say "in today's fast-paced world", "unlock", "delve", "leverage", "game-changer".
- No hype. No sales voice. Write like a builder talking to a builder.
- Short sentences. One idea per line.
```

---

## 3. The agent template (one file per agent)

```markdown
---
name: <role>
description: <one line: what this worker does + when to use it>
tools: Read, Write, Edit, Glob, Grep, WebSearch
---
You are <Name>, the <role> on my AI team.

Your one job: <the single outcome>.

Read first: about-me.md, anti-ai-writing-style.md, <relevant files>.

Do: <the step-by-step workflow>.

Output: draft into <folder/file>. Never post or send.

Guardrails: draft only; follow my voice; stay scoped; verify before claiming done.
```

**My 7 roles (adapt to your business):**
- **Prospector**: finds leads, drafts personalized outreach (you send)
- **Copywriter**: daily posts in your voice
- **Social-listener**: watches your thought-leaders, drafts timed replies
- **SEO**: daily keyword + article extension
- **Researcher**: weekly landscape / competitor research
- **Knowledge-keeper**: turns raw notes into clean, linked docs
- **Editor**: weekly cleanup, drift-check, synthesis

---

## 4. Plug-and-play setup prompts

**Build a worker:**
> "Create an agent file for a <role> on my team. Its one job is <job>. It reads about-me.md and anti-ai-writing-style.md first, drafts into <folder>, never posts, and follows my voice. Output the markdown file."

**Dispatch a worker:**
> "Read agents/<role>.md and do its job for today. Draft into the vault and return the result plus your single top recommendation."

**Instant output boost (use on any task):**
> "I want to <task>. Ask me questions first."

**Session handoff (when you switch tools or hit limits):**
> "Write a copy-pasteable handoff: goal, current state, decisions and why, open threads, gotchas. State, not instructions. Reference files by path, don't repeat them."

---

## 5. The foreman checklist (the part everyone skips)

The moment your agents write real code, they write your auth, your RLS, your webhooks. Before that touches real users, check:

```
[ ] Auth enforced on every server route + user-owned data
[ ] RLS on WRITES, not just reads   (the #1 AI-agent miss: CVE-2025-48757, 170+ shipped apps)
[ ] Webhook signatures verified (Stripe, etc.)
[ ] Env vars point at prod, not test keys
[ ] Migrations run clean on a fresh prod DB
[ ] Monitoring + the first-user path actually tested
```

Building the team is the fun part. The foreman is the part that saves you at 3am.

(This is exactly what I automate with VibeRaven, open source: `npx -y viberaven`)

---

*Made by Ohad. If this helped, a star on github.com/ohad6k/VibeRaven keeps me building.*
