import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import {
  Users,
  Copy,
  Check,
  Share2,
  Flame,
  Clock,
  Zap,
  Radio,
  Coffee,
  CheckCircle2,
  Sparkles,
  Heart,
  Plus,
  ArrowRightLeft,
  Circle
} from 'lucide-react';
import { copyTextToClipboard } from '../lib/clipboard';
import confetti from 'canvas-confetti';

interface PartnershipData {
  id: string;
  partnerACode: string;
  partnerAId: string;
  partnerAName: string;
  partnerBId: string;
  partnerBName: string;
  partnerBCode: string;
  sharedGoals: { id: string; title: string; completed: boolean; by: string }[];
  lastReaction?: { emoji: string; text: string; sender: string; timestamp: string };
  updatedAt: string;
}

interface PartnerLiveViewProps {
  initialPartnerCode?: string | null;
}

export const PartnerLiveView: React.FC<PartnerLiveViewProps> = ({ initialPartnerCode }) => {
  const { user, profile, friendsProfiles, recentSessions } = useAuth();
  const { isRunning, secondsRemaining, subject, totalSeconds } = useTimer();

  const [partnerCodeInput, setPartnerCodeInput] = useState(initialPartnerCode || '');
  const [partnership, setPartnership] = useState<PartnershipData | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [recentCheer, setRecentCheer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Calculate today's minutes
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const myTodayMins = recentSessions
    .filter((s) => new Date(s.completedAt) >= startOfToday)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  // 2. Listen to active partnership in Firestore
  useEffect(() => {
    if (!user) return;

    // Check partnerships where user is A or B
    const q1 = query(collection(db, 'partnerships'), where('partnerAId', '==', user.uid));
    const unsub1 = onSnapshot(q1, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data() as PartnershipData;
        setPartnership(data);
        fetchPartnerDetails(data.partnerBId);
      } else {
        const q2 = query(collection(db, 'partnerships'), where('partnerBId', '==', user.uid));
        getDocs(q2).then((snap2) => {
          if (!snap2.empty) {
            const data2 = snap2.docs[0].data() as PartnershipData;
            setPartnership(data2);
            fetchPartnerDetails(data2.partnerAId);
          }
        });
      }
    });

    return () => unsub1();
  }, [user]);

  // Fetch partner profile live
  const fetchPartnerDetails = (partnerUid: string) => {
    const unsub = onSnapshot(doc(db, 'users', partnerUid), (snap) => {
      if (snap.exists()) {
        setPartnerProfile(snap.data());
      }
    });
    return unsub;
  };

  // Clean code extraction: handles both raw code ("ST-4K89") and pasted URLs (".../?partner=ST-4K89")
  const extractCode = (raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed.includes('partner=')) {
      try {
        const url = new URL(trimmed);
        const code = url.searchParams.get('partner');
        if (code) return code.toUpperCase();
      } catch {
        const match = trimmed.match(/partner=([A-Za-z0-9_-]+)/);
        if (match && match[1]) return match[1].toUpperCase();
      }
    }
    return trimmed.toUpperCase();
  };

  // Connect with Partner
  const handleConnectPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !partnerCodeInput.trim()) return;

    const cleanCode = extractCode(partnerCodeInput);
    if (cleanCode === profile.friendCode) {
      alert('You cannot pair with your own code!');
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('friendCode', '==', cleanCode));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert(`No student found with code ${cleanCode}`);
        setLoading(false);
        return;
      }

      const partnerDoc = snap.docs[0];
      const partnerData = partnerDoc.data();

      // Create partnership document
      const partnershipId = `partner_${[user.uid, partnerData.id].sort().join('_')}`;
      const partnershipRef = doc(db, 'partnerships', partnershipId);

      const newPartnership: PartnershipData = {
        id: partnershipId,
        partnerAId: user.uid,
        partnerAName: profile.displayName,
        partnerACode: profile.friendCode,
        partnerBId: partnerData.id,
        partnerBName: partnerData.displayName,
        partnerBCode: partnerData.friendCode,
        sharedGoals: [
          { id: '1', title: 'Complete 50 min deep focus today', completed: false, by: profile.displayName },
          { id: '2', title: 'Review core lecture notes together', completed: false, by: partnerData.displayName }
        ],
        updatedAt: new Date().toISOString()
      };

      await setDoc(partnershipRef, newPartnership);
      setPartnership(newPartnership);
      setPartnerProfile(partnerData);
      setPartnerCodeInput('');

      confetti({ particleCount: 60, spread: 70 });
    } catch (err) {
      console.error('Error connecting partner:', err);
    } finally {
      setLoading(false);
    }
  };

  // Send Live Reaction Cheer
  const handleSendCheer = async (emoji: string, text: string) => {
    if (!partnership || !profile) return;
    try {
      const partRef = doc(db, 'partnerships', partnership.id);
      await updateDoc(partRef, {
        lastReaction: {
          emoji,
          text,
          sender: profile.displayName,
          timestamp: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      });

      setRecentCheer(`Sent ${emoji} to your partner!`);
      setTimeout(() => setRecentCheer(null), 2500);

      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    } catch (err) {
      console.error('Cheer error:', err);
    }
  };

  // Add Shared Goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnership || !newGoalText.trim() || !profile) return;
    try {
      const partRef = doc(db, 'partnerships', partnership.id);
      const newGoal = {
        id: Date.now().toString(),
        title: newGoalText.trim(),
        completed: false,
        by: profile.displayName
      };
      await updateDoc(partRef, {
        sharedGoals: [...partnership.sharedGoals, newGoal],
        updatedAt: new Date().toISOString()
      });
      setNewGoalText('');
    } catch (err) {
      console.error('Add goal error:', err);
    }
  };

  // Toggle Shared Goal
  const handleToggleGoal = async (goalId: string) => {
    if (!partnership) return;
    try {
      const partRef = doc(db, 'partnerships', partnership.id);
      const updated = partnership.sharedGoals.map((g) =>
        g.id === goalId ? { ...g, completed: !g.completed } : g
      );
      await updateDoc(partRef, {
        sharedGoals: updated,
        updatedAt: new Date().toISOString()
      });
      confetti({ particleCount: 40, spread: 60 });
    } catch (err) {
      console.error('Toggle goal error:', err);
    }
  };

  const copyMyPartnerLink = async () => {
    if (!profile?.friendCode) return;
    const link = `${window.location.origin}?partner=${profile.friendCode}`;
    const success = await copyTextToClipboard(link);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const copyMyCode = async () => {
    if (!profile?.friendCode) return;
    const success = await copyTextToClipboard(profile.friendCode);
    if (success) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#170e2f] via-[#101026] to-[#07191d] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-purple-950/30">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>Live Study Partner Duo Mode</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Study With Your Partner Live
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Link with a study partner using your invite link or code. See each other’s live timers, current focus topics, today’s hours, and cheer each other on in real time.
          </p>
        </div>

        {/* Generate Link / Code Button */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-md space-y-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Your Partner Invite Code
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black font-mono text-cyan-300 tracking-wider">
              {profile?.friendCode || 'ST-????'}
            </span>
            <button
              onClick={copyMyCode}
              title="Copy code"
              className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={copyMyPartnerLink}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-xs text-cyan-200 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Link Copied!' : 'Copy Partner Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connect Partner Form if not connected */}
      {!partnership && (
        <div className="p-5 rounded-2xl bg-[#0e0c19] border border-purple-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Pair with Your Study Partner</h3>
            <p className="text-xs text-slate-400">Enter your partner's 6-character code to link your study desks.</p>
          </div>

          <form onSubmit={handleConnectPartner} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={partnerCodeInput}
              onChange={(e) => setPartnerCodeInput(e.target.value)}
              placeholder="e.g. ST-4K89"
              className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-white font-mono placeholder-slate-500 outline-none uppercase focus:border-cyan-500/60"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-cyan-500/25"
            >
              {loading ? 'Pairing...' : 'Link Partner'}
            </button>
          </form>
        </div>
      )}

      {/* Side-by-Side Live Duo HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: YOU (6 cols) */}
        <div className="lg:col-span-6 rounded-3xl bg-[#0e0c19] border border-purple-500/30 p-6 flex flex-col justify-between shadow-xl shadow-purple-950/20 relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Your Desk</span>
              </span>
              <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                {profile?.friendCode}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-14 h-14 rounded-2xl border-2 border-purple-500/50 object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-purple-600/30 border-2 border-purple-500/50 flex items-center justify-center text-xl font-bold text-white">
                  {profile?.displayName?.charAt(0).toUpperCase() || 'Y'}
                </div>
              )}
              <div>
                <h3 className="text-xl font-black text-white">{profile?.displayName || 'You'}</h3>
                <p className="text-xs text-slate-400">Level {profile?.level || 1} Scholar</p>
              </div>
            </div>

            {/* Live Focus Status */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span className="text-xs font-bold text-slate-200">
                  {isRunning ? `Focusing on ${subject}` : 'Idle / Ready'}
                </span>
              </div>
              <span className="text-lg font-black font-mono text-white">
                {formatTimer(secondsRemaining)}
              </span>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Today</span>
                <span className="text-sm font-black text-white mt-0.5">{myTodayMins}m</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Streak</span>
                <span className="text-sm font-black text-amber-400 mt-0.5">{profile?.streak || 0}d</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Total</span>
                <span className="text-sm font-black text-purple-400 mt-0.5">
                  {Math.round(((profile?.totalMinutes || 0) / 60) * 10) / 10}h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: PARTNER (6 cols) */}
        <div className="lg:col-span-6 rounded-3xl bg-[#09111c] border border-cyan-500/30 p-6 flex flex-col justify-between shadow-xl shadow-cyan-950/20 relative overflow-hidden">
          {partnerProfile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Partner's Desk (Live)</span>
                </span>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {partnerProfile.friendCode}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {partnerProfile.photoURL ? (
                  <img
                    src={partnerProfile.photoURL}
                    alt={partnerProfile.displayName}
                    className="w-14 h-14 rounded-2xl border-2 border-cyan-500/50 object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-cyan-600/30 border-2 border-cyan-500/50 flex items-center justify-center text-xl font-bold text-cyan-300">
                    {partnerProfile.displayName?.charAt(0).toUpperCase() || 'P'}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-black text-white">{partnerProfile.displayName}</h3>
                  <p className="text-xs text-slate-400">Level {partnerProfile.level || 1} Scholar</p>
                </div>
              </div>

              {/* Partner Live Status */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      partnerProfile.status === 'studying'
                        ? 'bg-emerald-400 animate-pulse'
                        : partnerProfile.status === 'break'
                        ? 'bg-amber-400'
                        : 'bg-slate-500'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-200">
                    {partnerProfile.status === 'studying'
                      ? `Focusing on ${partnerProfile.currentSubject || 'Studies'}`
                      : partnerProfile.status === 'break'
                      ? 'Taking a breather'
                      : 'Idle right now'}
                  </span>
                </div>
                <span className="text-xs text-cyan-300 font-mono">
                  {partnerProfile.status === 'studying' ? '🔥 Active' : 'Resting'}
                </span>
              </div>

              {/* Partner Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Streak</span>
                  <span className="text-sm font-black text-amber-400 mt-0.5">
                    {partnerProfile.streak || 0}d
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Sessions</span>
                  <span className="text-sm font-black text-white mt-0.5">
                    {partnerProfile.totalSessions || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Hours</span>
                  <span className="text-sm font-black text-cyan-400 mt-0.5">
                    {Math.round(((partnerProfile.totalMinutes || 0) / 60) * 10) / 10}h
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <Users className="w-12 h-12 text-cyan-400/40" />
              <h4 className="text-base font-bold text-white">No Partner Linked Yet</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Share your partner link or enter a partner's code above to establish a live dual desk!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Live Reactions & Encouragement Bar */}
      {partnership && (
        <div className="p-5 rounded-2xl bg-[#0e0c19] border border-purple-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">Send Partner a Live Boost:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleSendCheer('🔥', 'You are on fire! Keep going!')}
              className="px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>🔥 Fire Focus</span>
            </button>

            <button
              onClick={() => handleSendCheer('☕', 'Hydrate and stretch for a minute!')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>☕ Take a Sip</span>
            </button>

            <button
              onClick={() => handleSendCheer('🎯', 'Goal crushed! Awesome job!')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>🎯 Goal Crushed</span>
            </button>

            <button
              onClick={() => handleSendCheer('👏', 'Proud of your hard work today!')}
              className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>👏 High Five</span>
            </button>
          </div>

          {recentCheer && (
            <span className="text-xs font-semibold text-emerald-400 animate-pulse">
              {recentCheer}
            </span>
          )}
        </div>
      )}

      {/* Shared Daily Study Goals Checklist */}
      {partnership && (
        <div className="p-6 rounded-2xl bg-[#0b0c16] border border-purple-900/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Partner Daily Mission Checklist</span>
            </h3>
            <span className="text-xs text-slate-400">Syncs live across both devices</span>
          </div>

          {/* Add Goal form */}
          <form onSubmit={handleAddGoal} className="flex items-center gap-2">
            <input
              type="text"
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              placeholder="Add a shared task for today..."
              className="flex-1 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500/60"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </form>

          {/* Goals list */}
          <div className="space-y-2">
            {partnership.sharedGoals?.map((g) => (
              <div
                key={g.id}
                onClick={() => handleToggleGoal(g.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  g.completed
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/[0.03] border-white/[0.06] text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {g.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500" />
                  )}
                  <span className={`text-xs font-semibold ${g.completed ? 'line-through text-slate-400' : ''}`}>
                    {g.title}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Added by {g.by}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
