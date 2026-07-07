# Changelog

All notable changes to VibeRaven are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
