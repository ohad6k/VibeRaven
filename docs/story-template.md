# Share a real launch / after-launch story

VibeRaven is being built in the open as the standard for **operating AI-built apps after launch**. Real stories are the most useful contribution you can make — they become fixtures and checks that catch the same problem for everyone else.

Copy the template below into a [GitHub Discussion](https://github.com/ohad6k/VibeRaven/discussions) under **Release stories**, fill it in (redact everything sensitive), and post. If you're okay with it, we'll turn your story into an example under `examples/stories/`.

## Template

```markdown
**Stack:** Next.js + Supabase + Vercel + Clerk + Stripe  (list yours)

**Version:** v1.0 → v1.1  (or the release where it broke)

**What broke after launch:**
<one or two sentences — the real failure you hit>

**What VibeRaven caught (or should have caught):**
<the provider/gap that drifted, e.g. Stripe webhook signature, Supabase RLS, Clerk callback, env drift>

**Repo evidence (redacted):**
<paste the redacted snippet or file path that shows the gap — no live keys, no customer data>

**What the agent should have done next:**
<the scoped next action you wanted>

**Can we turn this into a public example?** yes / no
```

## Rules

- Redact all secrets, tokens, signing secrets, cookies, production customer data, and live provider credentials.
- Use fake values where needed — the pattern matters, not the real data.
- Repo-code examples can't prove provider dashboard setup is complete; note what still needed a human action.

## From story to fixture

1. You post the story in Discussions.
2. A maintainer asks permission to anonymize it into `examples/stories/<slug>.md`.
3. The fixture is merged and linked from the README's "Real scenarios" section.
4. The story becomes a check idea — filed as an issue labeled `story` so VibeRaven can catch it next time.

Thanks for sharing — this is how the open map of post-launch problems grows.
