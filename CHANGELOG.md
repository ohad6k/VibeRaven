# Changelog

All notable changes to VibeRaven are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.5.1] - 2026-09-26

- `viberaven`, `@viberaven/cli` and `@viberaven/mcp` now ship together as 1.5.1.
- Experimental `viberaven rls-test` checks a declared permissions matrix locally with optional PGlite. Ambiguous results remain Unknown; local results do not prove production behavior. Worker startup failures and timeouts are reported without leaving the worker running.
- Stripe webhook checks more conservatively recognize signature verification in imported helpers. Environment-variable and database-pooler checks now require more specific repo evidence. These are static checks, not runtime verification.
- Studio full checks refresh the account plan. Credential retries and session-only sign-in preserve access when saving fails; sign-out remains effective in the current Studio when a saved token cannot be removed.

## [1.4.3] - 2026-07-07

### Added
- **Locked provider cards.** A provider that isn't in your project now renders as a locked card — its logo dimmed behind a gold lock seal — instead of a blank back, so you can see which provider it is and that it unlocks by adding it.
- **Sealed pack reveal.** Provider cards in the opening pack stay sealed until you flip them, then reveal the provider's foil face.

### Changed
- The Studio now reports a provider that isn't in your repo as **"Not detected"** instead of falsely showing "repo evidence found."
- The start-here call-to-action uses a more readable typeface.
- **PostHog** now always points to dashboard-ingestion proof — analytics ingestion can't be verified from repo code, so it's flagged for the provider dashboard.

### Fixed
- Provider detection no longer false-positives — Clerk on any `middleware.ts`, Resend on the word "email", Stripe on "webhook", or GitHub on a README no longer count as evidence of a provider.
- Locked cards now include the remove control when placed on the table.

## [1.4.2] - 2026-07-06

### Changed
- Pack-opening polish.

---

Releases before this changelog predate it; see the Git history and release tags for details.
