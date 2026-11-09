/**
 * Email Reply Assistant - Background Service Worker (Manifest V3)
 */

chrome.runtime.onInstalled.addListener(() => {
  // Set default preferences in storage
  chrome.storage.sync.get(['defaultTone', 'defaultLength', 'defaultLanguage'], (result) => {
    const defaults = {};
    if (!result.defaultTone) defaults.defaultTone = 'Professional';
    if (!result.defaultLength) defaults.defaultLength = 'Medium';
    if (!result.defaultLanguage) defaults.defaultLanguage = 'English';

    if (Object.keys(defaults).length > 0) {
      chrome.storage.sync.set(defaults);
    }
  });

  // Remove existing context menu before creating to prevent duplicate ID errors on reload
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'era_reply_selection',
      title: 'Generate Reply with Email Assistant',
      contexts: ['selection'],
    });
  });
});

// Context menu click listener
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'era_reply_selection' && info.selectionText) {
    chrome.storage.local.set({ lastSelectedText: info.selectionText }, () => {
      if (chrome.action && typeof chrome.action.openPopup === 'function') {
        chrome.action.openPopup().catch(() => {});
      }
    });
  }
});

// Message listener for content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING') {
    sendResponse({ status: 'PONG', version: '1.1.0' });
    return true;
  }
});
