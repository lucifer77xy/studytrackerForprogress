import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Flame, ChevronRight } from 'lucide-react';

interface ChartsRowProps {
  onOpenDetails?: () => void;
  onOpenStats?: () => void;
}

export const ChartsRow: React.FC<ChartsRowProps> = ({
  onOpenDetails,
  onOpenStats
}) => {
  const { profile, recentSessions } = useAuth();

  // 1. Calculate day-by-day minutes for this week (Mon -> Sun)
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 is Monday, 6 is Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const daysLabel = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekDayMinutes = [0, 0, 0, 0, 0, 0, 0];

  recentSessions.forEach((session) => {
    const sessionDate = new Date(session.completedAt);
    if (sessionDate >= monday) {
      const diffDays = Math.floor((sessionDate.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        weekDayMinutes[diffDays] += session.durationMinutes || 0;
      }
    }
  });

  const totalThisWeek = weekDayMinutes.reduce((a, b) => a + b, 0);
  const maxDayMinutes = Math.max(60, ...weekDayMinutes);

  // 2. Generate 14-day trend points
  const trendPoints: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() - i);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    const mins = recentSessions
      .filter((s) => {
        const d = new Date(s.completedAt);
        return d >= targetDate && d < nextDate;
      })
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    trendPoints.push(mins);
  }

  // Calculate SVG line path for 14-day trend
  const maxTrend = Math.max(60, ...trendPoints);
  const svgWidth = 260;
  const svgHeight = 70;
  const pointsString = trendPoints
    .map((val, idx) => {
      const x = (idx / 13) * svgWidth;
      const y = svgHeight - (val / maxTrend) * (svgHeight - 15) - 8;
      return `${x},${y}`;
    })
    .join(' ');

  // Format 14-day date labels
  const date14Ago = new Date();
  date14Ago.setDate(now.getDate() - 13);
  const date7Ago = new Date();
  date7Ago.setDate(now.getDate() - 6);

  const formatShortDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Column 1: This Week (5 cols) */}
      <div className="lg:col-span-4 rounded-2xl bg-[#0b0c16]/90 border border-purple-900/30 p-5 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-purple-950/20">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #8b5cf6 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">This Week</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{totalThisWeek} min studied</p>
          </div>

          <button
            onClick={onOpenDetails}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-purple-300 transition-colors cursor-pointer"
          >
            <span>Details</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Bar chart */}
        <div className="flex items-end justify-between gap-2 h-32 pt-4 pb-1 relative z-10">
          {daysLabel.map((day, idx) => {
            const heightPercent = Math.max(8, Math.round((weekDayMinutes[idx] / maxDayMinutes) * 100));
            const isToday = idx === dayOfWeek;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                {/* Bar */}
                <div className="w-full max-w-[24px] bg-white/[0.04] rounded-t-md overflow-hidden h-full flex items-end">
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isToday
                        ? 'bg-gradient-to-t from-purple-600 to-indigo-400 shadow-sm shadow-purple-500/50'
                        : weekDayMinutes[idx] > 0
                        ? 'bg-purple-600/70 hover:bg-purple-500'
                        : 'bg-white/[0.08]'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${day}: ${weekDayMinutes[idx]} mins`}
                  />
                </div>
                {/* Day Label */}
                <span
                  className={`text-[11px] font-semibold ${
                    isToday ? 'text-purple-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Column 2: 14-Day Trend (4 cols) */}
      <div className="lg:col-span-4 rounded-2xl bg-[#0a0f1d]/90 border border-blue-900/30 p-5 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-blue-950/20">
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">14–Day Trend</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Activity over time</p>
          </div>

          <button
            onClick={onOpenStats}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-cyan-300 transition-colors cursor-pointer"
          >
            <span>Full stats</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Smooth SVG Line Chart */}
        <div className="h-32 flex flex-col justify-end relative z-10">
          <svg className="w-full h-24 overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Area under curve */}
            <polygon
              fill="url(#trendGradient)"
              points={`0,${svgHeight} ${pointsString} ${svgWidth},${svgHeight}`}
            />
            {/* Trend line */}
            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsString}
            />
          </svg>

          {/* Dates footer */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-white/[0.06]">
            <span>{formatShortDate(date14Ago)}</span>
            <span>{formatShortDate(date7Ago)}</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Column 3: CURRENT STREAK (4 cols) */}
      <div className="lg:col-span-4 rounded-2xl bg-[#190f09]/90 border border-amber-900/30 p-5 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-amber-950/20">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="block text-[10px] font-bold text-amber-400/90 uppercase tracking-widest mb-1">
              Current Streak
            </span>
            <div className="text-4xl font-extrabold text-white tracking-tight">
              {profile?.streak || 0} <span className="text-xl font-normal text-slate-400">days</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Best: {profile?.bestStreak || 0} days
            </p>
          </div>

          {/* Flame Icon with Warm Radiance */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse" />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Flame className="w-7 h-7 text-white fill-white" />
            </div>
          </div>
        </div>

        {/* Motivational Footnote */}
        <div className="mt-4 pt-3 border-t border-amber-900/40 text-xs text-amber-200/80 font-medium relative z-10">
          {(profile?.streak || 0) > 0
            ? '🔥 Streak active! Keep the momentum going.'
            : 'Study today to start your streak'}
        </div>

        {/* Background Large Flame Silhouette */}
        <Flame className="absolute -bottom-8 -right-8 w-44 h-44 text-amber-500/[0.03] pointer-events-none" />
      </div>
    </div>
  );
};
