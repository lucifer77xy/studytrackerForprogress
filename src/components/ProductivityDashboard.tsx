import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Flame,
  Clock,
  Sparkles,
  Award,
  CheckCircle2,
  TrendingUp,
  Zap,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeaderboardEntry {
  id: string;
  name: string;
  photoURL?: string;
  isMe: boolean;
  weeklyMinutes: number;
  streak: number;
  productivityScore: number;
  level: number;
}

export const ProductivityDashboard: React.FC = () => {
  const { profile, friendsProfiles, recentSessions } = useAuth();

  // Calculate my weekly minutes
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  weekStart.setHours(0, 0, 0, 0);

  const myWeeklyMinutes = recentSessions
    .filter((s) => new Date(s.completedAt) >= weekStart)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  // Compute productivity score = minutes + (streak * 20) + (sessions * 15)
  const calculateScore = (mins: number, streak: number, sessions: number) => {
    return Math.round(mins * 1.5 + (streak || 0) * 25 + (sessions || 0) * 15);
  };

  const myScore = calculateScore(myWeeklyMinutes, profile?.streak || 0, profile?.totalSessions || 0);

  // Compile leaderboard list
  const entries: LeaderboardEntry[] = [
    {
      id: profile?.id || 'me',
      name: profile?.displayName || 'You',
      photoURL: profile?.photoURL,
      isMe: true,
      weeklyMinutes: myWeeklyMinutes,
      streak: profile?.streak || 0,
      productivityScore: myScore,
      level: profile?.level || 1
    }
  ];

  // Add friends
  friendsProfiles.forEach((f) => {
    // Estimating weekly minutes based on total or session telemetry
    const friendMins = Math.round((f.totalMinutes || 0) * 0.4);
    const score = calculateScore(friendMins, f.streak || 0, f.totalSessions || 0);
    entries.push({
      id: f.id,
      name: f.displayName,
      photoURL: f.photoURL,
      isMe: false,
      weeklyMinutes: friendMins,
      streak: f.streak || 0,
      productivityScore: score,
      level: f.level || 1
    });
  });

  // Sort descending by productivity score
  entries.sort((a, b) => b.productivityScore - a.productivityScore);

  // Milestones State
  const [claimedMilestones, setClaimedMilestones] = useState<string[]>(() => {
    const saved = localStorage.getItem('studytracker_claimed_milestones');
    return saved ? JSON.parse(saved) : [];
  });

  const milestones = [
    {
      id: 'first_session',
      title: 'First Focus Session',
      description: 'Complete your first tracked study session in the app',
      icon: '🌱',
      target: 1,
      current: profile?.totalSessions || 0,
      rewardXp: 50,
      unlocked: (profile?.totalSessions || 0) >= 1
    },
    {
      id: 'century_club',
      title: 'Centurion Scholar',
      description: 'Accumulate 100+ minutes of total study time in the cloud',
      icon: '⚡',
      target: 100,
      current: profile?.totalMinutes || 0,
      rewardXp: 100,
      unlocked: (profile?.totalMinutes || 0) >= 100
    },
    {
      id: 'streak_3d',
      title: 'Scholar’s Flame',
      description: 'Maintain an active consecutive study streak of 3 days',
      icon: '🔥',
      target: 3,
      current: profile?.streak || 0,
      rewardXp: 150,
      unlocked: (profile?.streak || 0) >= 3
    },
    {
      id: 'friend_squad',
      title: 'Study Squad',
      description: 'Connect with a friend using friend codes or invite links',
      icon: '🤝',
      target: 1,
      current: friendsProfiles.length,
      rewardXp: 75,
      unlocked: friendsProfiles.length >= 1
    },
    {
      id: 'level_2',
      title: 'Rising Scholar',
      description: 'Attain Level 2 Scholar ranking through XP progression',
      icon: '⭐',
      target: 2,
      current: profile?.level || 1,
      rewardXp: 120,
      unlocked: (profile?.level || 1) >= 2
    },
    {
      id: 'deep_diver',
      title: 'Master of Deep Work',
      description: 'Reach 300+ total focus minutes logged',
      icon: '🎯',
      target: 300,
      current: profile?.totalMinutes || 0,
      rewardXp: 250,
      unlocked: (profile?.totalMinutes || 0) >= 300
    }
  ];

  const handleClaim = (milestoneId: string) => {
    const updated = [...claimedMilestones, milestoneId];
    setClaimedMilestones(updated);
    localStorage.setItem('studytracker_claimed_milestones', JSON.stringify(updated));

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="space-y-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#1b0d38] via-[#101026] to-[#09152b] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-purple-950/30">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>Weekly Productivity Dashboard & Leaderboard</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Productivity Scores & Milestones
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Compare your weekly focus efficiency against connected friends, unlock milestone achievements, and climb the Scholar leaderboards.
          </p>
        </div>

        {/* My Score Badge */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.1] backdrop-blur-md flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Your Productivity Score
            </span>
            <div className="text-2xl font-black text-amber-400 flex items-center gap-1.5">
              <Zap className="w-5 h-5 fill-amber-400" />
              <span>{myScore} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table / Podium */}
      <div className="rounded-3xl bg-[#0b0c16] border border-purple-900/30 p-6 shadow-lg shadow-purple-950/20 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Weekly Squad Leaderboard
            </h3>
          </div>
          <span className="text-xs text-slate-400">Updates live in real-time</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 uppercase tracking-wider border-b border-white/[0.06] text-[10px]">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Scholar</th>
                <th className="pb-3">Level</th>
                <th className="pb-3">This Week</th>
                <th className="pb-3">Streak</th>
                <th className="pb-3 pr-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {entries.map((entry, idx) => {
                const rank = idx + 1;
                const medal =
                  rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      entry.isMe ? 'bg-purple-600/10 hover:bg-purple-600/15' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-3 pl-2 font-bold font-mono text-sm">
                      <span className={rank <= 3 ? 'text-lg' : 'text-slate-500'}>{medal}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        {entry.photoURL ? (
                          <img
                            src={entry.photoURL}
                            alt={entry.name}
                            className="w-7 h-7 rounded-full border border-purple-500/40"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-white">
                          {entry.name} {entry.isMe && <span className="text-purple-400 font-normal">(You)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-slate-300 font-mono">
                        Lv {entry.level}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {entry.weeklyMinutes}m
                    </td>
                    <td className="py-3 font-mono text-amber-400">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-amber-400" />
                        {entry.streak}d
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right font-black font-mono text-amber-300 text-sm">
                      {entry.productivityScore}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Milestones & Badges Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white tracking-tight">Milestones & Achievements</h3>
          </div>
          <span className="text-xs text-purple-400 font-medium">
            {claimedMilestones.length} / {milestones.length} Claimed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((ms) => {
            const isClaimed = claimedMilestones.includes(ms.id);
            const progress = Math.min(100, Math.round((ms.current / ms.target) * 100));

            return (
              <div
                key={ms.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group shadow-lg ${
                  isClaimed
                    ? 'bg-[#091510] border-emerald-500/30'
                    : ms.unlocked
                    ? 'bg-[#150f24] border-purple-500/50 shadow-purple-950/30'
                    : 'bg-[#0d0c17] border-white/[0.06] opacity-80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] inline-block">
                      {ms.icon}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      +{ms.rewardXp} XP
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{ms.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{ms.description}</p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Progress</span>
                      <span>
                        {Math.min(ms.current, ms.target)} / {ms.target}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isClaimed ? 'bg-emerald-400' : 'bg-purple-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Claim / Status Button */}
                <div className="pt-4 mt-3 border-t border-white/[0.06]">
                  {isClaimed ? (
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400 py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Unlocked & Claimed</span>
                    </div>
                  ) : ms.unlocked ? (
                    <button
                      onClick={() => handleClaim(ms.id)}
                      className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                    >
                      Claim Milestone
                    </button>
                  ) : (
                    <div className="text-center text-[11px] font-medium text-slate-500 py-1">
                      Locked
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
