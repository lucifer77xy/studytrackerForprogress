import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { ambientAudio } from '../lib/audio';
import confetti from 'canvas-confetti';

interface TimerContextType {
  isRunning: boolean;
  totalSeconds: number;
  secondsRemaining: number;
  subject: string;
  notes: string;
  isModalOpen: boolean;
  activeSound: 'rain' | 'whitenoise' | 'brownnoise' | 'waves' | 'none';
  soundVolume: number;
  setSubject: (sub: string) => void;
  setNotes: (n: string) => void;
  startTimer: (minutes: number, subj?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  finishTimer: (naturalFinish?: boolean) => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  setAmbientSound: (sound: 'rain' | 'whitenoise' | 'brownnoise' | 'waves' | 'none') => void;
  setVolume: (vol: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, updateUserStatus, recordStudySession } = useAuth();

  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [subject, setSubject] = useState('General Study');
  const [notes, setNotes] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSound, setActiveSound] = useState<'rain' | 'whitenoise' | 'brownnoise' | 'waves' | 'none'>('rain');
  const [soundVolume, setSoundVolume] = useState(0.35);

  const targetEndTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Background timer tick loop
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.title = 'StudyTracker - Collaborative Study Portal';
      ambientAudio.stop();
      return;
    }

    // Play ambient sound if active
    if (activeSound !== 'none') {
      ambientAudio.play(activeSound, soundVolume);
    }

    intervalRef.current = window.setInterval(() => {
      if (targetEndTimeRef.current) {
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
        setSecondsRemaining(diffSeconds);

        // Update document title for background tab glance
        const m = Math.floor(diffSeconds / 60);
        const s = diffSeconds % 60;
        document.title = `(${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}) ${subject} | StudyTracker`;

        // If time reached 0
        if (diffSeconds <= 0) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          ambientAudio.stop();
          ambientAudio.playBeep(880, 0.4);
          document.title = '🎉 Focus Completed! | StudyTracker';
          finishTimer(true);
        }
      }
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, activeSound, subject]);

  // Sync background timer state when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && targetEndTimeRef.current) {
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
        setSecondsRemaining(diffSeconds);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning]);

  const startTimer = (minutes: number, subj?: string) => {
    const secs = minutes * 60;
    const finalSubject = subj || subject || 'General Study';
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
    setSubject(finalSubject);
    targetEndTimeRef.current = Date.now() + secs * 1000;
    setIsRunning(true);
    updateUserStatus('studying', finalSubject);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    ambientAudio.stop();
    updateUserStatus('break', subject);
  };

  const resumeTimer = () => {
    if (secondsRemaining > 0) {
      targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;
      setIsRunning(true);
      updateUserStatus('studying', subject);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setSecondsRemaining(totalSeconds);
    ambientAudio.stop();
    updateUserStatus('idle');
  };

  const finishTimer = async (naturalFinish = false) => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    ambientAudio.stop();
    updateUserStatus('idle');

    const elapsedSeconds = totalSeconds - secondsRemaining;
    const minutesToLog = naturalFinish
      ? Math.round(totalSeconds / 60)
      : Math.max(1, Math.round(elapsedSeconds / 60));

    if (minutesToLog > 0) {
      await recordStudySession(minutesToLog, subject, notes);
    }

    confetti({ particleCount: 70, spread: 80, origin: { y: 0.7 } });
    setIsModalOpen(false);
  };

  const setAmbientSound = (sound: 'rain' | 'whitenoise' | 'brownnoise' | 'waves' | 'none') => {
    setActiveSound(sound);
    if (isRunning) {
      if (sound === 'none') {
        ambientAudio.stop();
      } else {
        ambientAudio.play(sound, soundVolume);
      }
    }
  };

  const setVolume = (vol: number) => {
    setSoundVolume(vol);
    ambientAudio.setVolume(vol);
  };

  return (
    <TimerContext.Provider
      value={{
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
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        setAmbientSound,
        setVolume
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
};
