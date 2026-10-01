import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ambientAudio } from '../lib/audio';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMinutes?: number;
  initialSubject?: string;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  onClose,
  initialMinutes = 25,
  initialSubject = 'General Study'
}) => {
  const { recordStudySession, updateUserStatus } = useAuth();

  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [sessionNotes, setSessionNotes] = useState('');
  const [selectedSound, setSelectedSound] = useState<'rain' | 'whitenoise' | 'brownnoise' | 'waves' | 'none'>('rain');
  const [soundVolume, setSoundVolume] = useState(0.35);

  const timerRef = useRef<number | null>(null);

  // Sync initial props
  useEffect(() => {
    if (isOpen) {
      const secs = initialMinutes * 60;
      setTotalSeconds(secs);
      setSecondsRemaining(secs);
      setSubject(initialSubject || 'General Study');
      setIsRunning(false);
    }
  }, [isOpen, initialMinutes, initialSubject]);

  // Interval timer loop
  useEffect(() => {
    if (isRunning) {
      updateUserStatus('studying', subject);
      if (selectedSound !== 'none') {
        ambientAudio.play(selectedSound, soundVolume);
      }

      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            ambientAudio.stop();
            ambientAudio.playBeep(880, 0.4);
            handleFinishSession(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      ambientAudio.stop();
      updateUserStatus('idle');
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, selectedSound]);

  const handleSoundChange = (type: 'rain' | 'whitenoise' | 'brownnoise' | 'waves' | 'none') => {
    setSelectedSound(type);
    if (isRunning) {
      if (type === 'none') {
        ambientAudio.stop();
      } else {
        ambientAudio.play(type, soundVolume);
      }
    }
  };

  const handleVolumeChange = (vol: number) => {
    setSoundVolume(vol);
    ambientAudio.setVolume(vol);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(totalSeconds);
    ambientAudio.stop();
  };

  const handlePresetSelect = (mins: number) => {
    setIsRunning(false);
    setTotalSeconds(mins * 60);
    setSecondsRemaining(mins * 60);
    ambientAudio.stop();
  };

  const handleFinishSession = async (completedNaturally = false) => {
    setIsRunning(false);
    ambientAudio.stop();
    const elapsedSeconds = totalSeconds - secondsRemaining;
    const minutesToLog = completedNaturally
      ? Math.round(totalSeconds / 60)
      : Math.max(1, Math.round(elapsedSeconds / 60));

    if (minutesToLog > 0) {
      await recordStudySession(minutesToLog, subject, sessionNotes);
    }
    onClose();
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-['Plus_Jakarta_Sans',sans-serif] animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-[#0f0e1a] border border-purple-500/30 p-6 md:p-8 shadow-2xl shadow-purple-950/60 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Focus Session</h3>
              <p className="text-[11px] text-slate-400">Syncs to cloud & XP leaderboard</p>
            </div>
          </div>

          <button
            onClick={() => {
              ambientAudio.stop();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subject input & presets */}
        <div className="mt-5 space-y-3 relative z-10">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Subject / Topic
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus-within:border-purple-500/50 transition-colors">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics, Organic Chemistry, CS algorithms..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Quick Duration Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => handlePresetSelect(mins)}
                disabled={isRunning}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  totalSeconds === mins * 60
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/40'
                    : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Circular Countdown Display */}
        <div className="my-8 flex flex-col items-center justify-center relative z-10">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG circle */}
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                className="text-white/[0.06]"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="currentColor"
                strokeWidth="5"
                strokeDasharray={276.4}
                strokeDashoffset={276.4 - (276.4 * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
                className="text-purple-500 transition-all duration-300"
              />
            </svg>

            {/* Time numbers */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black font-mono tracking-tight text-white">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-[11px] font-semibold text-purple-300 mt-1 uppercase tracking-wider">
                {isRunning ? 'Deep Focus' : 'Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Ambient Sound Controller */}
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6 relative z-10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              Ambient Audio
            </span>
            <span className="text-[11px] text-slate-400 capitalize">{selectedSound}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {(['rain', 'whitenoise', 'brownnoise', 'waves', 'none'] as const).map((snd) => (
              <button
                key={snd}
                onClick={() => handleSoundChange(snd)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-medium capitalize transition-all cursor-pointer ${
                  selectedSound === snd
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                {snd === 'whitenoise' ? 'White' : snd === 'brownnoise' ? 'Brown' : snd}
              </button>
            ))}
          </div>

          {selectedSound !== 'none' && (
            <div className="flex items-center gap-2 pt-1">
              <VolumeX className="w-3 h-3 text-slate-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <Volume2 className="w-3 h-3 text-slate-400" />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] text-slate-300 transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleFinishSession(false)}
            className="px-4 py-3.5 rounded-2xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>Finish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
