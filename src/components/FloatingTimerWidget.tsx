import React from 'react';
import { useTimer } from '../context/TimerContext';
import { Play, Pause, Maximize2, RotateCcw, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';

export const FloatingTimerWidget: React.FC = () => {
  const {
    isRunning,
    secondsRemaining,
    totalSeconds,
    subject,
    isModalOpen,
    pauseTimer,
    resumeTimer,
    openModal,
    finishTimer
  } = useTimer();

  // If modal is already open or timer is inactive and at initial state, do not clutter
  if (isModalOpen || (!isRunning && secondsRemaining === totalSeconds)) {
    return null;
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-5 duration-300 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0f0e1c]/95 border border-purple-500/40 shadow-2xl shadow-purple-950/80 backdrop-blur-xl group hover:border-purple-400 transition-all">
        {/* Pulsing indicator */}
        <div className="relative flex items-center justify-center">
          <span
            className={`w-3 h-3 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
        </div>

        {/* Info */}
        <div
          onClick={openModal}
          className="cursor-pointer min-w-[110px]"
          title="Click to expand focus timer"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black font-mono tracking-tight text-white">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          <p className="text-[10px] text-purple-300 font-medium truncate max-w-[120px]">
            {subject || 'Focus Session'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-white/[0.08]">
          <button
            onClick={() => (isRunning ? pauseTimer() : resumeTimer())}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
            }`}
            title={isRunning ? 'Pause Timer' : 'Resume Timer'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>

          <button
            onClick={() => finishTimer(false)}
            className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 transition-all cursor-pointer"
            title="Complete & Log Session"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={openModal}
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 transition-all cursor-pointer"
            title="Expand Full Timer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
