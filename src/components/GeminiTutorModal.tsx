import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  X,
  FileText,
  RotateCcw,
  Zap,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  subject?: string;
  timestamp: string;
}

interface GeminiTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToNotes?: (content: string) => void;
  currentSubject?: string;
}

export const GeminiTutorModal: React.FC<GeminiTutorModalProps> = ({
  isOpen,
  onClose,
  onSaveToNotes,
  currentSubject = 'General Study'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! I'm your Gemini Academic Tutor. Ask me any homework problem, concept explanation, math derivation, or exam question, and I'll break it down step-by-step for you!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState(currentSubject);
  const [mode, setMode] = useState<'Step-by-Step' | 'Concept Analogy' | 'Quick Summary' | 'Practice Quiz'>('Step-by-Step');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || question;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend.trim(),
      subject,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setQuestion('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend.trim(),
          subject,
          mode,
          history: messages.slice(-4)
        })
      });

      const contentType = res.headers.get('content-type') || '';
      let data: { answer?: string; error?: string } = {};

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { error: rawText.slice(0, 160) || `Server error (${res.status})` };
        }
      }

      if (!res.ok || !data.answer) {
        throw new Error(data.error || 'Failed to get answer from Gemini');
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.answer,
        subject,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `⚠️ **Unable to fetch response**: ${err instanceof Error ? err.message : 'Please check your connection and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const samplePrompts = [
    'Explain integration by parts with an easy example',
    'What is the difference between mitosis and meiosis?',
    'Explain time complexity of MergeSort vs QuickSort',
    'What is the Heisenberg Uncertainty Principle?'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-['Plus_Jakarta_Sans',sans-serif] animate-in fade-in duration-200">
      <div className="w-full max-w-3xl h-[85vh] rounded-3xl bg-[#0e0c19] border border-purple-500/40 p-6 flex flex-col shadow-2xl shadow-purple-950/80 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Gemini Study Tutor</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">Ask homework questions, derivations, and practice problems</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar: Subject & Explanation Mode */}
        <div className="flex items-center justify-between gap-3 py-3 border-b border-white/[0.06] relative z-10 shrink-0 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Subject:</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Calculus, Physics..."
              className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-xs outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['Step-by-Step', 'Concept Analogy', 'Quick Summary', 'Practice Quiz'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  mode === m
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/10 relative z-10">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-300 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-white/[0.04] border border-white/[0.08] text-slate-200 rounded-tl-none space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                  {!isUser && msg.id !== 'welcome' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] text-[10px] text-slate-400">
                      <button
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {onSaveToNotes && (
                        <button
                          onClick={() => {
                            onSaveToNotes(msg.text);
                            confetti({ particleCount: 30, spread: 60 });
                          }}
                          className="flex items-center gap-1 text-purple-300 hover:text-purple-200 transition-colors cursor-pointer ml-2"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Save to Notes</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-300">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-purple-300 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>Gemini is thinking and writing step-by-step solution...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        {messages.length <= 2 && (
          <div className="py-2 flex items-center gap-2 overflow-x-auto scrollbar-none relative z-10 shrink-0">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-purple-600/20 border border-white/[0.07] text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="pt-3 border-t border-white/[0.08] relative z-10 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything: math problem, formula proof, biology mechanism..."
              className="flex-1 px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.09] text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/60"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
