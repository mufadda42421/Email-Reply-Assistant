import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, CheckCircle2 } from 'lucide-react';
import { downloadExtensionZip } from '../utils/extensionDownloader';

interface ExtensionCodeViewerProps {
  onDownloadZip: () => void;
}

export const ExtensionCodeViewer: React.FC<ExtensionCodeViewerProps> = ({ onDownloadZip }) => {
  const [selectedFile, setSelectedFile] = useState<string>('manifest.json');
  const [copied, setCopied] = useState(false);

  const fileContents: Record<string, { desc: string; code: string; language: string }> = {
    'manifest.json': {
      desc: 'Chrome Extension Manifest V3 descriptor registering popup, background service worker, and Gmail content scripts.',
      language: 'json',
      code: `{
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
    },
    'popup.html': {
      desc: 'Extension popup user interface featuring email input, 6 tone selectors, length presets, 3 alternative reply cards, and Quick Polish.',
      language: 'html',
      code: `<!-- Full popup interface rendered in 400x600px extension window -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Email Reply Assistant</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup-container">
    <header class="app-header">
      <div class="header-brand">
        <div class="brand-logo">...</div>
        <h1>Email Reply Assistant</h1>
      </div>
      <button id="settingsBtn">Settings</button>
    </header>
    ...
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
    },
    'popup.js': {
      desc: 'Controls popup interactions, calls backend proxy, manages clipboard copying, and sends messages to Gmail content scripts.',
      language: 'javascript',
      code: `// Communicates with backend proxy and active Gmail tabs
document.addEventListener('DOMContentLoaded', async () => {
  const prefs = await getStorage(['defaultTone', 'defaultLength']);
  generateBtn.addEventListener('click', async () => {
    const res = await fetch('/api/generate-reply', {
      method: 'POST',
      body: JSON.stringify({ emailContent, tone, length })
    });
    const data = await res.json();
    renderReplies(data.replies);
  });
});`,
    },
    'content.js': {
      desc: 'Injected into mail.google.com to detect Gmail composition areas, inject the AI Reply button into the toolbar, and insert replies into drafts.',
      language: 'javascript',
      code: `// Gmail content script
const observer = new MutationObserver(() => injectAssistantButtons());
observer.observe(document.body, { childList: true, subtree: true });

function injectAssistantButtons() {
  const toolbars = document.querySelectorAll('.btC, [role="toolbar"]');
  toolbars.forEach(tb => {
    if (tb.querySelector('.era-gmail-compose-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'era-gmail-compose-btn';
    btn.innerText = 'AI Reply';
    btn.onclick = () => openGmailAssistantModal(tb);
    tb.appendChild(btn);
  });
}`,
    },
    'background.js': {
      desc: 'Manifest V3 Service Worker managing lifecycle, context menus for highlighted email text, and storage synchronization.',
      language: 'javascript',
      code: `// Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'era_reply_selection',
    title: 'Generate Reply with Email Assistant',
    contexts: ['selection']
  });
});`,
    },
    'options.html': {
      desc: 'Options & preferences page to configure default tone, default reply length, preferred language, and custom API proxy.',
      language: 'html',
      code: `<!-- Extension Options Page -->
<div class="container">
  <h1>Email Reply Assistant Settings</h1>
  <select id="prefTone">...</select>
  <select id="prefLength">...</select>
  <input id="prefProxyUrl" />
</div>`,
    },
  };

  const handleCopyCode = async () => {
    const code = fileContents[selectedFile]?.code || '';
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[580px]">
      {/* Header bar */}
      <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">
            Manifest V3 Extension Source Package
          </h2>
        </div>

        <button
          onClick={onDownloadZip}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Extension (.zip)</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* File tree list */}
        <div className="w-full md:w-56 bg-slate-950/50 border-r border-slate-800 p-2 space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-2 py-1.5">
            Extension Files
          </div>
          {Object.keys(fileContents).map((fileName) => (
            <button
              key={fileName}
              onClick={() => setSelectedFile(fileName)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition ${
                selectedFile === fileName
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{fileName}</span>
              {fileName === 'manifest.json' && (
                <span className="text-[9px] bg-indigo-500/30 px-1 rounded text-indigo-300">
                  V3
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Code display */}
        <div className="flex-1 flex flex-col bg-[#0b0e17] overflow-hidden">
          {/* File description sub-header */}
          <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{selectedFile}: </span>
              {fileContents[selectedFile]?.desc}
            </div>

            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File</span>
                </>
              )}
            </button>
          </div>

          {/* Preformatted code body */}
          <div className="flex-1 p-4 overflow-auto">
            <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
              {fileContents[selectedFile]?.code}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
