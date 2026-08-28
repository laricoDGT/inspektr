/**
 * Inspektr — Service Worker (Background Script)
 * Handles messaging between popup and content scripts.
 * Manages per-tab tool state.
 * Uses activeTab + scripting for on-demand injection (no host_permissions needed).
 */

// State: tracks which tools are active per tab
const tabState = new Map();

/**
 * Get (or initialize) the state object for a given tab.
 * @param {number} tabId
 * @returns {{ fontDetector: boolean }}
 */
function getTabState(tabId) {
  if (!tabState.has(tabId)) {
    tabState.set(tabId, { fontDetector: false });
  }
  return tabState.get(tabId);
}

// ── Tab lifecycle cleanup ──────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  tabState.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    // Page navigated — reset tool state
    tabState.delete(tabId);
  }
});

/**
 * Inject the content script into a tab (idempotent — safe to call multiple times
 * because content.js guards against double-injection via window.__inspektrLoaded).
 * Requires activeTab grant (triggered when user clicks the extension icon).
 * @param {number} tabId
 * @returns {Promise<boolean>} true if injection succeeded
 */
async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ['tools/font-detector/font-detector.js', 'content/content.js'],
    });
    return true;
  } catch (err) {
    // Restricted pages (chrome://, edge://, file://, etc.) will throw here.
    console.warn('[Inspektr] Cannot inject into this page:', err.message);
    return false;
  }
}

/**
 * Send a message to the content script, injecting it first if necessary.
 * @param {number} tabId
 * @param {object} msg
 */
async function sendToContent(tabId, msg) {
  const injected = await ensureContentScript(tabId);
  if (!injected) return;

  // Small delay to let the content script initialize after fresh injection
  await new Promise((r) => setTimeout(r, 50));

  try {
    await chrome.tabs.sendMessage(tabId, msg);
  } catch (err) {
    console.warn('[Inspektr] sendMessage failed:', err.message);
  }
}

// ── Message router ─────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { action, tool, tabId: msgTabId } = message;

  // ── Toggle a tool on/off ──
  if (action === 'TOGGLE_TOOL') {
    (async () => {
      const state = getTabState(msgTabId);

      if (tool === 'font-detector') {
        state.fontDetector = !state.fontDetector;
        const activate = state.fontDetector;

        await sendToContent(msgTabId, {
          action: activate ? 'ACTIVATE_FONT_DETECTOR' : 'DEACTIVATE_FONT_DETECTOR',
        });

        sendResponse({ success: true, active: activate });
      } else {
        sendResponse({ success: false, error: 'Unknown tool' });
      }
    })();

    return true; // keep channel open for async
  }

  // ── Deactivate tool (e.g. from in-page Exit button or Esc key) ──
  if (action === 'DEACTIVATE_FONT_DETECTOR') {
    const targetTabId = _sender?.tab?.id || msgTabId;
    if (targetTabId) {
      const state = getTabState(targetTabId);
      state.fontDetector = false;
    }
    sendResponse({ success: true, active: false });
    return true;
  }

  // ── Query tool state from popup ──
  if (action === 'GET_TAB_STATE') {
    const state = getTabState(msgTabId);
    sendResponse({ state });
    return true;
  }

  // ── Trigger page scan ──
  if (action === 'SCAN_FONTS') {
    (async () => {
      const injected = await ensureContentScript(msgTabId);
      if (!injected) {
        sendResponse({ success: false, error: 'Cannot access this page.' });
        return;
      }
      await new Promise((r) => setTimeout(r, 50));
      try {
        const response = await chrome.tabs.sendMessage(msgTabId, { action: 'SCAN_FONTS' });
        sendResponse(response);
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  return false;
});
