/**
 * Inspektr — Popup Script
 * Handles UI state, tool toggles, and communication with background service worker.
 * Automatically closes popup when a tool is activated for seamless workflow.
 */

import { ACTIONS, TOOLS } from '../shared/constants.js';

// ── State ──────────────────────────────────────────────
let currentTab           = null;
let isFontDetectorActive = false;
let isScanning           = false;

// ── DOM References ─────────────────────────────────────
const tabUrlEl           = document.getElementById('tab-url');
const tabDotEl           = document.getElementById('tab-dot');
const fontDetectorCard   = document.getElementById('tool-font-detector');
const fontDetectorToggle = document.getElementById('font-detector-toggle');
const fontDetectorBadge  = document.getElementById('font-detector-badge');
const scanPanel          = document.getElementById('scan-panel');
const fontsList          = document.getElementById('fonts-list');
const scanCloseBtn       = document.getElementById('scan-close');
const scanPageBtn        = document.getElementById('scan-page-btn');
const footerHint         = document.getElementById('footer-hint');

// ── Init ───────────────────────────────────────────────
async function init() {
  currentTab = await getActiveTab();

  if (currentTab) {
    displayTabInfo(currentTab);
    await syncToolState();
  }

  attachEventListeners();
}

/**
 * Get the currently active browser tab.
 */
async function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      resolve(tab || null);
    });
  });
}

/**
 * Display tab hostname in the header bar.
 */
function displayTabInfo(tab) {
  try {
    if (tab.url) {
      const url = new URL(tab.url);
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') ||
          tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
        tabUrlEl.textContent = 'Restricted page';
        tabDotEl.classList.remove('active');
        disableAllTools();
        return;
      }
      tabUrlEl.textContent = url.hostname + (url.pathname !== '/' ? url.pathname.slice(0, 24) : '');
      tabDotEl.classList.add('active');
    } else {
      tabUrlEl.textContent = 'Current page';
      tabDotEl.classList.add('active');
    }
  } catch {
    tabUrlEl.textContent = 'Current page';
    tabDotEl.classList.add('active');
  }
}

/** Disable tool cards on restricted pages. */
function disableAllTools() {
  fontDetectorCard.classList.add('coming-soon');
  fontDetectorCard.style.pointerEvents = 'none';
  footerHint.textContent = 'Not available on this page';
}

/**
 * Sync popup UI to the current tool state from background service worker.
 */
async function syncToolState() {
  if (!currentTab) return;
  chrome.runtime.sendMessage(
    { action: ACTIONS.GET_TAB_STATE, tabId: currentTab.id },
    (response) => {
      if (chrome.runtime.lastError || !response) return;
      const state = response.state;
      if (state.fontDetector !== isFontDetectorActive) {
        isFontDetectorActive = state.fontDetector;
        updateFontDetectorUI();
      }
    }
  );
}

// ── Event Listeners ────────────────────────────────────
function attachEventListeners() {
  fontDetectorCard.addEventListener('click', handleFontDetectorToggle);
  fontDetectorCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFontDetectorToggle();
    }
  });

  scanPageBtn.addEventListener('click', handleScanPage);
  scanCloseBtn.addEventListener('click', () => { scanPanel.hidden = true; });
}

// ── Font Detector Toggle ───────────────────────────────
async function handleFontDetectorToggle() {
  if (!currentTab) return;

  chrome.runtime.sendMessage(
    {
      action: ACTIONS.TOGGLE_TOOL,
      tool: TOOLS.FONT_DETECTOR,
      tabId: currentTab.id,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Inspektr] Toggle error:', chrome.runtime.lastError.message);
        return;
      }
      if (response?.success) {
        isFontDetectorActive = response.active;
        updateFontDetectorUI();

        // When activating the tool, automatically close popup so the user can inspect immediately
        if (isFontDetectorActive) {
          setTimeout(() => {
            window.close();
          }, 80);
        }
      }
    }
  );
}

/** Update the Font Detector card to reflect active/inactive state. */
function updateFontDetectorUI() {
  fontDetectorCard.classList.toggle('enabled', isFontDetectorActive);
  fontDetectorToggle.setAttribute('aria-checked', String(isFontDetectorActive));
  scanPageBtn.disabled = !isFontDetectorActive;

  if (fontDetectorBadge) {
    fontDetectorBadge.textContent = isFontDetectorActive ? 'Active' : 'Ready';
    fontDetectorBadge.className = isFontDetectorActive ? 'tool-badge active-badge' : 'tool-badge ready-badge';
  }

  footerHint.textContent = isFontDetectorActive
    ? 'Hover or click elements on the page'
    : 'Activate Font Detector first';
}

// ── Page Scan ──────────────────────────────────────────
async function handleScanPage() {
  if (!currentTab || isScanning) return;

  isScanning = true;
  scanPageBtn.disabled = true;
  scanPageBtn.textContent = 'Scanning...';

  fontsList.innerHTML = '<li class="scan-loading">Scanning page fonts</li>';
  scanPanel.hidden = false;

  chrome.runtime.sendMessage(
    { action: ACTIONS.SCAN_FONTS, tabId: currentTab.id },
    (response) => {
      isScanning = false;
      scanPageBtn.disabled = false;
      scanPageBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Scan Page Fonts
      `;

      if (chrome.runtime.lastError || !response?.success) {
        const msg = response?.error || 'Could not scan page. Try reloading.';
        fontsList.innerHTML = `<li class="scan-loading" style="color:#EF4444">${escapeHtml(msg)}</li>`;
        return;
      }

      renderFontsList(response.fonts || []);
    }
  );
}

/**
 * Render the scanned fonts list sorted by usage count.
 * @param {Array<{fontFamily: string, source: string, count: number}>} fonts
 */
function renderFontsList(fonts) {
  if (!fonts.length) {
    fontsList.innerHTML = '<li class="scan-loading">No fonts detected.</li>';
    return;
  }

  fonts.sort((a, b) => b.count - a.count);

  fontsList.innerHTML = fonts.map((font) => {
    const sourceClass = font.source === 'google-font' ? 'google'
                      : font.source === 'web-font'    ? 'web'
                      : 'system';
    const sourceLabel = font.source === 'google-font' ? 'Google'
                      : font.source === 'web-font'    ? 'Web'
                      : 'System';
    return `
      <li class="font-item" title="${escapeHtml(font.fontFamily)}">
        <span class="font-item-name">${escapeHtml(font.fontFamily)}</span>
        <span class="font-item-source ${sourceClass}">${sourceLabel}</span>
        <span class="font-item-count">${font.count}×</span>
      </li>
    `;
  }).join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Start ──────────────────────────────────────────────
init();
