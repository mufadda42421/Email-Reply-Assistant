import React, { useState } from 'react';
import {
  Download,
  Chrome,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  FolderOpen,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface InstallGuideProps {
  onDownloadZip: () => void;
}

export const InstallGuide: React.FC<InstallGuideProps> = ({ onDownloadZip }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadClick = async () => {
    setDownloading(true);
    try {
      await onDownloadZip();
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Chrome className="w-6 h-6 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Install & Update Chrome Extension
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              v1.1.0 Latest
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manifest V3 extension package with pre-configured secure HTTPS backend proxy and resilient Gmail integration.
          </p>
        </div>

        <button
          onClick={handleDownloadClick}
          disabled={downloading}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          {downloading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Packaging v1.1.0...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Extension v1.1.0 (.zip)</span>
            </>
          )}
        </button>
      </div>

      {/* What's New in v1.1.0 Card */}
      <div className="bg-gradient-to-r from-indigo-950/40 to-purple-950/30 border border-indigo-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
            What's New in v1.1.0:
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs text-slate-300">
          <div className="flex items-start gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span><strong>CORS & Preflight Fix:</strong> Direct connection to live cloud API with zero "Failed to fetch" errors.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span><strong>Pre-configured Proxy:</strong> Automatically points to the secure HTTPS backend proxy out of the box.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span><strong>Resilient Gmail Assistant:</strong> Floating toolbar widget now includes automatic contextual fallback.</span>
          </div>
        </div>
      </div>

      {/* Tabs / Two Section Grid: Fresh Install vs Updating */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Fresh Install */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <FolderOpen className="w-4 h-4 text-indigo-400" />
            <span>Fresh Installation (30 Seconds)</span>
          </div>

          <ol className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong>Download & Extract:</strong> Download <code className="text-indigo-300">email-reply-assistant.zip</code> and unzip it to a folder on your computer.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong>Open chrome://extensions:</strong> Open Chrome, navigate to <code className="text-indigo-300 font-mono">chrome://extensions</code>, and toggle <strong>Developer mode</strong> in the top-right.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong>Load Unpacked:</strong> Click <strong>"Load unpacked"</strong> in the top-left and select the unzipped directory containing <code className="text-indigo-300 font-mono">manifest.json</code>.
              </div>
            </li>
          </ol>
        </div>

        {/* Updating Existing Installation */}
        <div className="bg-slate-950/70 border border-indigo-500/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>How to Update Existing Installation</span>
          </div>

          <ol className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong>Download New v1.1.0 Zip:</strong> Click the download button to get the updated archive.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong>Replace Existing Folder:</strong> Extract and overwrite the files in your existing extension directory on your machine.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong>Click Reload in Chrome:</strong> Go to <code className="text-indigo-300 font-mono">chrome://extensions</code> and click the circular <strong>Reload (🔄)</strong> button on the Email Reply Assistant card.
              </div>
            </li>
          </ol>
        </div>
      </div>

      {/* Gmail Banner */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Active in Gmail</div>
            <div className="text-[11px] text-slate-400">
              Open any Gmail thread or click "Reply" to see the injected purple <strong>AI Reply</strong> button ready to use.
            </div>
          </div>
        </div>

        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition font-semibold"
        >
          <span>Open Gmail</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
