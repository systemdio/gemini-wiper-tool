# Changelog

All notable changes to **Gemini Cleaner** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

## [1.2.1] — 2026-09-17

### Fixed
- Fixed "Could not establish connection" error by switching to `browser.tabs.sendMessage` with explicit tab targeting and retry logic.
- Added spacing between info text and "Open Gemini" button on wrong-page view.

## [1.2.0] — 2026-09-16

### Added
- Initial release.
- One-click bulk deletion of all Gemini conversations.
- Floating overlay with live count and Stop button.
- Popup with per-session stats and last-run summary.
- Greyscale toolbar icon when not on `gemini.google.com`.
- `npm run dev` via `web-ext` for rapid iteration.
- `npm run build` packages a ready-to-submit `.zip`.
- MIT licence, `CONTRIBUTING.md`, `CHANGELOG.md`.
