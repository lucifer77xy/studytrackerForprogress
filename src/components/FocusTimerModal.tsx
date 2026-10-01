import React from 'react';
import { useTimer } from '../context/TimerContext';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  Minimize2
} from 'lucide-react';

export const FocusTimerModal: React.FC = () => {
  const {
    isRunning,
    totalSeconds,
    secondsRemaining,
    subject,
    notes,
    isModalOpen,
    activeSound,
    soundVolume,
    setSubject,
    setNotes,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    finishTimer,
    closeModal,
    setAmbientSound,
    setVolume
  } = useTimer();

  if (!isModalOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  const handlePresetSelect = (mins: number) => {
    startTimer(mins, subject);
  };

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
              <p className="text-[11px] text-emerald-400 font-medium">Runs in background & syncs live to cloud</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Minimize button */}
            <button
              onClick={closeModal}
              title="Minimize to background (timer continues running)"
              className="p-2 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer flex items-center gap-1 text-xs"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Minimize</span>
            </button>

            <button
              onClick={closeModal}
              className="p-2 rounded-xl bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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
        <div className="my-6 flex flex-col items-center justify-center relative z-10">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* SVG circle */}
            <svg className="w-44 h-44 -rotate-90" viewBox="0 0 100 100">
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
                {isRunning ? 'Deep Focus (Running)' : 'Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Ambient Sound Controller */}
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-5 relative z-10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              Ambient Audio Soundscape
            </span>
            <span className="text-[11px] text-slate-400 capitalize">{activeSound}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {(['rain', 'whitenoise', 'brownnoise', 'waves', 'none'] as const).map((snd) => (
              <button
                key={snd}
                onClick={() => setAmbientSound(snd)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-medium capitalize transition-all cursor-pointer ${
                  activeSound === snd
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                {snd === 'whitenoise' ? 'White' : snd === 'brownnoise' ? 'Brown' : snd}
              </button>
            ))}
          </div>

          {activeSound !== 'none' && (
            <div className="flex items-center gap-2 pt-1">
              <VolumeX className="w-3 h-3 text-slate-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <Volume2 className="w-3 h-3 text-slate-400" />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => (isRunning ? pauseTimer() : resumeTimer())}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{secondsRemaining < totalSeconds ? 'Resume' : 'Start Focus'}</span>
              </>
            )}
          </button>

          <button
            onClick={resetTimer}
            className="p-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] text-slate-300 transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => finishTimer(false)}
            className="px-4 py-3.5 rounded-2xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>Finish Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
