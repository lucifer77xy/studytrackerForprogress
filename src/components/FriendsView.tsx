import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Copy,
  Check,
  UserPlus,
  Flame,
  Clock,
  Sparkles,
  Zap,
  Trash2,
  Share2,
  BookOpen,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Mail,
  ShieldCheck,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { copyTextToClipboard } from '../lib/clipboard';
import confetti from 'canvas-confetti';

interface FriendsViewProps {
  onJoinStudyWithFriend?: (friendName: string) => void;
  initialFriendCode?: string | null;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  onJoinStudyWithFriend,
  initialFriendCode
}) => {
  const { profile, user, friendsProfiles, addFriendByCode, removeFriend, regenerateFriendCode } = useAuth();

  const [inputCode, setInputCode] = useState(initialFriendCode || '');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatingNewCode, setGeneratingNewCode] = useState(false);

  // Derive active friend code, ensuring it never remains empty
  const activeCode = profile?.friendCode || 'ST-7X92';
  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}?join_friend=${activeCode}`
    : `https://studytracker.app?join_friend=${activeCode}`;

  // If initialFriendCode is passed via URL param (?join_friend=...), try linking
  useEffect(() => {
    if (initialFriendCode && profile && initialFriendCode !== profile.friendCode) {
      setInputCode(initialFriendCode);
    }
  }, [initialFriendCode, profile]);

  // Clean code extraction: handles both raw code ("ST-4K89") and pasted URLs (".../?join_friend=ST-4K89")
  const extractCode = (raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed.includes('join_friend=')) {
      try {
        const url = new URL(trimmed);
        const code = url.searchParams.get('join_friend');
        if (code) return code.toUpperCase();
      } catch {
        const match = trimmed.match(/join_friend=([A-Za-z0-9_-]+)/);
        if (match && match[1]) return match[1].toUpperCase();
      }
    }
    return trimmed.toUpperCase();
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = extractCode(inputCode);
    if (!cleanCode) return;

    setLoading(true);
    setFeedback(null);
    try {
      const res = await addFriendByCode(cleanCode);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setInputCode('');
        confetti({ particleCount: 50, spread: 60 });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error linking friend'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    const success = await copyTextToClipboard(activeCode);
    if (success) {
      setCopiedCode(true);
      setFeedback({ type: 'success', message: `Friend code "${activeCode}" copied to clipboard!` });
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyTextToClipboard(inviteLink);
    if (success) {
      setCopiedLink(true);
      setFeedback({ type: 'success', message: 'Invite link copied to clipboard! Share it with your friends.' });
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my StudyTracker Squad!',
          text: `Hey! Connect with me on StudyTracker to track study progress, sync timers, and hit milestones together:`,
          url: inviteLink,
        });
      } catch {
        // Fallback to copy link
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleRegenerateCode = async () => {
    setGeneratingNewCode(true);
    try {
      if (regenerateFriendCode) {
        await regenerateFriendCode();
        setFeedback({ type: 'success', message: 'Generated a new unique friend code!' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingNewCode(false);
    }
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#170e2f] via-[#101026] to-[#0d1329] border border-purple-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl shadow-purple-950/30 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Friend Progress Tracking & Social Sync</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Connect Study Friends
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Link your friends and study partners to monitor each other's live focus progress, compare weekly productivity scores, and study together in real time.
          </p>
        </div>

        {/* My Unique Code & Live Share Widget */}
        <div className="p-5 rounded-2xl bg-black/50 border border-white/[0.1] backdrop-blur-md space-y-3 shrink-0 relative z-10 w-full lg:w-auto">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Your Unique Friend Code
            </span>
            <button
              onClick={handleRegenerateCode}
              disabled={generatingNewCode}
              title="Generate fresh code"
              className="text-[10px] text-purple-300 hover:text-purple-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${generatingNewCode ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xl font-black font-mono text-purple-300 tracking-wider">
              {activeCode}
            </div>

            <button
              onClick={handleCopyCode}
              title="Copy friend code"
              className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleCopyLink}
              title="Copy shareable invite link"
              className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 active:scale-95 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Invite Link Box */}
      <div className="p-5 rounded-2xl bg-[#0d0c18] border border-purple-500/30 shadow-lg shadow-purple-950/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Live Shareable Invite Link
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Friends can click this link to instantly connect with you</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            readOnly
            value={inviteLink}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-xs font-mono text-purple-300 outline-none select-all cursor-text"
          />

          <button
            onClick={handleCopyLink}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/25 transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied to Clipboard' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleShareNative}
            className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>

        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 flex-wrap">
          <span>Quick Share:</span>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hey! Connect with me on StudyTracker to study together: ${inviteLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline flex items-center gap-1"
          >
            <MessageCircle className="w-3 h-3" />
            <span>WhatsApp</span>
          </a>
          <span>·</span>
          <a
            href={`mailto:?subject=${encodeURIComponent('Join my study group on StudyTracker')}&body=${encodeURIComponent(`Hi,\n\nLet's connect and study together on StudyTracker. Click my invite link to join:\n${inviteLink}\n\nHappy studying!`)}`}
            className="text-blue-400 hover:underline flex items-center gap-1"
          >
            <Mail className="w-3 h-3" />
            <span>Email</span>
          </a>
        </div>
      </div>

      {/* Link a Friend by Code Form */}
      <div className="p-5 rounded-2xl bg-[#0e0c19] border border-purple-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Link a Friend by Code or Invite Link</h3>
          <p className="text-xs text-slate-400">
            Paste your classmate's code (e.g. <span className="text-purple-300 font-mono">ST-4K89</span>) or their full invite link.
          </p>
        </div>

        <form onSubmit={handleAddFriend} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="ST-XXXX or invite link..."
            className="px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-white font-mono placeholder-slate-500 outline-none uppercase focus:border-purple-500/60 min-w-[180px]"
          />
          <button
            type="submit"
            disabled={loading || !inputCode.trim()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{loading ? 'Linking...' : 'Connect'}</span>
          </button>
        </form>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold text-center border animate-in fade-in duration-150 flex items-center justify-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : null}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Connected Friends List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Connected Friends & Study Partners</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
              {friendsProfiles.length}
            </span>
          </h3>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live cloud synchronization</span>
          </span>
        </div>

        {friendsProfiles.length === 0 ? (
          <div className="p-10 rounded-3xl bg-[#0c0c16] border border-white/[0.06] text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">No Friends Connected Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Share your invite link above with your classmates. As soon as they click or enter your code, both of you can monitor each other's live focus timers, subject topics, and streaks!
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/30 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy Your Invite Link</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friendsProfiles.map((fr) => {
              const totalHours = Math.round(((fr.totalMinutes || 0) / 60) * 10) / 10;
              const isStudying = fr.status === 'studying';
              const isBreak = fr.status === 'break';

              return (
                <div
                  key={fr.id}
                  className="p-5 rounded-2xl bg-[#0d0c17] border border-purple-900/30 hover:border-purple-500/50 transition-all flex flex-col justify-between group shadow-lg shadow-purple-950/20 space-y-4"
                >
                  <div className="space-y-3">
                    {/* Friend Profile Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {fr.photoURL ? (
                          <img
                            src={fr.photoURL}
                            alt={fr.displayName}
                            className="w-10 h-10 rounded-full border border-purple-500/40 object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-bold text-white text-sm">
                            {fr.displayName?.charAt(0).toUpperCase() || 'F'}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">
                            {fr.displayName}
                          </h4>
                          <span className="text-[11px] font-medium text-purple-300">
                            Level {fr.level || 1} Scholar
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFriend(fr.id)}
                        title="Remove friend connection"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-red-400 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Real-time Status Badge */}
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isStudying
                              ? 'bg-emerald-400 animate-pulse'
                              : isBreak
                              ? 'bg-amber-400'
                              : 'bg-slate-500'
                          }`}
                        />
                        <span className="font-semibold text-slate-200">
                          {isStudying ? 'Studying Now' : isBreak ? 'On Short Break' : 'Currently Idle'}
                        </span>
                      </div>
                      {isStudying && fr.currentSubject && (
                        <span className="text-[11px] text-purple-300 truncate max-w-[120px]">
                          {fr.currentSubject}
                        </span>
                      )}
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Streak</span>
                        <span className="text-xs font-bold text-amber-400 flex items-center justify-center gap-0.5 mt-0.5">
                          <Flame className="w-3 h-3 fill-amber-400" />
                          {fr.streak || 0}d
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Hours</span>
                        <span className="text-xs font-bold text-blue-400 flex items-center justify-center gap-0.5 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {totalHours}h
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">XP</span>
                        <span className="text-xs font-bold text-purple-400 flex items-center justify-center gap-0.5 mt-0.5">
                          <Zap className="w-3 h-3" />
                          {fr.xp || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => onJoinStudyWithFriend && onJoinStudyWithFriend(fr.displayName)}
                      className="w-full py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Study Together in Duo</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
