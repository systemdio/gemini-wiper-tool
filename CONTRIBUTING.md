# Contributing to Gemini Cleaner

Thank you for helping make Gemini Cleaner better! 🎉

## Reporting issues

- **Broken selectors?** Open an issue with the current DOM structure you observed
  (copy the relevant HTML from DevTools).
- **Feature requests?** Describe your use case — we prefer simple, focused features.
- **Security concerns?** Email privately before opening a public issue.

## Making changes

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b fix/update-selectors
   ```
2. Install dependencies and run in dev mode:
   ```bash
   npm install
   npm run icons
   npm run dev
   ```
3. Make your changes. Follow the existing code style (plain ES2022+, no bundler).
4. Lint before opening a PR:
   ```bash
   npm run lint
   ```
5. Commit with a clear message (`fix: update delete menu selector`).
6. Open a Pull Request — describe **what** changed and **why**.

## Code style

- Plain JavaScript (no TypeScript, no bundler) for maximum transparency.
- All DOM selectors live in the `SELECTORS` constant in `content/content.js` so
  they can be updated without touching logic.
- Comments > clever code.

## Licence

By contributing you agree your changes will be released under the [MIT licence](LICENSE).
