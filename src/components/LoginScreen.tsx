import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Users, Flame, BookOpen, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Google sign-in was cancelled or encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070c] text-slate-100 flex flex-col justify-between relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background ambient radial gradients */}
      <div className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-5%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-white/[0.06] backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              StudyTracker
            </span>
            <span className="block text-[11px] font-medium text-purple-400/90 tracking-wide uppercase">
              Student Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Cloud Sync
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center items-center relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-6 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Real-Time Collaborative Study Suite with Friend Progress Tracking
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] mb-6">
          Study with your squad, track progress in{' '}
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            real time
          </span>
          , and level up together.
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
          Log in with Google to access your persistent cloud workspace. Link friends with a custom code or link, sync collaborative notes, run synchronized Pomodoro sessions, and compete on the weekly productivity leaderboard.
        </p>

        {/* Google Sign In Call to Action */}
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-white text-slate-950 font-semibold flex items-center justify-center gap-3 shadow-xl shadow-white/10 hover:bg-slate-100 active:scale-[0.98] transition-all cursor-pointer group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-base">Continue with Google</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform ml-1" />
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Google sign-in required for cloud sync & real-time study rooms
          </p>

          {error && (
            <div className="w-full mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
              {error}
            </div>
          )}
        </div>

        {/* Feature Grid Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 w-full text-left">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-white mb-1">Friend Study Linking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your friends via invite code or custom link. See who is currently focusing, their streaks, and weekly hours.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:border-blue-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-white mb-1">Live Collaborative Rooms</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Join synchronized study rooms with shared Pomodoro timers, real-time cooperative notes, and instant encouragement cheers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:border-amber-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-white mb-1">Productivity Leaderboard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compare weekly productivity scores and milestones side-by-side with your friends to stay accountable and motivated.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-white mb-1">Complete Study Suite</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Equipped with focus timers, procedural ambient soundscapes, flashcard decks, goals tracking, and XP progression.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-white/[0.06] text-center text-xs text-slate-500 relative z-10">
        StudyTracker · Cloud Synchronized Study Portal · Sign in to start studying
      </footer>
    </div>
  );
};
