import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Search,
  LayoutDashboard,
  Timer,
  Clock3,
  Layers,
  FileText,
  CreditCard,
  HelpCircle,
  Swords,
  GitBranch,
  Bookmark,
  Users,
  Trophy,
  Flame,
  Moon,
  Globe,
  LogOut,
  ChevronDown,
  Radio
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'focus-timer'
  | 'study-rooms'
  | 'collab-notes'
  | 'friends'
  | 'partner'
  | 'ai-tutor'
  | 'leaderboard'
  | 'flashcards'
  | 'templates'
  | 'goals';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickSearch: () => void;
  activeRoomCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickSearch,
  activeRoomCount = 0
}) => {
  const { profile, logout } = useAuth();

  return (
    <aside className="w-64 bg-[#0a0a12]/95 border-r border-white/[0.07] flex flex-col justify-between h-screen sticky top-0 overflow-y-auto select-none font-['Plus_Jakarta_Sans',sans-serif] scrollbar-thin scrollbar-thumb-white/10 z-20">
      <div className="p-4 space-y-5">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">StudyTracker</h1>
            <p className="text-[11px] font-medium text-slate-400">Student Portal</p>
          </div>
        </div>

        {/* Quick Search */}
        <button
          onClick={onOpenQuickSearch}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.07] transition-all text-xs text-slate-400 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors" />
            <span>Quick search</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-[10px] text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* ESSENTIALS */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Essentials</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </div>

          <button
            onClick={() => onSelectTab('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-900/30'
                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={`w-4 h-4 ${currentTab === 'dashboard' ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>Dashboard</span>
            </div>
            {currentTab === 'dashboard' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />}
          </button>

          <button
            onClick={() => onSelectTab('focus-timer')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'focus-timer'
                ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Timer className={`w-4 h-4 ${currentTab === 'focus-timer' ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>Focus Timer</span>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('goals')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'goals'
                ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock3 className={`w-4 h-4 ${currentTab === 'goals' ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>Goals & Tasks</span>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('templates')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'templates'
                ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className={`w-4 h-4 ${currentTab === 'templates' ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>Classes & Modules</span>
            </div>
          </button>
        </div>

        {/* SOCIAL & REAL-TIME COLLABORATION */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span>Live Squad</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">LIVE</span>
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </div>

          <button
            onClick={() => onSelectTab('study-rooms')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'study-rooms'
                ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Radio className={`w-4 h-4 ${currentTab === 'study-rooms' ? 'text-emerald-400' : 'text-emerald-400/80 animate-pulse'}`} />
              <span>Study Rooms</span>
            </div>
            {activeRoomCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
                {activeRoomCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('collab-notes')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'collab-notes'
                ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className={`w-4 h-4 ${currentTab === 'collab-notes' ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>Collab Notes</span>
            </div>
            <span className="text-[10px] text-cyan-400/80 font-mono">Sync</span>
          </button>

          <button
            onClick={() => onSelectTab('friends')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'friends'
                ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className={`w-4 h-4 ${currentTab === 'friends' ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>Friends Progress</span>
            </div>
            {profile?.friends && profile.friends.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">
                {profile.friends.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('partner')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'partner'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Radio className={`w-4 h-4 ${currentTab === 'partner' ? 'text-cyan-400' : 'text-cyan-400/80 animate-pulse'}`} />
              <span>Study Partner (Live)</span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-mono">DUO</span>
          </button>

          <button
            onClick={() => onSelectTab('leaderboard')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'leaderboard'
                ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Trophy className={`w-4 h-4 ${currentTab === 'leaderboard' ? 'text-amber-400' : 'text-amber-400/80'}`} />
              <span>Productivity & Ranks</span>
            </div>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </button>
        </div>

        {/* LEARNING */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Learning</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </div>

          <button
            onClick={() => onSelectTab('ai-tutor')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'ai-tutor'
                ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-900/40'
                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className={`w-4 h-4 ${currentTab === 'ai-tutor' ? 'text-amber-400' : 'text-purple-400'}`} />
              <span>Gemini AI Tutor</span>
            </div>
            <span className="text-[10px] text-amber-400/90 font-mono font-bold">AI</span>
          </button>

          <button
            onClick={() => onSelectTab('flashcards')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'flashcards'
                ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className={`w-4 h-4 ${currentTab === 'flashcards' ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>Flashcards</span>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('templates')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>AI Quiz</span>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('leaderboard')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Swords className="w-4 h-4 text-slate-400" />
              <span>Brain Battle</span>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('collab-notes')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <GitBranch className="w-4 h-4 text-slate-400" />
              <span>Mind Maps</span>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('goals')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4 text-slate-400" />
              <span>Reading List</span>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom User Area */}
      <div className="p-4 border-t border-white/[0.07] space-y-3 bg-[#08080f]/80">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Language</span>
          </div>
          <span className="text-[11px] font-medium text-slate-300 bg-white/[0.06] px-2 py-0.5 rounded">
            GB EN
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <Moon className="w-3.5 h-3.5 text-slate-400" />
            <span>Appearance</span>
          </div>
          <span className="text-amber-300 text-xs">🌙</span>
        </div>

        {/* User Card */}
        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                className="w-8 h-8 rounded-full border border-purple-500/40 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center ring-1 ring-purple-400">
                {profile?.displayName?.charAt(0).toUpperCase() || 'S'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {profile?.displayName || 'Student'}
              </p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <span>Student</span>
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span className="text-purple-400 font-mono">{profile?.friendCode}</span>
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
