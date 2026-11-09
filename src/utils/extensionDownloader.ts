import JSZip from 'jszip';

export const EXTENSION_FILES: Record<string, string> = {
  'manifest.json': `{
  "manifest_version": 3,
  "name": "Email Reply Assistant",
  "version": "1.1.0",
  "description": "Reply smarter. Write faster. AI-powered email assistant with seamless Gmail integration using Google Gemini API.",
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    },
    "default_title": "Email Reply Assistant"
  },
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },
  "background": {
    "service_worker": "background.js"
  },
  "permissions": [
    "storage",
    "activeTab",
    "clipboardWrite",
    "contextMenus"
  ],
  "host_permissions": [
    "https://mail.google.com/*",
    "http://*/*",
    "https://*/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "https://mail.google.com/*"
      ],
      "js": [
        "content.js"
      ],
      "css": [
        "content.css"
      ],
      "run_at": "document_idle"
    }
  ]
}`,
  'background.js': `/**
 * Email Reply Assistant - Background Service Worker (Manifest V3)
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['defaultTone', 'defaultLength', 'defaultLanguage'], (result) => {
    const defaults = {};
    if (!result.defaultTone) defaults.defaultTone = 'Professional';
    if (!result.defaultLength) defaults.defaultLength = 'Medium';
    if (!result.defaultLanguage) defaults.defaultLanguage = 'English';

    if (Object.keys(defaults).length > 0) {
      chrome.storage.sync.set(defaults);
    }
  });

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'era_reply_selection',
      title: 'Generate Reply with Email Assistant',
      contexts: ['selection'],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'era_reply_selection' && info.selectionText) {
    chrome.storage.local.set({ lastSelectedText: info.selectionText }, () => {
      if (chrome.action && typeof chrome.action.openPopup === 'function') {
        chrome.action.openPopup().catch(() => {});
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING') {
    sendResponse({ status: 'PONG', version: '1.1.0' });
    return true;
  }
});`,
  'README.md': `# Email Reply Assistant - Chrome Extension (Manifest V3)
Reply smarter. Write faster.

## IMPORTANT FOLDER SELECTION NOTE FOR CHROME:
When you unzip this archive, make sure you open the folder where "manifest.json" is directly located!
If you see an error like "Could not load manifest" or "Could not load background script ''", you have selected the outer parent folder instead of the folder containing "manifest.json".

### Quick Installation:
1. Extract "email-reply-assistant.zip".
2. Open Google Chrome and go to: chrome://extensions
3. Turn ON "Developer mode" in the top-right corner.
4. Click "Load unpacked" in the top-left corner.
5. Select the folder that directly contains "manifest.json", "background.js", and "popup.html".
6. Done! Open Gmail or click the extension puzzle piece icon.
`,
};

export async function downloadExtensionZip(): Promise<void> {
  const zip = new JSZip();

  // Try fetching the complete extension zip from the server
  try {
    const res = await fetch('/api/extension/download');
    if (res.ok) {
      const blob = await res.blob();
      triggerBlobDownload(blob, 'email-reply-assistant.zip');
      return;
    }
  } catch (err) {
    console.warn('Server zip download endpoint unavailable, generating via JSZip...', err);
  }

  // Fallback: Fetch each file from the /extension/ public directory
  const filesToFetch = [
    'manifest.json',
    'background.js',
    'popup.html',
    'popup.css',
    'popup.js',
    'content.js',
    'content.css',
    'options.html',
    'options.js',
  ];

  for (const filename of filesToFetch) {
    try {
      const fileRes = await fetch(`/extension/${filename}`);
      if (fileRes.ok) {
        const text = await fileRes.text();
        zip.file(filename, text);
        continue;
      }
    } catch {}

    if (EXTENSION_FILES[filename]) {
      zip.file(filename, EXTENSION_FILES[filename]);
    }
  }

  zip.file('README.md', EXTENSION_FILES['README.md']);

  // Add icon files to both root and icons/ folder for absolute compatibility
  try {
    const iconRes = await fetch('/extension/icon16.png');
    if (iconRes.ok) {
      const iconBlob = await iconRes.blob();
      zip.file('icon16.png', iconBlob);
      zip.file('icon48.png', iconBlob);
      zip.file('icon128.png', iconBlob);

      const iconsFolder = zip.folder('icons');
      if (iconsFolder) {
        iconsFolder.file('icon16.png', iconBlob);
        iconsFolder.file('icon48.png', iconBlob);
        iconsFolder.file('icon128.png', iconBlob);
      }
    }
  } catch {
    // Ignored
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(zipBlob, 'email-reply-assistant.zip');
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
