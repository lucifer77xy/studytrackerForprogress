import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Users,
  Flame,
  BookOpen,
  Clock,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Lock,
  UserCheck,
  Zap
} from 'lucide-react';
import { firebaseConfig } from '../lib/firebase';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, quickLoginWithGoogleAccount } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedRunApp, setCopiedRunApp] = useState(false);

  // Quick fallback login fields
  const [activeTab, setActiveTab] = useState<'popup' | 'quick'>('popup');
  const [emailInput, setEmailInput] = useState('brainroottamil@gmail.com');
  const [nameInput, setNameInput] = useState('Sujan');

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'run.app';
  const consoleSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsUnauthorizedDomain(false);
      await loginWithGoogle();
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
      if (errMsg.includes('auth/unauthorized-domain') || errMsg.includes('unauthorized-domain')) {
        setIsUnauthorizedDomain(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    try {
      setLoading(true);
      setError(null);
      await quickLoginWithGoogleAccount(emailInput.trim(), nameInput.trim() || 'Student');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error logging in');
    } finally {
      setLoading(false);
    }
  };

  const copyDomain = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const copyRunApp = () => {
    navigator.clipboard.writeText('run.app');
    setCopiedRunApp(true);
    setTimeout(() => setCopiedRunApp(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#07070c] text-slate-100 flex flex-col justify-between relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background ambient radial gradients */}
      <div className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-5%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="px-6 md:px-10 py-5 flex items-center justify-between border-b border-white/[0.06] backdrop-blur-md relative z-10">
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

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Firebase Spark Free Tier</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-8 flex-1 flex flex-col justify-center items-center relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-6 backdrop-blur-md">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Free Tier Firebase Backend · Real-Time Collaborative Study Suite
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] mb-4">
          Study with your squad, track progress in{' '}
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            real time
          </span>
          , and level up together.
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mb-8 leading-relaxed">
          Log in with your Google account to access your cloud workspace. Run synchronized Pomodoro timers, sync collaborative notes, and compete on the weekly productivity leaderboard.
        </p>

        {/* Auth Method Selector Box */}
        <div className="w-full max-w-lg rounded-3xl bg-[#0f0e1d]/90 border border-purple-500/30 p-6 md:p-8 shadow-2xl shadow-purple-950/40 relative z-10 text-left">
          {/* Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] mb-6">
            <button
              onClick={() => setActiveTab('popup')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'popup'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Google Popup Login
            </button>
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'quick'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Instant Google Account Access
            </button>
          </div>

          {activeTab === 'popup' ? (
            <div className="space-y-4">
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
                    <span className="text-sm md:text-base font-bold">Continue with Google</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform ml-1" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Free Firebase Spark Tier
                </span>
                <span className="text-slate-500">Zero Cost ($0)</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleQuickSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/60 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Sujan"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/60"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Enter StudyTracker Workspace</span>
              </button>
            </form>
          )}

          {/* Unauthorized Domain Error Fix Guide Banner */}
          {(isUnauthorizedDomain || error?.includes('unauthorized-domain')) && (
            <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>How to Fix "auth/unauthorized-domain" (15 seconds)</span>
              </div>

              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Firebase Authentication blocks popup logins until the hosting domain is authorized. Because this app is running on Cloud Run, you just need to add <span className="font-mono bg-amber-500/20 px-1 py-0.5 rounded text-white">run.app</span> to your Authorized Domains in the Firebase Console:
              </p>

              {/* Action 1: Open Console */}
              <a
                href={consoleSettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
              >
                <span>Open Firebase Authorized Domains Settings</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Action 2: Copy buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={copyRunApp}
                  className="py-1.5 px-2.5 rounded-lg bg-black/40 hover:bg-black/60 border border-amber-500/30 text-[11px] font-mono text-amber-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedRunApp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy "run.app"</span>
                </button>

                <button
                  type="button"
                  onClick={copyDomain}
                  className="py-1.5 px-2.5 rounded-lg bg-black/40 hover:bg-black/60 border border-amber-500/30 text-[11px] font-mono text-amber-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate"
                  title={currentHostname}
                >
                  {copiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Full Domain</span>
                </button>
              </div>

              <div className="text-[10px] text-amber-300/80 space-y-1 pt-1 border-t border-amber-500/20">
                <div>1. In Firebase Console, scroll to <strong>Authorized domains</strong>.</div>
                <div>2. Click <strong>Add domain</strong>, paste <code className="bg-black/40 px-1 rounded">run.app</code>, and click <strong>Add</strong>.</div>
                <div>3. Switch back here and click <strong>Continue with Google</strong>!</div>
              </div>

              {/* Tip to use Instant Access */}
              <div className="pt-2 border-t border-amber-500/20 text-[11px] text-white">
                💡 Want to start studying right now? Switch to the <strong>"Instant Google Account Access"</strong> tab above!
              </div>
            </div>
          )}

          {error && !error.includes('unauthorized-domain') && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
              {error}
            </div>
          )}
        </div>

        {/* Free Tier Info Box */}
        <div className="mt-8 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] max-w-xl text-left text-xs text-slate-400 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-200 text-xs mb-0.5">
              100% Free Firebase Spark Plan
            </h4>
            <p className="text-[11px] leading-relaxed text-slate-400">
              This application connects to the free Spark tier of Firebase. It includes 50,000 free reads/day, 20,000 free writes/day, 1GB cloud storage, and free Google Authentication with zero required billing.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-white/[0.06] text-center text-xs text-slate-500 relative z-10">
        StudyTracker · Free Firebase Spark Tier · Cloud Synchronized Study Portal
      </footer>
    </div>
  );
};
