import React, { useState, useEffect } from 'react';
import { Search, X, LayoutDashboard, Timer, Users, Trophy, FileText, CreditCard, Target, Layers } from 'lucide-react';
import { NavTab } from './Sidebar';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onStartFocus: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onStartFocus
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent if listening, or we can listen globally
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { title: 'Dashboard', category: 'Navigation', icon: LayoutDashboard, tab: 'dashboard' as NavTab },
    { title: 'Start Focus Timer', category: 'Study Actions', icon: Timer, action: onStartFocus },
    { title: 'Study Partner (Live Duo)', category: 'Collaboration', icon: Users, tab: 'partner' as NavTab },
    { title: 'Gemini AI Tutor & Q&A', category: 'AI Learning', icon: Layers, tab: 'ai-tutor' as NavTab },
    { title: 'Study Rooms & Squad Sync', category: 'Collaboration', icon: Users, tab: 'study-rooms' as NavTab },
    { title: 'Collaborative Notes', category: 'Collaboration', icon: FileText, tab: 'collab-notes' as NavTab },
    { title: 'Connect Friends & Progress', category: 'Social', icon: Users, tab: 'friends' as NavTab },
    { title: 'Weekly Productivity & Ranks', category: 'Leaderboard', icon: Trophy, tab: 'leaderboard' as NavTab },
    { title: 'Study Goals & Tasks', category: 'Goals', icon: Target, tab: 'goals' as NavTab },
    { title: 'Study Flashcards', category: 'Learning', icon: CreditCard, tab: 'flashcards' as NavTab },
    { title: 'Classes & Modules', category: 'Learning', icon: Layers, tab: 'templates' as NavTab }
  ];

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm font-['Plus_Jakarta_Sans',sans-serif] animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f0e1a] border border-purple-500/30 shadow-2xl shadow-purple-950/50 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
          <Search className="w-4 h-4 text-purple-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, subject, or jump to feature..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching destinations found.
            </div>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.tab) {
                      onNavigate(item.tab);
                    }
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-600/20 text-slate-300 hover:text-white transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
