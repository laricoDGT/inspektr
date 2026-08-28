/**
 * Inspektr — Font Detector Tool
 * Injects a Shadow DOM tooltip for hover-based font inspection.
 * Exposes InspektrFontDetector class to window.
 */

(function () {
  'use strict';

  // ── Constants ─────────────────────────────────────
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

  // ── CSS for Shadow DOM ───────────────────────────
  const TOOLTIP_CSS = `
    :host {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      pointer-events: none;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .wd-tooltip {
      position: fixed;
      background: #1A1D27;
      border: 1px solid #2A2D3E;
      border-radius: 10px;
      padding: 0;
      min-width: 230px;
      max-width: 280px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,111,224,0.15);
      animation: wdFadeIn 0.15s cubic-bezier(0.4,0,0.2,1);
      overflow: hidden;
      pointer-events: all;
      font-size: 12px;
      color: #E8EAF0;
      -webkit-font-smoothing: antialiased;
    }

    @keyframes wdFadeIn {
      from { opacity: 0; transform: scale(0.95) translateY(4px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Header */
    .wd-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px 8px;
      border-bottom: 1px solid #2A2D3E;
      background: linear-gradient(135deg, rgba(124,111,224,0.12) 0%, transparent 60%);
    }

    .wd-font-name {
      font-size: 13px;
      font-weight: 700;
      color: #E8EAF0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .wd-source-badge {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 99px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .wd-source-badge.google {
      background: rgba(66,133,244,0.15);
      color: #6BA3F7;
      border: 1px solid rgba(66,133,244,0.3);
    }
    .wd-source-badge.system {
      background: rgba(107,114,128,0.15);
      color: #8B90A0;
      border: 1px solid #2A2D3E;
    }
    .wd-source-badge.web {
      background: rgba(78,205,196,0.12);
      color: #4ECDC4;
      border: 1px solid rgba(78,205,196,0.3);
    }

    /* Properties grid */
    .wd-props {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .wd-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }

    .wd-label {
      font-size: 10px;
      color: #555A6E;
      font-weight: 500;
      min-width: 60px;
      flex-shrink: 0;
    }

    .wd-value {
      font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
      font-size: 11px;
      color: #C4C8D8;
      text-align: right;
      word-break: break-all;
    }

    .wd-value.highlight {
      color: #7C6FE0;
    }

    /* Color swatch */
    .wd-color-wrap {
      display: flex;
      align-items: center;
      gap: 5px;
      justify-content: flex-end;
    }

    .wd-swatch {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      border: 1px solid rgba(255,255,255,0.15);
      flex-shrink: 0;
    }

    /* Divider */
    .wd-divider {
      height: 1px;
      background: #2A2D3E;
      margin: 2px 0;
    }

    /* Actions bar */
    .wd-actions {
      display: flex;
      border-top: 1px solid #2A2D3E;
    }

    .wd-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 8px;
      background: none;
      border: none;
      color: #8B90A0;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 10.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .wd-btn:hover {
      background: #22263A;
      color: #E8EAF0;
    }

    .wd-btn:not(:last-child) {
      border-right: 1px solid #2A2D3E;
    }

    .wd-btn.copied {
      color: #10B981;
    }

    /* Element label */
    .wd-element-chip {
      display: inline-flex;
      align-items: center;
      padding: 1px 6px;
      background: rgba(124,111,224,0.12);
      border: 1px solid rgba(124,111,224,0.2);
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #9B91E8;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Hint tooltip (shown at cursor before click) */
    .wd-cursor-hint {
      position: fixed;
      background: #0F1117;
      border: 1px solid #2A2D3E;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 11px;
      color: #8B90A0;
      pointer-events: none;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      animation: wdFadeIn 0.12s ease;
    }

    /* Overlay highlight */
    .wd-highlight-overlay {
      position: fixed;
      pointer-events: none;
      border: 2px solid rgba(124,111,224,0.7);
      border-radius: 2px;
      background: rgba(124,111,224,0.06);
      transition: all 0.08s;
      z-index: 2147483646;
    }
  `;

  // ── Font Detector Class ───────────────────────────
  class InspektrFontDetector {
    constructor() {
      this._active      = false;
      this._host        = null;     // Shadow DOM host
      this._shadow      = null;
      this._tooltip     = null;
      this._hint        = null;
      this._overlay     = null;
      this._pinned      = [];
      this._currentEl   = null;
      this._copyTimeout = null;

      // Bound event handlers (for clean removal)
      this._onMouseMove  = this._onMouseMove.bind(this);
      this._onClick      = this._onClick.bind(this);
      this._onKeyDown    = this._onKeyDown.bind(this);
      this._onScroll     = this._onScroll.bind(this);
    }

    // ── Lifecycle ──────────────────────────────────
    activate() {
      if (this._active) return;
      this._active = true;

      this._createShadowHost();
      this._createOverlay();

      document.addEventListener('mousemove', this._onMouseMove, { passive: true });
      document.addEventListener('click',     this._onClick,     true);
      document.addEventListener('keydown',   this._onKeyDown);
      document.addEventListener('scroll',    this._onScroll,    { passive: true });

      document.body.style.cursor = 'crosshair';
    }

    deactivate() {
      if (!this._active) return;
      this._active = false;

      document.removeEventListener('mousemove', this._onMouseMove);
      document.removeEventListener('click',     this._onClick,   true);
      document.removeEventListener('keydown',   this._onKeyDown);
      document.removeEventListener('scroll',    this._onScroll);

      this._removeOverlay();
      this._hideTooltip();
      this._hideHint();

      if (this._host) {
        this._host.remove();
        this._host = null;
        this._shadow = null;
      }

      document.body.style.cursor = '';
    }

    // ── Shadow DOM Setup ──────────────────────────
    _createShadowHost() {
      this._host = document.createElement('div');
      this._host.id = '__inspektr-font-detector';
      this._host.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;pointer-events:none;';
      document.documentElement.appendChild(this._host);

      this._shadow = this._host.attachShadow({ mode: 'closed' });

      // Inject styles
      const style = document.createElement('style');
      style.textContent = TOOLTIP_CSS;
      this._shadow.appendChild(style);

      // Import Google Fonts into shadow
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap';
      this._shadow.appendChild(link);
    }

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

    // ── Event Handlers ────────────────────────────
    _onMouseMove(e) {
      // Find text-containing element under cursor
      const el = this._getTextElement(e.target);
      if (!el || el === this._currentEl) return;
      this._currentEl = el;

      const info = this._getFontInfo(el);
      this._showTooltip(info, e.clientX, e.clientY);
      this._showOverlay(el);
    }

    _onClick(e) {
      if (!this._active) return;

      // Don't interfere with our own tooltip buttons
      if (this._host && this._host.contains(e.target)) return;

      e.preventDefault();
      e.stopPropagation();

      const el = this._getTextElement(e.target);
      if (!el) return;

      const info = this._getFontInfo(el);
      this._pinTooltip(info);
    }

    _onKeyDown(e) {
      if (e.key === 'Escape') {
        this.deactivate();
        // Notify background to update state
        chrome.runtime.sendMessage({ action: 'DEACTIVATE_FONT_DETECTOR' });
      }
    }

    _onScroll() {
      this._hideTooltip();
      this._currentEl = null;
    }

    // ── Font Extraction ───────────────────────────
    _getFontInfo(el) {
      const style  = window.getComputedStyle(el);
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
      // Walk up until we find a real text element
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

    // ── Color Helpers ─────────────────────────────
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
      const map = { '100':'Thin','200':'ExtraLight','300':'Light',
        '400':'Regular','500':'Medium','600':'SemiBold',
        '700':'Bold','800':'ExtraBold','900':'Black' };
      return map[w] ? `${map[w]} (${w})` : w;
    }

    _lineHeightLabel(lh, fs) {
      if (lh === 'normal') return 'normal';
      const l = parseFloat(lh), f = parseFloat(fs);
      if (!isNaN(l) && !isNaN(f) && f > 0) {
        return `${lh} (×${(l/f).toFixed(2)})`;
      }
      return lh;
    }

    // ── Tooltip Rendering ─────────────────────────
    _showTooltip(info, x, y) {
      this._hideTooltip();
      if (!this._shadow) return;

      const hex  = this._rgbToHex(info.color);
      const lum  = this._getLuminance(hex);
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
      el.className = 'wd-tooltip';
      el.innerHTML = `
        <div class="wd-header">
          <span class="wd-font-name" title="${this._esc(info.fontFamilyRaw)}">${this._esc(info.fontFamily)}</span>
          <span class="wd-source-badge ${sourceClass}">${sourceLabel}</span>
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
          <button class="wd-btn" id="wd-copy-name" title="Copy font name">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy name
          </button>
          <button class="wd-btn" id="wd-copy-css" title="Copy CSS font-family">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            Copy CSS
          </button>
          ${isGoogle ? `
          <a class="wd-btn" href="${googleUrl}" target="_blank" rel="noopener" title="View on Google Fonts">
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

      // Bind copy buttons
      el.querySelector('#wd-copy-name')?.addEventListener('click', () => {
        this._copy(info.fontFamily, el.querySelector('#wd-copy-name'));
      });
      el.querySelector('#wd-copy-css')?.addEventListener('click', () => {
        this._copy(`font-family: '${info.fontFamily}';`, el.querySelector('#wd-copy-css'));
      });
    }

    _hideTooltip() {
      if (this._tooltip) {
        this._tooltip.remove();
        this._tooltip = null;
      }
    }

    _showHint(x, y) {
      this._hideHint();
      const hint = document.createElement('div');
      hint.className = 'wd-cursor-hint';
      hint.textContent = 'Click to pin';
      hint.style.left = `${x + 16}px`;
      hint.style.top  = `${y + 16}px`;
      this._shadow?.appendChild(hint);
      this._hint = hint;
    }

    _hideHint() {
      this._hint?.remove();
      this._hint = null;
    }

    _pinTooltip(info) {
      // For now, tooltip remains visible — future: create pinned card panel
      // This is already handled by the tooltip staying after click
    }

    // ── Highlight Overlay ─────────────────────────
    _showOverlay(el) {
      if (!this._overlay) return;
      const rect = el.getBoundingClientRect();
      this._overlay.style.cssText = `
        display: block;
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px solid rgba(124,111,224,0.7);
        border-radius: 2px;
        background: rgba(124,111,224,0.06);
        pointer-events: none;
        z-index: 2147483646;
        transition: all 0.1s;
      `;
    }

    // ── Page Scan ─────────────────────────────────
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

    // ── Positioning ───────────────────────────────
    _positionElement(el, x, y) {
      const pad    = 12;
      const vpW    = window.innerWidth;
      const vpH    = window.innerHeight;
      const width  = 260;
      const height = 280; // approximate

      let left = x + 16;
      let top  = y + 16;

      if (left + width > vpW - pad)  left = x - width - 8;
      if (top  + height > vpH - pad) top  = y - height - 8;
      if (left < pad) left = pad;
      if (top  < pad) top  = pad;

      el.style.position = 'fixed';
      el.style.left     = `${left}px`;
      el.style.top      = `${top}px`;
    }

    // ── Clipboard ─────────────────────────────────
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
        }, 1500);
      }
    }

    // ── Utils ─────────────────────────────────────
    _esc(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  }

  // Expose to content script loader
  window.InspektrFontDetector = InspektrFontDetector;
})();
