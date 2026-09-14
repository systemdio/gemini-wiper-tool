<p align="center"><img src="icons/icon128.png" width="96" height="96" /></p>
<h1 align="center">Gemini Wiper Tool</h1>

> **Bulk-delete your Google Gemini conversations — one click, fully local.**

<p align="center">
  <a href="https://addons.mozilla.org/firefox/addon/gemini-wipe/"><img src="https://img.shields.io/amo/v/gemini-wipe?style=for-the-badge&label=Firefox%20Add-ons&logo=firefox&logoColor=white&color=000000" alt="Firefox" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-black?style=for-the-badge" alt="MIT" /></a>
  <img src="https://img.shields.io/badge/Privacy-100%25%20Local-black?style=for-the-badge&logo=shield&logoColor=white" alt="Privacy" />
</p>

---

## Features

| | Feature | Detail |
|---|---|---|
| <img src="icons/icon16.png" width="16" height="16" /> | **One-click bulk delete** | Scan & delete 1 or 200+ conversations automatically |
| <img src="icons/icon16.png" width="16" height="16" /> | **Selective delete** | Check individual chats or All / None |
| <img src="icons/icon16.png" width="16" height="16" /> | **Search & filter** | Instant filter by title |
| <img src="icons/icon16.png" width="16" height="16" /> | **Export backup** | JSON export before deletion |
| <img src="icons/icon16.png" width="16" height="16" /> | **Speed control** | Fast / Balanced / Safe + delay slider (50–400ms) |
| <img src="icons/icon16.png" width="16" height="16" /> | **Undo 5s** | Grace period after start |
| <img src="icons/icon16.png" width="16" height="16" /> | **Shortcut** | Ctrl+Shift+D |
| <img src="icons/icon16.png" width="16" height="16" /> | **100% local** | No telemetry, stays in your browser |

---

## Installation

**AMO:** [**Gemini Wipe**](https://addons.mozilla.org/firefox/addon/gemini-wipe/) on [addons.mozilla.org](https://addons.mozilla.org).

**Manual — LibreWolf / Firefox:**

```bash
git clone https://github.com/systemdio/gemini-wiper-tool.git
cd gemini-wiper-tool
npm install && npm run build   # → dist/gemini-wiper-tool-*.zip
```

`about:config` → `xpinstall.signatures.required = false` (LibreWolf) → `about:addons` → Install From File → select `.zip`.

---

## Usage

1. Open [gemini.google.com](https://gemini.google.com)
2. Click the Gemini Wiper Tool icon
3. **Scan** → filter → select → **Delete selected** or **Delete all**

> **Warning:** Irreversible.

---

## Development

```bash
npm run dev    # live reload
npm run lint   # 0 errors required
npm run build  # lint + zip
```

```
gemini-wiper-tool/
├── manifest.json
├── background/background.js
├── content/{content.js, content.css}
├── popup/{popup.html, popup.css, popup.js}
├── icons/{icon.svg, *.png}
└── scripts/{generate-icons.js, zip.js}
```

---

## License

[MIT](LICENSE) © 2026 Gemini Wiper Tool contributors
