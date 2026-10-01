import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Clock, Flame, Target, ArrowUpRight } from 'lucide-react';

interface MetricCardsProps {
  onOpenSessions?: () => void;
  onOpenGoals?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  onOpenSessions,
  onOpenGoals
}) => {
  const { profile, goals } = useAuth();

  const totalMinutes = profile?.totalMinutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const studyTimeString = `${hours}h ${minutes}m`;

  const activeGoalsCount = goals.filter((g) => !g.completed).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. SESSIONS (Blue) */}
      <div
        onClick={onOpenSessions}
        className="relative group p-5 rounded-2xl bg-[#0b1021]/80 border border-blue-900/50 hover:border-blue-500/60 transition-all overflow-hidden cursor-pointer shadow-lg shadow-blue-950/20"
      >
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-blue-400/50 group-hover:text-blue-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>

        <div className="relative z-10 space-y-0.5">
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {profile?.totalSessions || 0}
          </div>
          <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
            Sessions
          </div>
          <div className="text-[11px] text-slate-400">
            completed total
          </div>
        </div>

        {/* Background Watermark Icon */}
        <BookOpen className="absolute -bottom-4 -right-4 w-28 h-28 text-blue-500/[0.04] pointer-events-none group-hover:text-blue-500/[0.08] transition-colors" />
      </div>

      {/* 2. STUDY TIME (Purple) */}
      <div className="relative group p-5 rounded-2xl bg-[#140b24]/80 border border-purple-900/50 hover:border-purple-500/60 transition-all overflow-hidden cursor-pointer shadow-lg shadow-purple-950/20">
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-purple-400/50 group-hover:text-purple-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>

        <div className="relative z-10 space-y-0.5">
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {studyTimeString}
          </div>
          <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
            Study Time
          </div>
          <div className="text-[11px] text-slate-400">
            {totalMinutes} min total
          </div>
        </div>

        {/* Background Watermark Icon */}
        <Clock className="absolute -bottom-4 -right-4 w-28 h-28 text-purple-500/[0.04] pointer-events-none group-hover:text-purple-500/[0.08] transition-colors" />
      </div>

      {/* 3. STREAK (Amber/Orange) */}
      <div className="relative group p-5 rounded-2xl bg-[#1e1009]/80 border border-amber-900/50 hover:border-amber-500/60 transition-all overflow-hidden cursor-pointer shadow-lg shadow-amber-950/20">
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <Flame className="w-4 h-4" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-amber-400/50 group-hover:text-amber-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>

        <div className="relative z-10 space-y-0.5">
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {profile?.streak || 0}d
          </div>
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            Streak
          </div>
          <div className="text-[11px] text-slate-400">
            best {profile?.bestStreak || 0}d
          </div>
        </div>

        {/* Background Watermark Icon */}
        <Flame className="absolute -bottom-4 -right-4 w-28 h-28 text-amber-500/[0.04] pointer-events-none group-hover:text-amber-500/[0.08] transition-colors" />
      </div>

      {/* 4. GOALS (Emerald) */}
      <div
        onClick={onOpenGoals}
        className="relative group p-5 rounded-2xl bg-[#091a13]/80 border border-emerald-900/50 hover:border-emerald-500/60 transition-all overflow-hidden cursor-pointer shadow-lg shadow-emerald-950/20"
      >
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <Target className="w-4 h-4" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-emerald-400/50 group-hover:text-emerald-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>

        <div className="relative z-10 space-y-0.5">
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {activeGoalsCount}
          </div>
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Goals
          </div>
          <div className="text-[11px] text-slate-400">
            active right now
          </div>
        </div>

        {/* Background Watermark Icon */}
        <Target className="absolute -bottom-4 -right-4 w-28 h-28 text-emerald-500/[0.04] pointer-events-none group-hover:text-emerald-500/[0.08] transition-colors" />
      </div>
    </div>
  );
};
