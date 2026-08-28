/**
 * Inspektr — Content Script
 * Injected into every page. Acts as router for tool modules.
 * Tools are loaded lazily when activated.
 */

(function () {
  'use strict';

  // Prevent double-injection
  if (window.__inspektrLoaded) return;
  window.__inspektrLoaded = true;

  /** @type {InspektrFontDetector|null} */
  let fontDetectorInstance = null;

  /**
   * Lazy-loads the Font Detector tool.
   * @returns {Promise<FontDetector>}
   */
  async function loadFontDetector() {
    if (fontDetectorInstance) return fontDetectorInstance;

    // Dynamically load the font detector module
    const src = chrome.runtime.getURL('tools/font-detector/font-detector.js');
    await import(src);

    fontDetectorInstance = new window.InspektrFontDetector();
    return fontDetectorInstance;
  }

  /**
   * Message router — listens for commands from the background service worker.
   */
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const { action } = message;

    if (action === 'ACTIVATE_FONT_DETECTOR') {
      loadFontDetector().then((detector) => {
        detector.activate();
        sendResponse({ success: true });
      }).catch((err) => {
        console.error('[Inspektr] Failed to load Font Detector:', err);
        sendResponse({ success: false, error: err.message });
      });
      return true; // async response
    }

    if (action === 'DEACTIVATE_FONT_DETECTOR') {
      if (fontDetectorInstance) {
        fontDetectorInstance.deactivate();
      }
      sendResponse({ success: true });
      return true;
    }

    if (action === 'SCAN_FONTS') {
      loadFontDetector().then((detector) => {
        const results = detector.scanPage();
        sendResponse({ success: true, fonts: results });
      }).catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }

    return false;
  });
})();
