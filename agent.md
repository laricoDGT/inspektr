# Inspektr — Agent Reference

Chrome / Chromium Extension (Manifest V3) for web developers and designers.

---

## 1. Project Structure

```
inspektr/
├── manifest.json              # MV3 manifest (activeTab, scripting, storage)
├── background/
│   └── service-worker.js      # Background worker: tab state & script injection
├── content/
│   └── content.js             # Content script router on inspected tab
├── popup/
│   ├── popup.html             # Extension popup launcher
│   ├── popup.css              # Popup styling (dark mode, glassmorphic)
│   └── popup.js               # Tool toggle logic & automatic popup closing
├── tools/
│   └── font-detector/
│       └── font-detector.js   # Isolated Shadow DOM typography inspector
├── shared/
│   ├── constants.js           # Shared action types, tools, and font lists
│   └── utils.js               # Helper utilities
├── assets/
│   └── icons/                 # Extension PNG icons (icon16, 32, 48, 128)
└── build.sh                   # Build & zip validation script
```

---

## 2. Core Architecture & Tool Lifecycle

1. **Activation**:
   - User opens extension popup and clicks a tool (e.g. **Font Detector**).
   - `popup.js` sends `{ action: 'TOGGLE_TOOL', tool: 'font-detector', tabId }` to `background/service-worker.js`.
   - `service-worker.js` ensures scripts are injected into the active tab via `chrome.scripting.executeScript` (`tools/font-detector/font-detector.js` + `content/content.js`), then sends `ACTIVATE_FONT_DETECTOR`.
   - Once activated, `popup.js` automatically calls `window.close()` to immediately reveal the inspected page.

2. **In-Page Inspection**:
   - `font-detector.js` mounts an isolated **Shadow DOM** (`#__inspektr-font-detector`) at `z-index: 2147483647`.
   - Renders a floating status bar at the top-right with an **Exit** button.
   - Crosshair cursor, live hover tooltip, and click-to-pin functionality.

3. **Deactivation**:
   - Clicking the red **Exit** button (or pressing <kbd>Esc</kbd>) calls `deactivate()`:
     - Cleans up DOM, overlays, and event listeners.
     - Sends `{ action: 'DEACTIVATE_FONT_DETECTOR' }` to `service-worker.js` to reset tab state to `false`.

---

## 3. Development Guidelines

- **Shadow DOM**: All in-page UI elements MUST live inside a closed Shadow DOM to avoid CSS conflicts with target websites.
- **Least Privilege**: Only use `activeTab`, `scripting`, and `storage`. Never add broad `<all_urls>` host permissions.
- **Pure JavaScript**: No external dependencies or bundlers required.
- **Icons**: Always use official PNG assets from `assets/icons/` (`icon32.png`, `icon48.png`, etc.).
- **Build / Packaging**: Run `bash build.sh` to validate `manifest.json` and generate `inspektr-v<version>.zip`.
