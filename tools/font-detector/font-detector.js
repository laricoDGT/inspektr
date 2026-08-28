/**
 * Inspektr — Font Detector Tool
 * Injects an isolated Shadow DOM inspector for typography diagnostics.
 * Supports live hover detection, click-to-pin, text selection, and quick exit.
 */

(function () {
  'use strict';

  if (window.InspektrFontDetector) return;

  // ── Known Fonts Database ──────────────────────────
  const GOOGLE_FONTS = new Set([
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway',
    'PT Sans', 'Merriweather', 'Nunito', 'Playfair Display', 'Poppins',
    'Ubuntu', 'Fira Sans', 'Noto Sans', 'Source Sans Pro', 'Titillium Web',
    'Inconsolata', 'Oxygen', 'Droid Sans', 'Crimson Text', 'Cabin',
    'Josefin Sans', 'Libre Baskerville', 'Pacifico', 'Lobster',
    'Dancing Script', 'Shadows Into Light', 'Indie Flower', 'Amatic SC',
    'Caveat', 'Comfortaa', 'Righteous', 'Inter', 'Plus Jakarta Sans',
    'DM Sans', 'Space Grotesk', 'Outfit', 'Sora', 'Lexend', 'Manrope',
    'Albert Sans', 'Figtree', 'Work Sans', 'Rubik', 'Mulish', 'Quicksand',
    'Barlow', 'Exo 2', 'Kanit', 'Prompt', 'Noto Serif', 'Libre Franklin',
    'EB Garamond', 'Cormorant Garamond', 'Lora', 'PT Serif', 'Bitter',
    'Spectral', 'Arvo', 'JetBrains Mono', 'Fira Code', 'Source Code Pro',
    'Space Mono', 'Roboto Mono', 'IBM Plex Mono', 'DM Mono',
  ]);

  // ── Shadow DOM CSS Styles ─────────────────────────
  const TOOLTIP_CSS = `
    :host {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      pointer-events: none;
      font-family: system-ui, -apple-system, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Floating Exit & Status Bar ── */
    .wd-control-bar {
      position: fixed;
      top: 16px;
      right: 20px;
      background: #11141E;
      border: 1px solid #282C3F;
      border-radius: 99px;
      padding: 6px 10px 6px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(124, 111, 224, 0.25);
      pointer-events: auto;
      z-index: 2147483647;
      animation: wdFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      cursor: default;
    }

    .wd-control-brand {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: #E8EAF0;
    }
    .wd-control-brand span { color: #9B8FF5; }

    .wd-control-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 10.5px;
      font-weight: 600;
      color: #10B981;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 2px 8px;
      border-radius: 99px;
    }

    .wd-control-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 6px #10B981;
      animation: wdPulse 2s infinite;
    }

    @keyframes wdPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }

    .wd-control-exit {
      background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%);
      border: 2px solid #FCA5A5;
      color: #FFFFFF;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      padding: 6px 14px;
      border-radius: 99px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 3px 12px rgba(239, 68, 68, 0.5), 0 0 0 1px rgba(185, 28, 28, 0.4);
      transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .wd-control-exit:hover {
      background: linear-gradient(135deg, #F87171 0%, #DC2626 100%);
      border-color: #FFFFFF;
      color: #FFFFFF;
      box-shadow: 0 4px 18px rgba(239, 68, 68, 0.75), 0 0 16px rgba(239, 68, 68, 0.6);
      transform: translateY(-1px) scale(1.04);
    }
    .wd-control-exit:active {
      transform: translateY(0) scale(0.97);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
    }

    /* ── Inspector Tooltip Card ── */
    .wd-tooltip {
      position: fixed;
      background: #151824;
      border: 1px solid #2A2E44;
      border-radius: 12px;
      padding: 0;
      min-width: 250px;
      max-width: 290px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(124, 111, 224, 0.15);
      animation: wdFadeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      pointer-events: auto;
      font-size: 12px;
      color: #E8EAF0;
      -webkit-font-smoothing: antialiased;
      cursor: default;
      user-select: text;
    }

    .wd-tooltip.pinned {
      border-color: #7C6FE0;
      box-shadow: 0 14px 44px rgba(0, 0, 0, 0.7), 0 0 0 1.5px #7C6FE0;
    }

    @keyframes wdFadeIn {
      from { opacity: 0; transform: scale(0.96) translateY(4px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Card Header */
    .wd-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 12px 9px;
      border-bottom: 1px solid #22263A;
      background: linear-gradient(135deg, rgba(124, 111, 224, 0.15) 0%, transparent 65%);
    }

    .wd-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      flex: 1;
    }

    .wd-font-name {
      font-size: 13.5px;
      font-weight: 700;
      color: #FFFFFF;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .wd-source-badge {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 99px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .wd-source-badge.google {
      background: rgba(66, 133, 244, 0.15);
      color: #6BA3F7;
      border: 1px solid rgba(66, 133, 244, 0.3);
    }
    .wd-source-badge.system {
      background: rgba(107, 114, 128, 0.15);
      color: #8B90A0;
      border: 1px solid #2A2D3E;
    }
    .wd-source-badge.web {
      background: rgba(78, 205, 196, 0.12);
      color: #4ECDC4;
      border: 1px solid rgba(78, 205, 196, 0.3);
    }

    .wd-header-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .wd-pin-indicator {
      font-size: 9px;
      font-weight: 700;
      color: #7C6FE0;
      background: rgba(124, 111, 224, 0.15);
      border: 1px solid rgba(124, 111, 224, 0.3);
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .wd-close-btn {
      background: transparent;
      border: none;
      color: #7C8299;
      cursor: pointer;
      font-size: 14px;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.15s;
    }
    .wd-close-btn:hover {
      color: #FFFFFF;
      background: #252A3D;
    }

    /* Properties Grid */
    .wd-props {
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .wd-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
    }

    .wd-label {
      font-size: 10.5px;
      color: #6C7289;
      font-weight: 500;
      min-width: 60px;
      flex-shrink: 0;
    }

    .wd-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 11px;
      color: #C8CDDE;
      text-align: right;
      word-break: break-all;
      user-select: text;
    }

    .wd-value.highlight {
      color: #9B8FF5;
      font-weight: 600;
    }

    .wd-color-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      justify-content: flex-end;
    }

    .wd-swatch {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      flex-shrink: 0;
    }

    .wd-divider {
      height: 1px;
      background: #22263A;
      margin: 3px 0;
    }

    /* Actions Bar */
    .wd-actions {
      display: flex;
      border-top: 1px solid #22263A;
      background: #11141E;
    }

    .wd-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 9px 8px;
      background: none;
      border: none;
      color: #8C92A6;
      font-family: system-ui, sans-serif;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      text-decoration: none;
    }

    .wd-btn:hover {
      background: #1D2130;
      color: #FFFFFF;
    }

    .wd-btn:not(:last-child) {
      border-right: 1px solid #22263A;
    }

    .wd-btn.copied {
      color: #10B981;
      font-weight: 600;
    }

    .wd-element-chip {
      display: inline-flex;
      align-items: center;
      padding: 1px 6px;
      background: rgba(124, 111, 224, 0.12);
      border: 1px solid rgba(124, 111, 224, 0.25);
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #A99FF7;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Element Highlight Overlay */
    .wd-highlight-overlay {
      position: fixed;
      pointer-events: none;
      border: 2px solid rgba(124, 111, 224, 0.85);
      border-radius: 3px;
      background: rgba(124, 111, 224, 0.08);
      transition: all 0.08s ease-out;
      z-index: 2147483646;
    }
  `;

  // ── Inspektr Font Detector Controller ─────────────
  class InspektrFontDetector {
    constructor() {
      this._active      = false;
      this._host        = null;
      this._shadow      = null;
      this._tooltip     = null;
      this._controlBar  = null;
      this._overlay     = null;
      this._currentEl   = null;
      this._pinnedEl    = null;
      this._isPinned    = false;
      this._copyTimeout = null;

      // Event handlers bound to instance
      this._onMouseMove = this._onMouseMove.bind(this);
      this._onClick     = this._onClick.bind(this);
      this._onKeyDown   = this._onKeyDown.bind(this);
      this._onScroll    = this._onScroll.bind(this);
    }

    // ── Activate Tool ──────────────────────────────
    activate() {
      if (this._active) return;
      this._active = true;
      this._isPinned = false;
      this._pinnedEl = null;

      this._createShadowHost();
      this._createOverlay();
      this._createControlBar();

      document.addEventListener('mousemove', this._onMouseMove, { passive: true });
      document.addEventListener('click',     this._onClick,     true);
      document.addEventListener('keydown',   this._onKeyDown);
      document.addEventListener('scroll',    this._onScroll,    { passive: true });

      document.body.style.cursor = 'crosshair';
    }

    // ── Deactivate Tool ────────────────────────────
    deactivate() {
      if (!this._active) return;
      this._active = false;
      this._isPinned = false;
      this._pinnedEl = null;

      document.removeEventListener('mousemove', this._onMouseMove);
      document.removeEventListener('click',     this._onClick,   true);
      document.removeEventListener('keydown',   this._onKeyDown);
      document.removeEventListener('scroll',    this._onScroll);

      this._removeOverlay();
      this._hideTooltip();

      if (this._host) {
        this._host.remove();
        this._host = null;
        this._shadow = null;
      }

      document.body.style.cursor = '';
    }

    // ── Shadow DOM Host ────────────────────────────
    _createShadowHost() {
      this._host = document.createElement('div');
      this._host.id = '__inspektr-font-detector';
      this._host.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;pointer-events:none;width:100%;height:100%;';
      document.documentElement.appendChild(this._host);

      this._shadow = this._host.attachShadow({ mode: 'closed' });

      // Inject custom styling
      const style = document.createElement('style');
      style.textContent = TOOLTIP_CSS;
      this._shadow.appendChild(style);

      // Uses native system-ui fonts (zero external network requests)
    }

    // ── Floating Exit Bar ──────────────────────────
    _createControlBar() {
      if (!this._shadow) return;

      const bar = document.createElement('div');
      bar.className = 'wd-control-bar';
      bar.innerHTML = `
        <div class="wd-control-brand">
          <img src="${chrome.runtime.getURL('assets/icons/icon32.png')}" width="16" height="16" alt="Inspektr" style="display:block;border-radius:3px;" />
          Inspektr
        </div>
        <div class="wd-control-pill">
          <span class="wd-control-dot"></span>
          Font Detector
        </div>
        <button class="wd-control-exit" id="wd-exit-button" title="Exit Font Detector (or press ESC)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Exit
        </button>
      `;

      bar.querySelector('#wd-exit-button')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deactivate();
        chrome.runtime.sendMessage({ action: 'DEACTIVATE_FONT_DETECTOR' });
      });

      this._shadow.appendChild(bar);
      this._controlBar = bar;
    }

    // ── Highlighting Overlay ───────────────────────
    _createOverlay() {
      this._overlay = document.createElement('div');
      this._overlay.className = 'wd-highlight-overlay';
      this._overlay.style.cssText = 'display:none;position:fixed;pointer-events:none;z-index:2147483646;';
      document.documentElement.appendChild(this._overlay);
    }

    _removeOverlay() {
      if (this._overlay) {
        this._overlay.remove();
        this._overlay = null;
      }
    }

    _showOverlay(el) {
      if (!this._overlay || !el) return;
      const rect = el.getBoundingClientRect();
      this._overlay.style.cssText = `
        display: block;
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px solid rgba(124, 111, 224, 0.85);
        border-radius: 3px;
        background: rgba(124, 111, 224, 0.08);
        pointer-events: none;
        z-index: 2147483646;
        transition: all 0.08s ease-out;
      `;
    }

    // ── Event Handlers ─────────────────────────────
    _onMouseMove(e) {
      // If mouse is inside Inspektr's own UI (tooltip or control bar), don't trigger re-inspect
      const path = e.composedPath ? e.composedPath() : [];
      if (this._host && path.includes(this._host)) return;

      // If user has pinned an element, keep that element pinned and do not follow hover
      if (this._isPinned) return;

      const el = this._getTextElement(e.target);
      if (!el || el === this._currentEl) return;
      this._currentEl = el;

      const info = this._getFontInfo(el);
      this._renderTooltip(info, e.clientX, e.clientY, false);
      this._showOverlay(el);
    }

    _onClick(e) {
      if (!this._active) return;

      // Allow native clicks on our own buttons (copy, exit, close, external links)
      const path = e.composedPath ? e.composedPath() : [];
      if (this._host && path.includes(this._host)) return;

      e.preventDefault();
      e.stopPropagation();

      const el = this._getTextElement(e.target);
      if (!el) return;

      // Pin the inspector on this element
      this._isPinned = true;
      this._pinnedEl = el;
      this._currentEl = el;

      const info = this._getFontInfo(el);
      this._renderTooltip(info, e.clientX, e.clientY, true);
      this._showOverlay(el);
    }

    _onKeyDown(e) {
      if (e.key === 'Escape') {
        if (this._isPinned) {
          // ESC unpins first
          this._unpin();
        } else {
          // ESC deactivates the tool
          this.deactivate();
          chrome.runtime.sendMessage({ action: 'DEACTIVATE_FONT_DETECTOR' });
        }
      }
    }

    _onScroll() {
      if (!this._isPinned) {
        this._hideTooltip();
        this._currentEl = null;
        if (this._overlay) this._overlay.style.display = 'none';
      } else if (this._pinnedEl) {
        // Re-align overlay with pinned element position after scroll
        this._showOverlay(this._pinnedEl);
      }
    }

    _unpin() {
      this._isPinned = false;
      this._pinnedEl = null;
      this._hideTooltip();
      if (this._overlay) this._overlay.style.display = 'none';
    }

    // ── Tooltip Rendering ──────────────────────────
    _renderTooltip(info, x, y, isPinned) {
      this._hideTooltip();
      if (!this._shadow) return;

      const hex = this._rgbToHex(info.color);
      const lum = this._getLuminance(hex);
      const swatchBorder = lum > 0.85 ? '#444' : 'transparent';

      const sourceClass = info.source === 'google-font' ? 'google'
                        : info.source === 'web-font'    ? 'web'
                        : 'system';
      const sourceLabel = info.source === 'google-font' ? 'Google'
                        : info.source === 'web-font'    ? 'Web Font'
                        : 'System';

      const isGoogle = info.source === 'google-font';
      const googleUrl = isGoogle
        ? `https://fonts.google.com/specimen/${encodeURIComponent(info.fontFamily)}`
        : null;

      const el = document.createElement('div');
      el.className = `wd-tooltip ${isPinned ? 'pinned' : ''}`;
      el.innerHTML = `
        <div class="wd-header">
          <div class="wd-header-left">
            <span class="wd-font-name" title="${this._esc(info.fontFamilyRaw)}">${this._esc(info.fontFamily)}</span>
            <span class="wd-source-badge ${sourceClass}">${sourceLabel}</span>
          </div>
          <div class="wd-header-right">
            ${isPinned ? '<span class="wd-pin-indicator">Pinned</span>' : ''}
            ${isPinned ? '<button class="wd-close-btn" id="wd-close-tooltip" title="Unpin (ESC)">✕</button>' : ''}
          </div>
        </div>
        <div class="wd-props">
          <div class="wd-row">
            <span class="wd-label">Element</span>
            <span class="wd-element-chip">${this._esc(info.element)}</span>
          </div>
          <div class="wd-divider"></div>
          <div class="wd-row">
            <span class="wd-label">Weight</span>
            <span class="wd-value highlight">${this._esc(this._weightLabel(info.fontWeight))}</span>
          </div>
          <div class="wd-row">
            <span class="wd-label">Size</span>
            <span class="wd-value">${this._esc(info.fontSize)}</span>
          </div>
          <div class="wd-row">
            <span class="wd-label">Style</span>
            <span class="wd-value">${this._esc(info.fontStyle)}</span>
          </div>
          <div class="wd-row">
            <span class="wd-label">Line-h</span>
            <span class="wd-value">${this._esc(this._lineHeightLabel(info.lineHeight, info.fontSize))}</span>
          </div>
          ${info.letterSpacing !== '0px' ? `
          <div class="wd-row">
            <span class="wd-label">Tracking</span>
            <span class="wd-value">${this._esc(info.letterSpacing)}</span>
          </div>` : ''}
          <div class="wd-row">
            <span class="wd-label">Color</span>
            <div class="wd-color-wrap">
              <span class="wd-swatch" style="background:${hex};border-color:${swatchBorder}"></span>
              <span class="wd-value">${hex}</span>
            </div>
          </div>
        </div>
        <div class="wd-actions">
          <button class="wd-btn" id="wd-copy-name" title="Copy font family name">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy name
          </button>
          <button class="wd-btn" id="wd-copy-css" title="Copy font-family CSS declaration">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            Copy CSS
          </button>
          ${isGoogle ? `
          <a class="wd-btn" href="${googleUrl}" target="_blank" rel="noopener" title="Open font specimen on Google Fonts">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Google Fonts
          </a>` : ''}
        </div>
      `;

      this._positionElement(el, x, y);
      this._shadow.appendChild(el);
      this._tooltip = el;

      // Bind actions
      el.querySelector('#wd-copy-name')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._copy(info.fontFamily, el.querySelector('#wd-copy-name'));
      });

      el.querySelector('#wd-copy-css')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._copy(`font-family: '${info.fontFamily}', ${info.fontFamilyRaw};`, el.querySelector('#wd-copy-css'));
      });

      el.querySelector('#wd-close-tooltip')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._unpin();
      });
    }

    _hideTooltip() {
      if (this._tooltip) {
        this._tooltip.remove();
        this._tooltip = null;
      }
    }

    // ── Font Extraction ────────────────────────────
    _getFontInfo(el) {
      const style = window.getComputedStyle(el);
      const rawFam = style.fontFamily;
      const primary = this._parseFirstFont(rawFam);

      return {
        fontFamily:    primary,
        fontFamilyRaw: rawFam,
        fontWeight:    style.fontWeight,
        fontStyle:     style.fontStyle,
        fontSize:      style.fontSize,
        lineHeight:    style.lineHeight,
        letterSpacing: style.letterSpacing,
        color:         style.color,
        source:        this._detectSource(primary),
        element:       this._getLabel(el),
      };
    }

    _parseFirstFont(str) {
      const first = str.split(',')[0].trim();
      return first.replace(/^["']|["']$/g, '');
    }

    _detectSource(name) {
      if (GOOGLE_FONTS.has(name)) return 'google-font';
      try {
        if (document.fonts?.check(`16px "${name}"`)) return 'web-font';
      } catch (_) {}
      return 'system-font';
    }

    _getLabel(el) {
      const tag = el.tagName.toLowerCase();
      const id  = el.id ? `#${el.id}` : '';
      const cls = el.classList.length ? `.${el.classList[0]}` : '';
      return `${tag}${id || cls}`;
    }

    _getTextElement(el) {
      if (!el || el === document.documentElement || el === document.body) return null;
      let node = el;
      while (node && node !== document.body) {
        const style = window.getComputedStyle(node);
        if (style.fontFamily && node.innerText?.trim().length > 0) {
          return node;
        }
        node = node.parentElement;
      }
      return el;
    }

    // ── Color Utilities ────────────────────────────
    _rgbToHex(rgb) {
      const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return rgb;
      return '#' + [m[1], m[2], m[3]]
        .map(v => parseInt(v).toString(16).padStart(2, '0'))
        .join('');
    }

    _getLuminance(hex) {
      const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!res) return 0.5;
      const [r, g, b] = [res[1], res[2], res[3]].map(v => {
        const c = parseInt(v, 16) / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    _weightLabel(w) {
      const map = {
        '100': 'Thin (100)', '200': 'ExtraLight (200)', '300': 'Light (300)',
        '400': 'Regular (400)', '500': 'Medium (500)', '600': 'SemiBold (600)',
        '700': 'Bold (700)', '800': 'ExtraBold (800)', '900': 'Black (900)'
      };
      return map[w] || w;
    }

    _lineHeightLabel(lh, fs) {
      if (lh === 'normal') return 'normal';
      const l = parseFloat(lh), f = parseFloat(fs);
      if (!isNaN(l) && !isNaN(f) && f > 0) {
        return `${lh} (×${(l / f).toFixed(2)})`;
      }
      return lh;
    }

    // ── Tooltip Placement ──────────────────────────
    _positionElement(el, x, y) {
      const pad    = 16;
      const vpW    = window.innerWidth;
      const vpH    = window.innerHeight;
      const width  = 270;
      const height = 290;

      let left = x + 18;
      let top  = y + 18;

      if (left + width > vpW - pad)  left = Math.max(pad, x - width - 12);
      if (top  + height > vpH - pad) top  = Math.max(pad, y - height - 12);
      if (left < pad) left = pad;
      if (top  < pad) top  = pad;

      el.style.position = 'fixed';
      el.style.left     = `${left}px`;
      el.style.top      = `${top}px`;
    }

    // ── Clipboard Copying ──────────────────────────
    async _copy(text, btn) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }

      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = '✓ Copied!';
        btn.classList.add('copied');
        clearTimeout(this._copyTimeout);
        this._copyTimeout = setTimeout(() => {
          btn.innerHTML = original;
          btn.classList.remove('copied');
        }, 1600);
      }
    }

    // ── Page Scan ──────────────────────────────────
    scanPage() {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const text = node.nodeValue?.trim();
            if (!text) return NodeFilter.FILTER_REJECT;
            const el = node.parentElement;
            if (!el) return NodeFilter.FILTER_REJECT;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      const fontMap = new Map();
      let node;

      while ((node = walker.nextNode())) {
        const el = node.parentElement;
        if (!el) continue;

        const style   = window.getComputedStyle(el);
        const rawFam  = style.fontFamily;
        const primary = this._parseFirstFont(rawFam);
        const source  = this._detectSource(primary);

        if (fontMap.has(primary)) {
          fontMap.get(primary).count++;
        } else {
          fontMap.set(primary, { fontFamily: primary, source, count: 1 });
        }
      }

      return Array.from(fontMap.values());
    }

    _esc(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  }

  // Expose controller globally
  window.InspektrFontDetector = InspektrFontDetector;
})();
