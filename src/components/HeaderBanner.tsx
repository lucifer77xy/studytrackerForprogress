import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Play, Calendar, Zap, Flame, Activity, Trophy, Moon, Sun } from 'lucide-react';

interface HeaderBannerProps {
  onStartStudying: () => void;
  onOpenSchedule: () => void;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  onStartStudying,
  onOpenSchedule
}) => {
  const { profile, user, recentSessions } = useAuth();

  // Determine time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const isNight = hour >= 18 || hour < 6;

  // Calculate this week's minutes
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  weekStart.setHours(0, 0, 0, 0);

  const thisWeekMinutes = recentSessions
    .filter((s) => new Date(s.completedAt) >= weekStart)
    .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  const totalHours = Math.round(((profile?.totalMinutes || 0) / 60) * 10) / 10;

  // Study health calculation (0 to 100 based on streak, recent sessions, and goals)
  const healthScore = Math.min(
    100,
    Math.round(
      (profile?.streak || 0) * 15 +
      Math.min(40, (thisWeekMinutes / 120) * 40) +
      Math.min(30, (profile?.totalSessions || 0) * 5)
    )
  );

  const healthLabel =
    healthScore === 0
      ? 'Just Starting'
      : healthScore < 40
      ? 'Building Habits'
      : healthScore < 75
      ? 'Consistent Focus'
      : 'Peak Mastery';

  // Extract first name, prioritizing verified Google name
  const nameToUse = (profile?.displayName && profile.displayName.toLowerCase() !== 'student')
    ? profile.displayName
    : (user?.displayName && user.displayName.toLowerCase() !== 'student')
    ? user.displayName
    : user?.email ? user.email.split('@')[0].replace(/[._-]+/g, ' ') : 'Scholar';
  const firstName = nameToUse.split(' ')[0] || 'Scholar';

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-[#170e2f] via-[#101026] to-[#0d122b] border border-purple-500/20 p-6 md:p-8 overflow-hidden shadow-2xl shadow-purple-950/40 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background ambient lighting and star dot texture */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Information */}
        <div className="space-y-4">
          {/* Greeting */}
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300/90 uppercase tracking-widest">
            {isNight ? <Moon className="w-3.5 h-3.5 text-amber-300" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span>{greeting}</span>
          </div>

          {/* User Name and scholar level */}
          <div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>{firstName}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-lg shadow-purple-500/60 inline-block" />
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 font-medium">
              Level {profile?.level || 1} Scholar · {profile?.totalSessions || 0} sessions · {totalHours}h studied
            </p>
          </div>

          {/* Metric Pill Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Level</span>
                <span className="text-xs font-bold text-white">Lv {profile?.level || 1}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-md">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Streak</span>
                <span className="text-xs font-bold text-white">{profile?.streak || 0}d</span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-md">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">This Week</span>
                <span className="text-xs font-bold text-white">{thisWeekMinutes}m</span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-md">
              <Trophy className="w-3.5 h-3.5 text-purple-400" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total XP</span>
                <span className="text-xs font-bold text-white">{profile?.xp || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Study Health & Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4">
          {/* Study Health Mini Gauge */}
          <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] backdrop-blur-md">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Study Health
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-white">{healthScore}</span>
                <span className="text-[11px] font-semibold text-rose-400/90">{healthLabel}</span>
              </div>
            </div>

            {/* Circular Ring Gauge */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={healthScore > 50 ? 'text-emerald-400' : 'text-rose-500'}
                  strokeDasharray={`${healthScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onStartStudying}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Studying</span>
            </button>

            <button
              onClick={onOpenSchedule}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-white text-sm font-semibold transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-slate-300" />
              <span>Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
