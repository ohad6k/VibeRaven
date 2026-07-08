# README video embed troubleshooting

The README hero embeds a looping demo GIF. If it doesn't load for you —
GitHub's image CDN throttled, a corporate proxy blocks `*.githubusercontent.com`,
your browser blocks animated images, or the page is just slow to render the
GIF — you can still watch the 26s VibeRaven Studio demo directly from the
[`studio-demo-v1` release](https://github.com/ohad6k/VibeRaven/releases/tag/studio-demo-v1).

## Watch it directly

The release page attaches the demo in four formats. Pick whichever loads for
you:

| Asset | Format | Notes |
|-------|--------|-------|
| [`viberaven-studio-demo-26s.mp4`](https://github.com/ohad6k/VibeRaven/releases/download/studio-demo-v1/viberaven-studio-demo-26s.mp4) | 1080p H.264, ~2 MB | Full 26s demo, with sound. Best quality; plays in any video app or browser. |
| [`viberaven-studio-demo-26s.webm`](https://github.com/ohad6k/VibeRaven/releases/download/studio-demo-v1/viberaven-studio-demo-26s.webm) | 1080p VP9, ~4.5 MB | Same demo, WebM container. Use this if your player doesn't support the MP4/H.264 combination. |
| [`viberaven-demo-hero.gif`](https://github.com/ohad6k/VibeRaven/releases/download/studio-demo-v1/viberaven-demo-hero.gif) | Animated GIF | 8s loop, the same clip used in the README hero. No sound, no player needed — opens directly in a browser tab or image viewer. |
| [`viberaven-demo-poster.jpg`](https://github.com/ohad6k/VibeRaven/releases/download/studio-demo-v1/viberaven-demo-poster.jpg) | Static JPEG | A single poster frame, if you just want a screenshot of what the Studio looks like. |

The [release notes](https://github.com/ohad6k/VibeRaven/releases/tag/studio-demo-v1)
list the same assets alongside a short description of what the demo shows.

## Why the README embed might not render

- **GitHub's CDN is slow or rate-limited.** GIFs embedded in a README are
  served from `user-images.githubusercontent.com` / `github.com`'s asset CDN;
  on a slow connection or during a CDN incident the image can time out before
  it loads. Reload the page, or use the direct MP4/WebM download links above.
- **A corporate proxy or ad blocker strips large images.** Some network
  policies block animated GIFs or images over a size threshold. The direct
  release links download the file instead of inline-rendering it, which
  usually bypasses that filtering.
- **You're viewing the README somewhere that doesn't render embedded assets**,
  such as a plain-text `cat README.md`, some third-party GitHub mirrors, or a
  markdown preview without image support. Use the direct links regardless of
  where you're reading the README.
- **Dark mode / high-contrast browser themes** can make a GIF with a light
  background hard to see. The poster JPEG or the MP4 (playable at full
  brightness in any video app) are easier to inspect in that case.

## Just want to try it instead of watching?

The fastest way to see the Studio is to run it locally — no video needed:

```bash
npx -y viberaven
```

That opens the Studio in your browser, entirely on your machine: no login, no
API key, no telemetry.
