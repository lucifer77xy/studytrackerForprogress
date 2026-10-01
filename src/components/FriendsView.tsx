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
  BookOpen
} from 'lucide-react';

interface FriendsViewProps {
  onJoinStudyWithFriend?: (friendName: string) => void;
  initialFriendCode?: string | null;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  onJoinStudyWithFriend,
  initialFriendCode
}) => {
  const { profile, friendsProfiles, addFriendByCode, removeFriend } = useAuth();

  const [inputCode, setInputCode] = useState(initialFriendCode || '');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // If initialFriendCode is passed via URL param (?join_friend=...), try linking
  useEffect(() => {
    if (initialFriendCode && profile && initialFriendCode !== profile.friendCode) {
      setInputCode(initialFriendCode);
    }
  }, [initialFriendCode, profile]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setLoading(true);
    setFeedback(null);
    const res = await addFriendByCode(inputCode.trim());
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setInputCode('');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
    setLoading(false);
  };

  const copyMyCode = () => {
    if (!profile?.friendCode) return;
    navigator.clipboard.writeText(profile.friendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyMyLink = () => {
    if (!profile?.friendCode) return;
    const link = `${window.location.origin}?join_friend=${profile.friendCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#170e2f] via-[#101026] to-[#0d1329] border border-purple-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl shadow-purple-950/30">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Friend Progress Tracking & Social Sync</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Connect Study Friends
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Link your classmates and friends to monitor their study status, compare weekly streaks, and jump into collaborative focus rooms together.
          </p>
        </div>

        {/* My Unique Code Card */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.1] backdrop-blur-md space-y-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Your Unique Friend Code
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black font-mono text-purple-300 tracking-wider">
              {profile?.friendCode || 'ST-????'}
            </span>
            <button
              onClick={copyMyCode}
              title="Copy friend code"
              className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={copyMyLink}
              title="Copy shareable invite link"
              className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-xs text-purple-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Link a Friend Input Card */}
      <div className="p-5 rounded-2xl bg-[#0e0c19] border border-purple-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Link a Friend by Code</h3>
          <p className="text-xs text-slate-400">Ask your friend for their 6-digit code (e.g. ST-4K89) and enter it here.</p>
        </div>

        <form onSubmit={handleAddFriend} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="ST-XXXX"
            className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-white font-mono placeholder-slate-500 outline-none uppercase focus:border-purple-500/60"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{loading ? 'Linking...' : 'Connect'}</span>
          </button>
        </form>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium text-center border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Connected Friends List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Connected Friends</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
              {friendsProfiles.length}
            </span>
          </h3>
          <span className="text-xs text-slate-400">Live cloud sync</span>
        </div>

        {friendsProfiles.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#0c0c16] border border-white/[0.06] text-center space-y-3">
            <Users className="w-10 h-10 text-purple-400/40 mx-auto" />
            <h4 className="text-base font-bold text-white">No Friends Connected Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Share your invite code or link with classmates. Once they connect, you will see their live study status, streaks, and focus metrics here!
            </p>
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
                            {fr.displayName.charAt(0).toUpperCase()}
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
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-red-400 transition-opacity"
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
                      <span>Study Together</span>
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
