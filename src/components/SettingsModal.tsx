import React, { useState } from 'react';
import { X, Check, Save, ShieldCheck, Sliders, Globe, Server } from 'lucide-react';
import { UserPreferences, ToneType, LengthType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (newPrefs: UserPreferences) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
}) => {
  const [tone, setTone] = useState<ToneType>(preferences.defaultTone);
  const [length, setLength] = useState<LengthType>(preferences.defaultLength);
  const [language, setLanguage] = useState(preferences.defaultLanguage);
  const [proxyUrl, setProxyUrl] = useState(preferences.apiProxyUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePreferences({
      defaultTone: tone,
      defaultLength: length,
      defaultLanguage: language,
      apiProxyUrl: proxyUrl.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Extension Settings</h2>
              <p className="text-[11px] text-slate-400">Manage defaults and backend proxy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Preferences saved successfully!</span>
            </div>
          )}

          {/* Tone default */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Default Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as ToneType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Casual">Casual</option>
              <option value="Formal">Formal</option>
              <option value="Persuasive">Persuasive</option>
              <option value="Apologetic">Apologetic</option>
            </select>
          </div>

          {/* Length default */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Default Reply Length
            </label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as LengthType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="Short">Short (1-2 paragraphs)</option>
              <option value="Medium">Medium (Balanced)</option>
              <option value="Detailed">Detailed (Thorough)</option>
            </select>
          </div>

          {/* Language default */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Default Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Italian">Italian</option>
              <option value="Japanese">Japanese</option>
              <option value="Mandarin">Mandarin</option>
            </select>
          </div>

          {/* Backend Proxy */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Backend API Proxy URL</span>
              <span className="text-[10px] text-indigo-400 font-normal">Security Proxy</span>
            </label>
            <input
              type="text"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              placeholder="Leave empty for auto-detect (current origin)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition font-mono text-[11px]"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Protects your Gemini API key from exposure in public extension files.
            </p>
          </div>

          {/* Guest notice */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              Strictly guest-only experience. No personal login or cloud account needed. Settings are stored locally in your browser.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
