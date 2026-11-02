import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Paperclip,
  Smile,
  Link2,
  Image,
  Lock,
  MoreVertical,
  Star,
  Reply,
  Forward,
  Search,
  Menu,
  ChevronDown,
  Inbox,
  Clock,
  SendHorizontal,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ReplyOption, ToneType, LengthType, UserPreferences } from '../types';
import { fetchGeneratedReplies } from '../services/api';

interface GmailSimulatorProps {
  preferences: UserPreferences;
  injectedDraft: { body: string; subject?: string } | null;
  onClearInjectedDraft: () => void;
  onOpenAssistantInSidebar?: (emailText: string) => void;
}

export const GmailSimulator: React.FC<GmailSimulatorProps> = ({
  preferences,
  injectedDraft,
  onClearInjectedDraft,
  onOpenAssistantInSidebar,
}) => {
  // Received email thread content
  const [threadEmail, setThreadEmail] = useState({
    senderName: 'Sarah Jenkins',
    senderEmail: 's.jenkins@apexsolutions.io',
    subject: 'Project Milestone Review & Q4 Deliverables Timeline',
    timestamp: 'Today, 9:42 AM',
    avatarColor: 'bg-emerald-600',
    body: `Hi team,

I wanted to follow up on our discussion regarding the Q4 deliverables for the platform rollout. We reviewed the staging environment yesterday, and overall the progress looks promising!

Could you please confirm the following points by end of week?
1. Are we still on track for the security audit sign-off next Tuesday?
2. Has the revised documentation for the client onboarding API been finalized?
3. Could we schedule a 20-minute alignment call with the product team either Thursday at 2:00 PM or Friday at 10:30 AM?

Please let me know which time slot works best for you so I can send the calendar invitation.

Best regards,
Sarah Jenkins
Director of Operations | Apex Solutions`,
  });

  // Compose draft state
  const [isComposeOpen, setIsComposeOpen] = useState(true);
  const [draftRecipient, setDraftRecipient] = useState('s.jenkins@apexsolutions.io');
  const [draftSubject, setDraftSubject] = useState('Re: Project Milestone Review & Q4 Deliverables Timeline');
  const [draftBody, setDraftBody] = useState('');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Injected floating assistant modal state
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [assistantTone, setAssistantTone] = useState<ToneType>(preferences.defaultTone || 'Professional');
  const [assistantLength, setAssistantLength] = useState<LengthType>(preferences.defaultLength || 'Medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState<ReplyOption[]>([]);

  // Sync draft if injected from external popup
  React.useEffect(() => {
    if (injectedDraft) {
      setDraftBody(injectedDraft.body);
      if (injectedDraft.subject) {
        setDraftSubject(injectedDraft.subject);
      }
      setIsComposeOpen(true);
      notify('Inserted reply into Gmail draft!');
      onClearInjectedDraft();
    }
  }, [injectedDraft]);

  const notify = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleGenerateInGmail = async () => {
    setIsGenerating(true);
    try {
      const data = await fetchGeneratedReplies({
        emailContent: threadEmail.body,
        tone: assistantTone,
        length: assistantLength,
        language: preferences.defaultLanguage || 'English',
        proxyUrl: preferences.apiProxyUrl,
      });

      setGeneratedOptions(data.replies);
      notify('Generated 3 alternative responses!');
    } catch (err: any) {
      notify(err.message || 'Failed to generate replies');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsertOption = (bodyText: string, subjectText?: string) => {
    setDraftBody(bodyText);
    if (subjectText && !draftSubject.includes(subjectText)) {
      setDraftSubject(subjectText);
    }
    setIsAssistantModalOpen(false);
    notify('Draft populated with AI reply. Review before sending.');
  };

  return (
    <div className="w-full bg-[#1e1f20] text-slate-200 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col min-h-[640px] select-none">
      {/* Gmail Header */}
      <header className="bg-[#1f2125] border-b border-slate-700/60 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Menu className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-5 flex items-center justify-center font-bold text-red-500 tracking-tighter text-sm">
              <span className="text-rose-500 font-extrabold text-lg">M</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-white hidden sm:inline">
              Gmail
            </span>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Interactive Live Sandbox
          </span>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-xl mx-4">
          <div className="bg-[#2a2c32] hover:bg-[#32353c] border border-transparent focus-within:border-indigo-500/50 rounded-full px-4 py-1.5 flex items-center gap-2.5 text-xs text-slate-300 transition">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              readOnly
              value={`in:inbox ${threadEmail.subject}`}
              className="bg-transparent border-none outline-none w-full text-slate-200 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            U
          </div>
        </div>
      </header>

      {/* Gmail Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left mini sidebar */}
        <aside className="w-48 bg-[#1a1b1d] border-r border-slate-800 p-3 hidden md:flex flex-col gap-1 text-xs">
          <button
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2.5 bg-[#c2e7ff] text-[#001d35] font-semibold px-4 py-2.5 rounded-2xl mb-3 shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <span className="text-lg leading-none">+</span>
            <span>Compose</span>
          </button>

          <div className="flex items-center justify-between px-3 py-2 rounded-full bg-slate-800/90 text-white font-medium cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Inbox className="w-4 h-4 text-indigo-400" />
              <span>Inbox</span>
            </div>
            <span className="text-[10px] font-bold">1</span>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/40 cursor-pointer">
            <Star className="w-4 h-4" />
            <span>Starred</span>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/40 cursor-pointer">
            <Clock className="w-4 h-4" />
            <span>Snoozed</span>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/40 cursor-pointer">
            <SendHorizontal className="w-4 h-4" />
            <span>Sent</span>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/40 cursor-pointer">
            <FileText className="w-4 h-4" />
            <span>Drafts</span>
          </div>
        </aside>

        {/* Main email thread pane */}
        <main className="flex-1 flex flex-col bg-[#141517] overflow-y-auto p-4 sm:p-6 space-y-4 relative">
          {/* Status Toast */}
          {statusNotification && (
            <div className="fixed top-16 right-8 z-50 bg-slate-900 border border-indigo-500/40 text-indigo-200 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{statusNotification}</span>
            </div>
          )}

          {/* Email Subject Row */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {threadEmail.subject}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-semibold">
                  Inbox
                </span>
                <span>•</span>
                <span>Apex Solutions Project</span>
              </div>
            </div>

            {onOpenAssistantInSidebar && (
              <button
                onClick={() => onOpenAssistantInSidebar(threadEmail.body)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Send to Assistant</span>
              </button>
            )}
          </div>

          {/* Email Message Card */}
          <div className="bg-[#1e1f23] border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            {/* Sender row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full ${threadEmail.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-sm`}
                >
                  {threadEmail.senderName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {threadEmail.senderName}
                    </span>
                    <span className="text-xs text-slate-400">
                      &lt;{threadEmail.senderEmail}&gt;
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">to me</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{threadEmail.timestamp}</span>
                <button
                  type="button"
                  title="Reply"
                  onClick={() => setIsComposeOpen(true)}
                  className="p-1 hover:text-white text-slate-400 rounded transition"
                >
                  <Reply className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Email message body text */}
            <div className="text-xs sm:text-[13px] text-slate-300 leading-relaxed whitespace-pre-line pt-2 font-sans">
              {threadEmail.body}
            </div>
          </div>

          {/* Compose / Reply Container */}
          {isComposeOpen ? (
            <div className="bg-[#1e1f23] border-2 border-indigo-500/40 rounded-xl shadow-xl flex flex-col relative overflow-hidden transition-all">
              {/* Compose Header */}
              <div className="bg-[#26282d] px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
                <div className="flex items-center gap-2">
                  <Reply className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Reply Draft</span>
                  <span className="text-[10px] text-indigo-400/80 font-normal">
                    (Extension detects and injects here)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsComposeOpen(false)}
                    className="p-1 hover:text-white rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Compose Inputs */}
              <div className="p-3 space-y-2 border-b border-slate-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 w-12">To:</span>
                  <input
                    type="text"
                    value={draftRecipient}
                    onChange={(e) => setDraftRecipient(e.target.value)}
                    className="flex-1 bg-transparent border-none text-slate-200 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 border-t border-slate-800/60 pt-2">
                  <span className="text-slate-400 w-12">Subject:</span>
                  <input
                    type="text"
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    className="flex-1 bg-transparent border-none text-slate-200 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Compose Body Textarea */}
              <div className="p-3 relative">
                <textarea
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  placeholder="Write your email reply here, or click the 'AI Reply' button below to generate intelligent options..."
                  rows={6}
                  className="w-full bg-transparent border-none text-xs sm:text-[13px] text-slate-200 placeholder-slate-500 outline-none resize-y leading-relaxed font-sans"
                />

                {/* Floating in-Gmail Assistant widget modal */}
                {isAssistantModalOpen && (
                  <div className="absolute bottom-14 right-4 w-[380px] max-w-[95%] bg-[#0e1422] border border-indigo-500/50 rounded-xl shadow-2xl z-40 p-3 space-y-2.5 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Email Reply Assistant</span>
                      </div>
                      <button
                        onClick={() => setIsAssistantModalOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-slate-300">
                      <span className="font-semibold text-indigo-400">Thread Context: </span>
                      {threadEmail.body.slice(0, 110)}...
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                          Tone
                        </label>
                        <select
                          value={assistantTone}
                          onChange={(e) => setAssistantTone(e.target.value as ToneType)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
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
                        <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                          Length
                        </label>
                        <select
                          value={assistantLength}
                          onChange={(e) => setAssistantLength(e.target.value as LengthType)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="Short">Short</option>
                          <option value="Medium">Medium</option>
                          <option value="Detailed">Detailed</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateInGmail}
                      disabled={isGenerating}
                      className="w-full py-2 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating contextual replies...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate 3 Alternatives</span>
                        </>
                      )}
                    </button>

                    {/* Render generated options */}
                    {generatedOptions.length > 0 && (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {generatedOptions.map((opt, i) => (
                          <div
                            key={opt.id || i}
                            className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-1.5 hover:border-indigo-500/40 transition"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-500/20">
                                {opt.label || `Option ${i + 1}`}
                              </span>
                              <button
                                onClick={() => handleInsertOption(opt.body, opt.subject)}
                                className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold flex items-center gap-1 transition"
                              >
                                <Send className="w-2.5 h-2.5" />
                                <span>Insert to Draft</span>
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-300 leading-snug line-clamp-3">
                              {opt.body}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Compose Toolbar with Injected Assistant Button */}
              <div className="bg-[#24262c] px-3 py-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 select-none">
                <div className="flex items-center gap-2">
                  {/* Send Button */}
                  <button
                    onClick={() => {
                      if (!draftBody.trim()) {
                        notify('Draft is empty.');
                        return;
                      }
                      notify('Review completed! In real Gmail, you click Send when satisfied.');
                    }}
                    className="bg-[#0b57d0] hover:bg-[#1a73e8] text-white font-semibold px-4 py-1.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <span>Send</span>
                  </button>

                  {/* INJECTED ASSISTANT BUTTON (Chrome Extension Content Script) */}
                  <button
                    onClick={() => setIsAssistantModalOpen(!isAssistantModalOpen)}
                    className="relative group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-3 py-1.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
                    title="Injected by Email Reply Assistant Chrome Extension"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>AI Reply</span>
                    <span className="text-[9px] px-1 rounded bg-black/30 text-indigo-200">
                      Extension
                    </span>
                  </button>

                  {/* Formatting tools */}
                  <div className="hidden sm:flex items-center gap-1 text-slate-400 pl-2 border-l border-slate-700">
                    <span className="p-1 hover:text-white rounded cursor-pointer font-serif font-bold text-xs">
                      B
                    </span>
                    <span className="p-1 hover:text-white rounded cursor-pointer font-serif italic text-xs">
                      I
                    </span>
                    <span className="p-1 hover:text-white rounded cursor-pointer font-serif underline text-xs">
                      U
                    </span>
                    <Link2 className="w-3.5 h-3.5 p-0.5 hover:text-white rounded cursor-pointer" />
                    <Paperclip className="w-3.5 h-3.5 p-0.5 hover:text-white rounded cursor-pointer" />
                    <Smile className="w-3.5 h-3.5 p-0.5 hover:text-white rounded cursor-pointer" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-[11px] text-slate-500">
                    {draftBody.trim() ? `${draftBody.trim().split(/\s+/).length} words` : 'Empty draft'}
                  </span>
                  <button
                    onClick={() => setDraftBody('')}
                    title="Discard draft"
                    className="p-1 hover:text-rose-400 text-slate-400 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Closed compose prompt */
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Click Reply to open Gmail compose and test extension injection.
              </span>
              <button
                onClick={() => setIsComposeOpen(true)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Open Reply Draft</span>
              </button>
            </div>
          )}

          {/* Safety Notice Card */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-300">
                Safety & Privacy by Design:
              </span>{' '}
              The extension strictly never sends emails automatically or commits to dates/promises. It only inserts editable drafts into your Gmail composer for your review.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
