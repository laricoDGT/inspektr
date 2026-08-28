# Inspektr — Chrome Extension Agent Reference

> Multi-functional web developer toolkit, built as a Chrome (Chromium-compatible) extension.

> **Note for agents**: This project uses **Graphify** as the AI agent/tool to assist in developing, editing, and scaffolding this extension.

---

## Project Identity

| Field        | Value                                        |
|--------------|----------------------------------------------|
| Name         | **Inspektr**                                 |
| Agent Tool   | Graphify (used to build & edit this project) |
| Type         | Chrome / Chromium Browser Extension (MV3)    |
| Target       | Web Developers & Designers                   |
| Manifest Ver | Manifest V3 (MV3)                            |
| Entry Point  | `manifest.json`                              |

---

## Architecture Overview

```
inspektr/
├── manifest.json           # MV3 manifest — permissions, action, content scripts
├── background/
│   └── service-worker.js   # Background service worker (MV3)
├── content/
│   └── content.js          # Content script injected into pages
├── popup/
│   ├── popup.html          # Extension popup (tool launcher)
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup logic
├── panel/                  # DevTools panel (future)
│   └── ...
├── tools/
│   ├── font-detector/      # Tool 1 — Font Detector
│   │   ├── font-detector.js
│   │   └── font-detector.css
│   ├── color-picker/       # Tool 2 — Color Picker (planned)
│   ├── image-inspector/    # Tool 3 — Image Inspector (planned)
│   └── ...
├── assets/
│   ├── icons/              # Extension icons (16, 48, 128 px)
│   └── fonts/
└── shared/
    ├── utils.js            # Shared utilities
    └── constants.js        # Shared constants
```

---

## Tool Registry

| # | Tool Name         | Status     | Description                                              |
|---|-------------------|------------|----------------------------------------------------------|
| 1 | Font Detector     | ✅ Active  | Detect & inspect all fonts used on a web page            |
| 2 | Color Picker      | 🔜 Planned | Pick & analyze colors from any element on the page       |
| 3 | Image Inspector   | 🔜 Planned | List all images: format, size, resolution, alt text      |
| 4 | Spacing Inspector | 🔜 Planned | Visualize margin/padding/gap on any element              |
| 5 | CSS Variables     | 🔜 Planned | Extract all CSS custom properties (variables) from a page|
| 6 | Breakpoint Ruler  | 🔜 Planned | Visual viewport ruler and breakpoint helper              |
| 7 | Accessibility     | 🔜 Planned | Quick a11y audit: contrast ratio, ARIA roles, headings   |
| 8 | Grid Overlay      | 🔜 Planned | Toggle grid/flexbox overlay on any element               |

---

## Tech Stack

| Layer        | Technology                         |
|--------------|------------------------------------|
| Manifest     | Chrome Extension Manifest V3       |
| Scripting    | Vanilla JavaScript (ES Modules)    |
| Styling      | Vanilla CSS (custom properties)    |
| Icons        | SVG + PNG (16/48/128)              |
| Build        | None (no bundler initially)        |
| Permissions  | `activeTab`, `scripting`, `storage`|

---

## Design System

### Colors
```css
--inspektr-bg:         #0F1117;   /* Main dark background     */
--inspektr-surface:    #1A1D27;   /* Card / panel surface     */
--inspektr-border:     #2A2D3E;   /* Subtle borders           */
--inspektr-accent:     #7C6FE0;   /* Primary purple accent    */
--inspektr-accent-2:   #4ECDC4;   /* Teal secondary accent    */
--inspektr-text:       #E8EAF0;   /* Primary text             */
--inspektr-muted:      #6B7280;   /* Secondary / muted text   */
--inspektr-success:    #10B981;   /* Success green            */
--inspektr-warning:    #F59E0B;   /* Warning amber            */
```

### Typography
- **UI Font**: `Inter`, fallback `system-ui`
- **Mono Font**: `JetBrains Mono`, fallback `monospace`

### Sizing
- Popup width: `380px`
- Popup max-height: `580px`
- Border radius: `8px` (cards), `4px` (badges)

---

## Tool: Font Detector

### Goal
Replicate and extend the core functionality of **WhatFont** — detect every font family, weight, style, size and line-height used on any DOM element the user hovers or clicks.

### Features
- **Hover mode**: Tooltip appears on hover showing font info
- **Click to pin**: Click to pin a font card with full details
- **Page scan**: Scan all elements and list unique fonts used
- **Copy**: One-click copy of font name / CSS value
- **Google Fonts link**: If font is a Google Font, show a direct link

### Data Collected per Element
```js
{
  fontFamily:   string,    // e.g. "Inter"
  fontWeight:   string,    // e.g. "700"
  fontStyle:    string,    // e.g. "italic"
  fontSize:     string,    // e.g. "16px"
  lineHeight:   string,    // e.g. "24px"
  letterSpacing:string,    // e.g. "0.02em"
  color:        string,    // e.g. "#1A1D27"
  source:       string,    // "web-font" | "system-font" | "google-font"
  element:      string,    // e.g. "h1", "p", ".hero-title"
}
```

### Implementation Strategy
1. Content script listens for `mousemove` to track hovered element
2. `getComputedStyle(element)` extracts font properties
3. `document.fonts` API queries loaded font faces
4. Tooltip is injected into the DOM as a shadow DOM element (avoids CSS collision)
5. Pinned cards are stored in a floating panel (also shadow DOM)
6. Full page scan iterates all visible text nodes

---

## Coding Guidelines

- All tools **must use Shadow DOM** to avoid CSS/JS conflicts with host pages
- Content scripts communicate with popup via `chrome.runtime.sendMessage`
- No external libraries in content scripts (pure JS only)
- Use `chrome.storage.local` for persisting user preferences
- All strings must be in English (UI copy)
- Prefer `const` / `let` over `var`
- Use `async/await` over raw Promises where possible

---

## Manifest Permissions

```json
{
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["<all_urls>"]
}
```

---

## Build & Load Instructions

1. Clone / open project folder in your editor
2. Open Chrome → `chrome://extensions`
3. Enable **Developer Mode** (top right toggle)
4. Click **"Load unpacked"** → select the project root folder
5. Graphify icon appears in the toolbar

---

## Versioning Strategy

| Version | Milestone                              |
|---------|----------------------------------------|
| 0.1.0   | Font Detector (hover + page scan)      |
| 0.2.0   | Color Picker tool                      |
| 0.3.0   | Image Inspector tool                   |
| 0.4.0   | CSS Variables extractor                |
| 1.0.0   | Chrome Web Store submission ready      |

---

*Last updated: 2026-08-28 — Inspektr v0.1.0 roadmap*
