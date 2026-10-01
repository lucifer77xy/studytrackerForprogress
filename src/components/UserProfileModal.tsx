import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  User,
  Mail,
  Camera,
  Check,
  Sparkles,
  Flame,
  Clock,
  Zap,
  Copy,
  RefreshCw,
  Share2
} from 'lucide-react';
import { copyTextToClipboard } from '../lib/clipboard';
import confetti from 'canvas-confetti';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, user, updateProfileDetails, regenerateFriendCode } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhotoURL(profile.photoURL || '');
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setSaving(true);
    try {
      await updateProfileDetails({
        displayName: displayName.trim(),
        photoURL: photoURL.trim()
      });
      setSavedSuccess(true);
      confetti({ particleCount: 40, spread: 60 });
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = async () => {
    if (!profile?.friendCode) return;
    const ok = await copyTextToClipboard(profile.friendCode);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    if (!profile?.friendCode) return;
    const link = `${window.location.origin}?join_friend=${profile.friendCode}`;
    const ok = await copyTextToClipboard(link);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-['Plus_Jakarta_Sans',sans-serif] animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-[#0e0c19] border border-purple-500/30 p-6 shadow-2xl shadow-purple-950/80 relative overflow-hidden space-y-5">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Your Scholar Profile</h3>
              <p className="text-[11px] text-slate-400">Google Account & Identity Settings</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Avatar & Quick Stats */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] relative z-10">
          <div className="relative">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="w-16 h-16 rounded-2xl border-2 border-purple-500/50 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border-2 border-purple-400/40 flex items-center justify-center text-2xl font-black text-white">
                {displayName.charAt(0).toUpperCase() || 'S'}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-black/80 border border-white/20 text-purple-300">
              <Sparkles className="w-3 h-3" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{displayName || 'Scholar'}</h4>
            <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 shrink-0" />
              <span>{user?.email || profile?.email || 'Authenticated User'}</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                Level {profile?.level || 1}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 fill-current" />
                <span>{profile?.streak || 0}d streak</span>
              </span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name or handle"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Profile Photo URL (Optional)
            </label>
            <input
              type="url"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://... avatar image link"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/60 text-xs font-mono"
            />
          </div>

          {/* Friend Code Section */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Your Unique Friend Code
            </span>
            <div className="flex items-center justify-between">
              <span className="text-base font-black font-mono text-purple-300">
                {profile?.friendCode}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3 h-3" />
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-semibold">
              ✓ Profile saved successfully!
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
