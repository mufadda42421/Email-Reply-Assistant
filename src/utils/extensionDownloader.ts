import JSZip from 'jszip';

export const EXTENSION_FILES: Record<string, string> = {
  'manifest.json': `{
  "manifest_version": 3,
  "name": "Email Reply Assistant",
  "version": "1.1.0",
  "description": "Reply smarter. Write faster. AI-powered email assistant with seamless Gmail integration using Google Gemini API.",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "Email Reply Assistant"
  },
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "permissions": [
    "storage",
    "activeTab",
    "clipboardWrite"
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
  'README.md': `# Email Reply Assistant - Chrome Extension (Manifest V3)
Reply smarter. Write faster.

## Quick Installation Instructions (30 seconds):
1. Unzip the downloaded file: \`email-reply-assistant.zip\`.
2. Open Google Chrome and navigate to: \`chrome://extensions\`.
3. In the top-right corner, turn ON **"Developer mode"**.
4. In the top-left corner, click **"Load unpacked"**.
5. Select the unzipped folder containing \`manifest.json\`.
6. Done! Open Gmail or click the extension puzzle piece icon to start replying!

## Features:
- 3 contextual alternative replies for every email.
- Gmail composition detection and one-click draft insertion.
- Quick email polishing: Grammar fix, executive professional tone, concise reduction, and warm friendliness.
- Powered by Google Gemini API.
- 100% Guest-only, zero sign-in required.
`,
};

export async function downloadExtensionZip(): Promise<void> {
  const zip = new JSZip();

  // Try fetching existing server extension files or pack directly
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

  // Fallback: Generate dynamically with JSZip
  for (const [filename, content] of Object.entries(EXTENSION_FILES)) {
    zip.file(filename, content);
  }

  // Add sample PNG icon placeholders if missing
  const iconsFolder = zip.folder('icons');
  if (iconsFolder) {
    try {
      const icon16Res = await fetch('/extension/icons/icon16.png');
      if (icon16Res.ok) {
        const icon16Blob = await icon16Res.blob();
        iconsFolder.file('icon16.png', icon16Blob);
        iconsFolder.file('icon48.png', icon16Blob);
        iconsFolder.file('icon128.png', icon16Blob);
      }
    } catch {
      // Ignored
    }
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
