import React, { useState, useEffect } from 'react';
import {
  Mail,
  Sparkles,
  Download,
  Settings,
  Chrome,
  Inbox,
  FileCode,
  HelpCircle,
  ShieldCheck,
  Check,
  ExternalLink,
  Laptop,
  Smartphone,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { UserPreferences } from './types';
import { ExtensionPopup } from './components/ExtensionPopup';
import { GmailSimulator } from './components/GmailSimulator';
import { SettingsModal } from './components/SettingsModal';
import { ExtensionCodeViewer } from './components/ExtensionCodeViewer';
import { InstallGuide } from './components/InstallGuide';
import { downloadExtensionZip } from './utils/extensionDownloader';

export default function App() {
  // Navigation views
  const [activeView, setActiveView] = useState<'simulator' | 'popup' | 'files' | 'guide'>('simulator');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [injectedDraft, setInjectedDraft] = useState<{ body: string; subject?: string } | null>(null);

  // User preferences (persisted in localStorage for guest experience)
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    let savedProxy = localStorage.getItem('era_apiProxyUrl') || '';
    if (
      savedProxy.includes('localhost') &&
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost'
    ) {
      savedProxy = '';
    }
    return {
      defaultTone: (localStorage.getItem('era_defaultTone') as any) || 'Professional',
      defaultLength: (localStorage.getItem('era_defaultLength') as any) || 'Medium',
      defaultLanguage: localStorage.getItem('era_defaultLanguage') || 'English',
      apiProxyUrl: savedProxy,
    };
  });

  const handleSavePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('era_defaultTone', newPrefs.defaultTone);
    localStorage.setItem('era_defaultLength', newPrefs.defaultLength);
    localStorage.setItem('era_defaultLanguage', newPrefs.defaultLanguage);
    localStorage.setItem('era_apiProxyUrl', newPrefs.apiProxyUrl);
  };

  const handleInsertToGmail = (body: string, subject?: string) => {
    setInjectedDraft({ body, subject });
    setActiveView('simulator');
  };

  const handleDownload = () => {
    downloadExtensionZip();
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0c121e]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                Email Reply Assistant
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30">
                Manifest V3 • v1.1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Reply smarter. Write faster.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 gap-1 text-xs">
          <button
            onClick={() => setActiveView('simulator')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeView === 'simulator'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Gmail Simulator & Extension</span>
            <span className="md:hidden">Gmail</span>
          </button>

          <button
            onClick={() => setActiveView('popup')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeView === 'popup'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Popup Only View</span>
            <span className="md:hidden">Popup</span>
          </button>

          <button
            onClick={() => setActiveView('files')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeView === 'files'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Extension Files</span>
            <span className="md:hidden">Files</span>
          </button>

          <button
            onClick={() => setActiveView('guide')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeView === 'guide'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Chrome className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Install in Chrome</span>
            <span className="md:hidden">Install</span>
          </button>
        </nav>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Download full unpacked extension (.zip) for Chrome"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Download (.zip)</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
            title="Settings & Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Guest mode reassurance banner */}
        <div className="mb-4 px-4 py-2 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Guest-Only Mode:</strong> No sign-in or account creation required. All AI email replies are powered by Gemini API via secure proxy.
            </span>
          </div>
          <span className="text-[11px] text-indigo-400 hidden sm:inline">
            Never hardcodes secrets
          </span>
        </div>

        {activeView === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
            {/* Left: Extension Popup Widget */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Live Extension Popup (400px)
                </span>
                <span className="text-[11px] text-slate-500">Simulates Chrome toolbar click</span>
              </div>
              <ExtensionPopup
                preferences={preferences}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onInsertToGmail={handleInsertToGmail}
              />
            </div>

            {/* Right: Gmail Web Simulator */}
            <div className="lg:col-span-7 flex flex-col flex-1">
              <div className="w-full flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Gmail Integration Environment
                </span>
                <span className="text-[11px] text-slate-500">
                  Inspect injected AI Reply button & compose draft
                </span>
              </div>
              <GmailSimulator
                preferences={preferences}
                injectedDraft={injectedDraft}
                onClearInjectedDraft={() => setInjectedDraft(null)}
              />
            </div>
          </div>
        )}

        {activeView === 'popup' && (
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <div className="w-full max-w-xl">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Email Reply Assistant Popup
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Test tone customization, length control, 3 alternative generations, and quick polish.
                </p>
              </div>
              <ExtensionPopup
                preferences={preferences}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onInsertToGmail={handleInsertToGmail}
                isStandalone={true}
              />
            </div>
          </div>
        )}

        {activeView === 'files' && (
          <div className="flex-1 flex flex-col">
            <ExtensionCodeViewer onDownloadZip={handleDownload} />
          </div>
        )}

        {activeView === 'guide' && (
          <div className="flex-1 flex flex-col">
            <InstallGuide onDownloadZip={handleDownload} />
          </div>
        )}
      </main>

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
      />
    </div>
  );
}
