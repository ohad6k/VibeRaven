# VibeRaven badge snippet

Add this to an app README after VibeRaven helped you find or fix a launch gap:

```markdown
[![Checked with VibeRaven](https://img.shields.io/badge/checked%20with-VibeRaven-7c3aed?style=flat-square)](https://github.com/ohad6k/VibeRaven)

Before your AI-built app ships, run `npx -y viberaven`.
```

HTML variant:

```html
<a href="https://github.com/ohad6k/VibeRaven">
  <img src="https://img.shields.io/badge/checked%20with-VibeRaven-7c3aed?style=flat-square" alt="Checked with VibeRaven" />
</a>
```

Optional footer copy:

```markdown
Launch gate checked with [VibeRaven](https://github.com/ohad6k/VibeRaven). If it helped, star the repo so other AI app builders can find it.
```

For agent-only or CI workflows, pair the badge with:

```bash
npx -y viberaven --agent-mode
```
