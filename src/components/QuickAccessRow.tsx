import React, { useState } from 'react';
import {
  Star,
  BookOpen,
  ChevronRight,
  Clock,
  Timer,
  CreditCard,
  Calendar,
  Trophy,
  Bot,
  Brain,
  Smile,
  Music,
  Plus,
  Volume2,
  VolumeX
} from 'lucide-react';
import { ambientAudio } from '../lib/audio';
import { NavTab } from './Sidebar';

interface QuickAccessRowProps {
  onStartSession: (presetMinutes?: number, subject?: string) => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const QuickAccessRow: React.FC<QuickAccessRowProps> = ({
  onStartSession,
  onNavigateTab
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(ambientAudio.getIsPlaying());
  const [activeSound, setActiveSound] = useState<'rain' | 'whitenoise' | 'brownnoise' | 'waves' | 'none'>('none');

  const toggleSound = () => {
    if (isPlayingAudio) {
      ambientAudio.stop();
      setIsPlayingAudio(false);
      setActiveSound('none');
    } else {
      ambientAudio.play('rain', 0.35);
      setIsPlayingAudio(true);
      setActiveSound('rain');
    }
  };

  const templates = [
    { title: 'Quick Study', duration: 20, subject: 'Review & Homework', color: 'from-amber-600/30 to-amber-500/10' },
    { title: 'Deep Focus', duration: 50, subject: 'Core Subjects', color: 'from-purple-600/30 to-purple-500/10' },
    { title: 'Exam Sprint', duration: 45, subject: 'Practice Problems', color: 'from-blue-600/30 to-blue-500/10' },
    { title: 'Pomodoro', duration: 25, subject: 'General Reading', color: 'from-emerald-600/30 to-emerald-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left Column: Study Templates (7 cols) */}
      <div className="lg:col-span-7 rounded-2xl bg-[#0e0c14]/90 border border-amber-900/30 p-5 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-amber-950/20">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Study Templates</h3>
          </div>

          <button
            onClick={() => onStartSession(25, 'Standard Study')}
            className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <span>Browse all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Templates cards list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
          {templates.map((tpl, i) => (
            <div
              key={i}
              onClick={() => onStartSession(tpl.duration, tpl.subject)}
              className="p-4 rounded-xl bg-white/[0.03] border border-amber-500/20 hover:border-amber-400/50 hover:bg-white/[0.06] transition-all cursor-pointer group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {tpl.duration}m
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  {tpl.title}
                </h4>
                <p className="text-[11px] text-slate-400 truncate">{tpl.subject}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Quick Access (5 cols) */}
      <div className="lg:col-span-5 rounded-2xl bg-[#0f0c1c]/90 border border-purple-900/30 p-5 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-purple-950/20">
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Quick Access</h3>
          </div>
          <span className="text-[10px] text-purple-400/80 font-mono">Tools</span>
        </div>

        {/* 8 Quick Action Tiles */}
        <div className="grid grid-cols-4 gap-2.5 mb-4 relative z-10">
          {/* 1. Focus */}
          <button
            onClick={() => onNavigateTab('focus-timer')}
            className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-purple-600/20 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all cursor-pointer group"
          >
            <Timer className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Focus</span>
          </button>

          {/* 2. Flashcards */}
          <button
            onClick={() => onNavigateTab('flashcards')}
            className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-purple-600/20 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all cursor-pointer group"
          >
            <CreditCard className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Flashcards</span>
          </button>

          {/* 3. Planner */}
          <button
            onClick={() => onNavigateTab('goals')}
            className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-purple-600/20 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all cursor-pointer group"
          >
            <Calendar className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Planner</span>
          </button>

          {/* 4. Ranks */}
          <button
            onClick={() => onNavigateTab('leaderboard')}
            className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-purple-600/20 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all cursor-pointer group"
          >
            <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Ranks</span>
          </button>

          {/* 5. AI Tutor */}
          <button
            onClick={() => onNavigateTab('ai-tutor')}
            className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-purple-600/20 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all cursor-pointer group"
          >
            <Bot className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">AI Tutor</span>
          </button>

          {/* 6. Notes */}
          <button
            onClick={() => onNavigateTab('collab-notes')}
            className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-purple-600/20 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all cursor-pointer group"
          >
            <Brain className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Notes</span>
          </button>

          {/* 7. Partner Live */}
          <button
            onClick={() => onNavigateTab('partner')}
            className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-cyan-600/20 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all cursor-pointer group"
          >
            <Smile className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Partner</span>
          </button>

          {/* 8. Ambient Music Player */}
          <button
            onClick={toggleSound}
            className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border transition-all cursor-pointer group ${
              isPlayingAudio
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/30'
                : 'bg-white/[0.04] border-white/[0.06] hover:bg-purple-600/20 hover:border-purple-500/40 text-slate-300 hover:text-white'
            }`}
            title="Toggle procedural ambient rain sound for studying"
          >
            {isPlayingAudio ? (
              <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <Music className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-[10px] font-medium">
              {isPlayingAudio ? 'Playing' : 'Audio'}
            </span>
          </button>
        </div>

        {/* + New Study Session Button */}
        <button
          onClick={() => onStartSession(25, 'Focus Session')}
          className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Study Session</span>
        </button>
      </div>
    </div>
  );
};
