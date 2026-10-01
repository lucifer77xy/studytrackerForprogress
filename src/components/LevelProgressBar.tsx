import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Star } from 'lucide-react';

export const LevelProgressBar: React.FC = () => {
  const { profile } = useAuth();

  const level = profile?.level || 1;
  const currentTotalXp = profile?.xp || 0;

  // Calculate XP threshold for current and next level
  const baseLevelXp = (level - 1) * (level - 1) * 50;
  const nextLevelXp = level * level * 50;
  const xpNeededForLevel = nextLevelXp - baseLevelXp;
  const currentXpInLevel = Math.max(0, currentTotalXp - baseLevelXp);
  const xpToNextLevel = Math.max(0, nextLevelXp - currentTotalXp);

  const progressPercent = Math.min(100, Math.max(0, Math.round((currentXpInLevel / xpNeededForLevel) * 100)));

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0c19]/90 border border-purple-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4 font-['Plus_Jakarta_Sans',sans-serif] shadow-lg shadow-purple-950/20">
      {/* Level Tag and Icon */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-sm shadow-amber-500/20">
          <Star className="w-4 h-4 fill-amber-300" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white tracking-tight">
            Level {level}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[11px] font-semibold text-purple-300">
            Scholar
          </span>
        </div>
      </div>

      {/* Progress Bar and Indicator */}
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 w-full">
        <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden p-[1px] relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 shadow-sm shadow-purple-500/50 transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="text-right text-xs font-mono font-medium text-slate-400 shrink-0">
          <span className="text-white font-bold">{currentXpInLevel}</span> / {xpNeededForLevel} XP ·{' '}
          <span className="text-purple-300">{xpToNextLevel} to Lv {level + 1}</span>
        </div>
      </div>
    </div>
  );
};
