import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Send,
  Trash2,
  Settings,
  Mail,
  Sliders,
  Wand2,
  FileCheck,
  Briefcase,
  Scissors,
  HeartHandshake,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ReplyOption, ToneType, LengthType, UserPreferences } from '../types';
import { fetchGeneratedReplies, fetchRegeneratedSingle, fetchImprovedEmail } from '../services/api';

interface ExtensionPopupProps {
  preferences: UserPreferences;
  onOpenSettings: () => void;
  onInsertToGmail: (body: string, subject?: string) => void;
  onDetectEmail?: () => string;
  isStandalone?: boolean;
}

export const ExtensionPopup: React.FC<ExtensionPopupProps> = ({
  preferences,
  onOpenSettings,
  onInsertToGmail,
  onDetectEmail,
  isStandalone = false,
}) => {
  const [activeTab, setActiveTab] = useState<'reply' | 'polish'>('reply');

  // Reply generator state
  const [emailInput, setEmailInput] = useState('');
  const [tone, setTone] = useState<ToneType>(preferences.defaultTone || 'Professional');
  const [length, setLength] = useState<LengthType>(preferences.defaultLength || 'Medium');
  const [language, setLanguage] = useState(preferences.defaultLanguage || 'English');
  const [customInstructions, setCustomInstructions] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [replies, setReplies] = useState<ReplyOption[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Quick polish state
  const [draftToPolish, setDraftToPolish] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishResult, setPolishResult] = useState<{
    text: string;
    explanation: string;
    keyChanges: string[];
  } | null>(null);
  const [polishCopied, setPolishCopied] = useState(false);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg(null);
    } else {
      setSuccessMsg(msg);
      setErrorMsg(null);
    }
    setTimeout(() => {
      setErrorMsg(null);
      setSuccessMsg(null);
    }, 4000);
  };

  const handleGenerateReplies = async () => {
    if (!emailInput.trim()) {
      showToast('Please paste the email you want to reply to.', true);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await fetchGeneratedReplies({
        emailContent: emailInput,
        tone,
        length,
        language,
        customInstructions,
        proxyUrl: preferences.apiProxyUrl,
      });

      setReplies(data.replies);
      setAnalysis(data.analysis || null);
      showToast('Generated 3 alternative responses!');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate replies.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateSingle = async (index: number, optionId: string) => {
    setRegeneratingId(optionId);
    try {
      const updated = await fetchRegeneratedSingle({
        emailContent: emailInput,
        tone,
        length,
        language,
        customInstructions,
        variationIndex: index + 1,
        proxyUrl: preferences.apiProxyUrl,
      });

      setReplies((prev) =>
        prev.map((item) => (item.id === optionId ? { ...item, ...updated } : item))
      );
      showToast(`Regenerated Option ${index + 1}!`);
    } catch (err: any) {
      showToast('Could not regenerate option.', true);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {
      showToast('Failed to copy to clipboard', true);
    }
  };

  const handleReplyChange = (id: string, newBody: string) => {
    setReplies((prev) =>
      prev.map((item) => (item.id === id ? { ...item, body: newBody } : item))
    );
  };

  const handleQuickImprove = async (
    action: 'grammar' | 'professional' | 'shorter' | 'friendlier' | 'improve'
  ) => {
    if (!draftToPolish.trim()) {
      showToast('Please type or paste an email draft to refine.', true);
      return;
    }

    setIsPolishing(true);
    try {
      const res = await fetchImprovedEmail({
        emailContent: draftToPolish,
        action,
        proxyUrl: preferences.apiProxyUrl,
      });

      setPolishResult({
        text: res.improvedEmail,
        explanation: res.explanation,
        keyChanges: res.keyChanges,
      });
      showToast('Email polished successfully!');
    } catch (err: any) {
      showToast(err.message || 'Error polishing email.', true);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleDetectClick = () => {
    if (onDetectEmail) {
      const detected = onDetectEmail();
      if (detected) {
        setEmailInput(detected);
        showToast('Extracted email from simulated Gmail thread!');
      } else {
        showToast('No active email detected to extract.', true);
      }
    }
  };

  return (
    <div
      className={`bg-slate-950 text-slate-100 flex flex-col border border-slate-800 shadow-2xl rounded-2xl overflow-hidden transition-all ${
        isStandalone ? 'w-full max-w-xl mx-auto min-h-[620px]' : 'w-[400px] h-[610px]'
      }`}
    >
      {/* Extension Header */}
      <header className="px-4 py-3 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-white">Email Reply Assistant</h1>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v1.1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Reply smarter. Write faster.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onDetectEmail && (
            <button
              onClick={handleDetectClick}
              title="Detect context from Gmail"
              className="p-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onOpenSettings}
            title="Settings & Preferences"
            className="p-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-900/60 px-3 pt-2 border-b border-slate-800/80 gap-2 select-none">
        <button
          onClick={() => setActiveTab('reply')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-t-lg transition-all ${
            activeTab === 'reply'
              ? 'bg-slate-900 text-indigo-300 border-t border-x border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Reply Generator
        </button>
        <button
          onClick={() => setActiveTab('polish')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-t-lg transition-all ${
            activeTab === 'polish'
              ? 'bg-slate-900 text-indigo-300 border-t border-x border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Quick Polish
        </button>
      </div>

      {/* Toast Alert */}
      {(errorMsg || successMsg) && (
        <div
          className={`mx-4 mt-2 p-2 rounded-lg text-xs flex items-center justify-between border ${
            errorMsg
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMsg || successMsg}</span>
          </div>
        </div>
      )}

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {activeTab === 'reply' ? (
          <>
            {/* Input card */}
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 shadow-sm hover:border-slate-700/80 transition">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  Received Email
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-full">
                    {emailInput.length} chars
                  </span>
                </span>
                {emailInput && (
                  <button
                    onClick={() => setEmailInput('')}
                    className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <textarea
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Paste your received email here..."
                rows={3}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 resize-none transition"
              />
            </div>

            {/* Configuration */}
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 shadow-sm space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as ToneType)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Casual">Casual</option>
                    <option value="Formal">Formal</option>
                    <option value="Persuasive">Persuasive</option>
                    <option value="Apologetic">Apologetic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value as LengthType)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Short">Short (1-2 paras)</option>
                    <option value="Medium">Medium (Balanced)</option>
                    <option value="Detailed">Detailed (Thorough)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="English">English (US/UK)</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Portuguese">Portuguese (Português)</option>
                  <option value="Italian">Italian (Italiano)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="Mandarin">Mandarin (中文)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Custom Instructions <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g., Decline meeting, propose Friday morning..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerateReplies}
                disabled={isLoading}
                className="w-full mt-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating 3 Variations...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Reply</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Replies List */}
            {replies.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Generated Alternatives ({replies.length})
                  </h2>
                  <button
                    onClick={handleGenerateReplies}
                    disabled={isLoading}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerate All</span>
                  </button>
                </div>

                {analysis && (
                  <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-2 text-[11px] text-indigo-200 leading-relaxed">
                    <span className="font-semibold text-indigo-300">Context: </span>
                    {analysis}
                  </div>
                )}

                <div className="space-y-2.5">
                  {replies.map((reply, idx) => (
                    <div
                      key={reply.id || idx}
                      className="bg-slate-900 border border-slate-800/90 rounded-xl p-3 shadow-md hover:border-indigo-500/40 transition group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {reply.label || `Option ${idx + 1}`}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(reply.body, reply.id)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition"
                            title="Copy reply text"
                          >
                            {copiedId === reply.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleRegenerateSingle(idx, reply.id)}
                            disabled={regeneratingId === reply.id}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
                            title="Regenerate this specific alternative"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${
                                regeneratingId === reply.id ? 'animate-spin text-indigo-400' : ''
                              }`}
                            />
                          </button>

                          <button
                            onClick={() => onInsertToGmail(reply.body, reply.subject)}
                            className="px-2 py-1 rounded bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[11px] font-semibold text-white flex items-center gap-1 shadow-sm transition"
                            title="Insert into Gmail Draft"
                          >
                            <Send className="w-3 h-3" />
                            <span>Insert</span>
                          </button>
                        </div>
                      </div>

                      {reply.subject && (
                        <div className="text-[11px] text-slate-400 mb-1.5 font-medium truncate">
                          <span className="text-slate-500">Subject: </span>
                          {reply.subject}
                        </div>
                      )}

                      <textarea
                        value={reply.body}
                        onChange={(e) => handleReplyChange(reply.id, e.target.value)}
                        rows={4}
                        className="w-full bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 resize-y leading-relaxed font-sans"
                      />

                      {reply.toneNote && (
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                          {reply.toneNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Quick Polish Tab */
          <div className="space-y-3">
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Email Draft to Polish
                </span>
                {draftToPolish && (
                  <button
                    onClick={() => {
                      setDraftToPolish('');
                      setPolishResult(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-400 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={draftToPolish}
                onChange={(e) => setDraftToPolish(e.target.value)}
                placeholder="Type or paste any draft you want to improve..."
                rows={4}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none transition"
              />
            </div>

            {/* Quick Action Chips */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickImprove('grammar')}
                disabled={isPolishing}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800/80 hover:border-indigo-500/40 text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Fix Grammar</div>
                  <div className="text-[10px] text-slate-500">Typos & phrasing</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickImprove('professional')}
                disabled={isPolishing}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800/80 hover:border-indigo-500/40 text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">More Professional</div>
                  <div className="text-[10px] text-slate-500">Executive polish</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickImprove('shorter')}
                disabled={isPolishing}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800/80 hover:border-indigo-500/40 text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Scissors className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Make Shorter</div>
                  <div className="text-[10px] text-slate-500">Concise & direct</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickImprove('friendlier')}
                disabled={isPolishing}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800/80 hover:border-indigo-500/40 text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <HeartHandshake className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Make Friendlier</div>
                  <div className="text-[10px] text-slate-500">Warm & engaging</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => handleQuickImprove('improve')}
              disabled={isPolishing}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isPolishing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Refining Draft...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Comprehensive Email Polish</span>
                </>
              )}
            </button>

            {/* Polish Result */}
            {polishResult && (
              <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-3 shadow-md space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Polished Output
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(polishResult.text);
                        setPolishCopied(true);
                        setTimeout(() => setPolishCopied(false), 2000);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition"
                    >
                      {polishCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => onInsertToGmail(polishResult.text)}
                      className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[11px] font-semibold text-white flex items-center gap-1 transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>Insert</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-indigo-300/90 leading-tight">
                  {polishResult.explanation}
                </p>

                <textarea
                  value={polishResult.text}
                  onChange={(e) =>
                    setPolishResult((prev) => (prev ? { ...prev, text: e.target.value } : null))
                  }
                  rows={4}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
                />

                {polishResult.keyChanges.length > 0 && (
                  <div className="pt-1 border-t border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      Key Highlights:
                    </span>
                    {polishResult.keyChanges.map((change, i) => (
                      <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{change}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Gemini AI Connected</span>
        </div>
        <button
          onClick={onOpenSettings}
          className="text-slate-400 hover:text-indigo-300 transition"
        >
          Options
        </button>
      </footer>
    </div>
  );
};
