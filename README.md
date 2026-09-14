# <img src="icons/icon48.png" width="28" height="28" align="center" /> Gemini Wiper

> **Bulk-delete your Google Gemini conversations — one click, fully local.**

<p align="center">
  <a href="https://addons.mozilla.org/firefox/addon/gemini-wiper/"><img src="https://img.shields.io/amo/v/gemini-wiper?style=for-the-badge&label=Firefox%20Add-ons&logo=firefox&logoColor=white&color=000000" alt="Firefox" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-black?style=for-the-badge" alt="MIT" /></a>
  <img src="https://img.shields.io/badge/Privacy-100%25%20Local-black?style=for-the-badge&logo=shield&logoColor=white" alt="Privacy" />
</p>

---

## Features

| | Feature | Detail |
|---|---|---|
| <img src="icons/icon16.png" width="16" height="16" /> | **One-click bulk delete** | Scan and delete 1 or 200+ conversations automatically |
| <img src="icons/icon16.png" width="16" height="16" /> | **Selective delete** | Check individual chats or All / None |
| <img src="icons/icon16.png" width="16" height="16" /> | **Speed control** | Fast / Balanced / Safe + delay slider (50–400ms) |
| <img src="icons/icon16.png" width="16" height="16" /> | **Stop anytime** | Abort mid-run instantly |
| <img src="icons/icon16.png" width="16" height="16" /> | **Live overlay** | Floating progress bar on Gemini page |
| <img src="icons/icon16.png" width="16" height="16" /> | **Full scan** | Auto-scrolls virtualized list until every conversation is found |
| <img src="icons/icon16.png" width="16" height="16" /> | **100% local** | No telemetry, no network — stays in your browser |
| <img src="icons/icon16.png" width="16" height="16" /> | **Monochrome UI** | Black & white minimal design |

---

## Installation

**AMO:** Search **Gemini Wiper** on [addons.mozilla.org](https://addons.mozilla.org).

**Manual — LibreWolf / Firefox:**

```bash
git clone https://github.com/systemdio/gemini-wiper.git
cd gemini-wiper
npm install && npm run build   # → dist/gemini-wiper-*.zip
```

`about:config` → `xpinstall.signatures.required = false` (LibreWolf) → `about:addons` → Install From File → select `.zip`.

---

## Usage

1. Open [gemini.google.com](https://gemini.google.com)
2. Click the Gemini Wiper icon
3. **Scan** → select chats → **Delete selected** or **Delete all**
4. Overlay shows progress — **Stop** to abort

> **Warning:** Irreversible. Deleted conversations cannot be recovered.

---

## Development

```bash
npm run dev    # live reload
npm run lint   # 0 errors required
npm run build  # lint + zip
```

```
gemini-wiper/
├── manifest.json
├── background/background.js
├── content/{content.js, content.css}
├── popup/{popup.html, popup.css, popup.js}
├── icons/{icon.svg, *.png}
└── scripts/{generate-icons.js, zip.js}
```

---

## License

[MIT](LICENSE) © 2026 Gemini Wiper contributors
