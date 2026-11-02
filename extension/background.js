/**
 * Email Reply Assistant - Background Service Worker (Manifest V3)
 */

chrome.runtime.onInstalled.addListener((details) => {
  // Set default settings
  chrome.storage.sync.get(['defaultTone', 'defaultLength', 'defaultLanguage'], (result) => {
    const defaults = {};
    if (!result.defaultTone) defaults.defaultTone = 'Professional';
    if (!result.defaultLength) defaults.defaultLength = 'Medium';
    if (!result.defaultLanguage) defaults.defaultLanguage = 'English';

    if (Object.keys(defaults).length > 0) {
      chrome.storage.sync.set(defaults);
    }
  });

  // Create context menu for selected email text
  chrome.contextMenus.create({
    id: 'era_reply_selection',
    title: 'Generate Reply with Email Assistant',
    contexts: ['selection'],
  });
});

// Context menu click listener
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'era_reply_selection' && info.selectionText) {
    chrome.storage.local.set({ lastSelectedText: info.selectionText }, () => {
      // In Manifest V3, we can open the action popup programmatically where supported
      if (chrome.action && chrome.action.openPopup) {
        chrome.action.openPopup();
      }
    });
  }
});

// Message listener for content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING') {
    sendResponse({ status: 'PONG', version: '1.0.0' });
    return true;
  }
});
