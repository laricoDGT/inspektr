/**
 * Inspektr — Shared Utilities
 */

import { GOOGLE_FONTS, SYSTEM_FONTS } from './constants.js';

/**
 * Extract complete font information from a DOM element.
 * @param {Element} el
 * @returns {object}
 */
export function getFontInfo(el) {
  const style = window.getComputedStyle(el);
  const rawFamily = style.fontFamily;

  // Parse the first font family (before any fallbacks)
  const primaryFont = parseFirstFont(rawFamily);

  return {
    fontFamily: primaryFont,
    fontFamilyRaw: rawFamily,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    color: style.color,
    textTransform: style.textTransform,
    source: detectFontSource(primaryFont),
    element: getElementLabel(el),
  };
}

/**
 * Parse the first font name from a CSS font-family string.
 * Handles quoted names like "Open Sans", 'Roboto', Arial, etc.
 * @param {string} fontFamilyStr
 * @returns {string}
 */
export function parseFirstFont(fontFamilyStr) {
  const first = fontFamilyStr.split(',')[0].trim();
  // Remove surrounding quotes
  return first.replace(/^["']|["']$/g, '');
}

/**
 * Detect whether a font is a Google Font, system font, or web font.
 * @param {string} fontName
 * @returns {'google-font'|'system-font'|'web-font'}
 */
export function detectFontSource(fontName) {
  if (GOOGLE_FONTS.has(fontName)) return 'google-font';
  if (SYSTEM_FONTS.has(fontName)) return 'system-font';
  // Check if it's loaded as a web font
  try {
    if (document.fonts && document.fonts.check(`16px "${fontName}"`)) {
      return 'web-font';
    }
  } catch (_) {}
  return 'system-font';
}

/**
 * Get a short human-readable label for an element.
 * @param {Element} el
 * @returns {string}
 */
export function getElementLabel(el) {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const cls = el.classList.length > 0 ? `.${el.classList[0]}` : '';
  return `${tag}${id || cls}`;
}

/**
 * Convert an rgb() / rgba() color string to hex.
 * @param {string} rgb — e.g. "rgb(26, 29, 39)"
 * @returns {string} — e.g. "#1a1d27"
 */
export function rgbToHex(rgb) {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

/**
 * Get the perceived luminance of a color (0=dark, 1=light).
 * @param {string} hex
 * @returns {number}
 */
export function getLuminance(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0.5;
  const [, r, g, b] = result.map((v, i) => {
    if (i === 0) return 0;
    const c = parseInt(v, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Build a Google Fonts URL for a given font family.
 * @param {string} fontName
 * @returns {string}
 */
export function getGoogleFontsUrl(fontName) {
  const encoded = encodeURIComponent(fontName);
  return `https://fonts.google.com/specimen/${encoded}`;
}

/**
 * Normalize a font weight value to a human-readable label.
 * @param {string} weight — e.g. "700"
 * @returns {string} — e.g. "Bold (700)"
 */
export function fontWeightLabel(weight) {
  const map = {
    '100': 'Thin (100)',
    '200': 'Extra Light (200)',
    '300': 'Light (300)',
    '400': 'Regular (400)',
    '500': 'Medium (500)',
    '600': 'Semi Bold (600)',
    '700': 'Bold (700)',
    '800': 'Extra Bold (800)',
    '900': 'Black (900)',
  };
  return map[weight] || weight;
}

/**
 * Normalize line-height to a human-readable value.
 * @param {string} lineHeight
 * @param {string} fontSize
 * @returns {string}
 */
export function lineHeightLabel(lineHeight, fontSize) {
  if (lineHeight === 'normal') return 'normal';
  const lh = parseFloat(lineHeight);
  const fs = parseFloat(fontSize);
  if (!isNaN(lh) && !isNaN(fs) && fs > 0) {
    const ratio = (lh / fs).toFixed(2);
    return `${lineHeight} (×${ratio})`;
  }
  return lineHeight;
}

/**
 * Copy text to clipboard (works in content script context).
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    // Fallback for browsers that restrict clipboard in content scripts
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}
