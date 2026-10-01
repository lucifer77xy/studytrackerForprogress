/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TimerProvider, useTimer } from './context/TimerContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { HeaderBanner } from './components/HeaderBanner';
import { MetricCards } from './components/MetricCards';
import { LevelProgressBar } from './components/LevelProgressBar';
import { ChartsRow } from './components/ChartsRow';
import { QuickAccessRow } from './components/QuickAccessRow';
import { FocusTimerModal } from './components/FocusTimerModal';
import { FloatingTimerWidget } from './components/FloatingTimerWidget';
import { CollaborativeRoomView } from './components/CollaborativeRoomView';
import { CollabDocsView } from './components/CollabDocsView';
import { FriendsView } from './components/FriendsView';
import { PartnerLiveView } from './components/PartnerLiveView';
import { GeminiTutorModal } from './components/GeminiTutorModal';
import { ProductivityDashboard } from './components/ProductivityDashboard';
import { GoalsView } from './components/GoalsView';
import { FlashcardsView } from './components/FlashcardsView';
import { QuickSearchModal } from './components/QuickSearchModal';
import { UserProfileModal } from './components/UserProfileModal';
import { LoginScreen } from './components/LoginScreen';
import { Sparkles, Bot, User } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { startTimer, openModal } = useTimer();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [initialRoomCode, setInitialRoomCode] = useState<string | null>(null);
  const [initialFriendCode, setInitialFriendCode] = useState<string | null>(null);
  const [initialPartnerCode, setInitialPartnerCode] = useState<string | null>(null);

  // Check URL parameters on mount (?room=XYZ, ?join_friend=ABC, ?partner=DEF)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const friendParam = params.get('join_friend');
    const partnerParam = params.get('partner');

    if (roomParam) {
      setInitialRoomCode(roomParam);
      setCurrentTab('study-rooms');
    } else if (friendParam) {
      setInitialFriendCode(friendParam);
      setCurrentTab('friends');
    } else if (partnerParam) {
      setInitialPartnerCode(partnerParam);
      setCurrentTab('partner');
    }
  }, []);

  // Listen to Global keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartSession = (presetMinutes = 25, subject = 'General Study') => {
    startTimer(presetMinutes, subject);
    openModal();
  };

  // If loading authentication state, show sleek loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070c] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-purple-500/20 ring-1 ring-purple-400/30 animate-bounce">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs text-slate-400 font-mono tracking-wider animate-pulse">
          Connecting to Cloud Study Portal...
        </p>
      </div>
    );
  }

  // Strictly enforce Google Login requirement
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#07070c] text-slate-100 flex relative overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background ambient lighting */}
      <div className="fixed top-[-10%] left-[25%] w-[800px] h-[800px] bg-purple-600/[0.04] rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[15%] w-[600px] h-[600px] bg-blue-600/[0.03] rounded-full blur-[150px] pointer-events-none" />

      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'focus-timer') {
            handleStartSession(25, 'Focus Session');
          } else if (tab === 'ai-tutor') {
            setIsGeminiModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 relative z-10">
        {/* Subtle top sticky bar */}
        <div className="px-6 md:px-10 py-3.5 border-b border-white/[0.05] bg-[#07070c]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">StudyTracker</span>
            <span>/</span>
            <span className="text-purple-400 capitalize">
              {currentTab.replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Gemini Tutor trigger button in header */}
            <button
              onClick={() => setIsGeminiModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/25 transition-colors cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <span>Ask Gemini Tutor</span>
            </button>

            <button
              onClick={() => setCurrentTab('partner')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Partner Duo</span>
            </button>

            <button
              onClick={() => setCurrentTab('study-rooms')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Rooms</span>
            </button>

            <button
              onClick={() => setCurrentTab('friends')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-300 text-xs font-semibold hover:bg-white/[0.1] transition-colors cursor-pointer"
            >
              <span>Code: {profile?.friendCode || 'ST-????'}</span>
            </button>

            {/* User Profile Avatar Trigger */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              title="Click to view & edit scholar profile"
              className="flex items-center gap-2 p-1 pl-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
            >
              <span className="text-xs font-semibold text-white hidden lg:inline max-w-[100px] truncate">
                {profile?.displayName || user?.displayName || 'Scholar'}
              </span>
              {profile?.photoURL || user?.photoURL ? (
                <img
                  src={profile?.photoURL || user?.photoURL || ''}
                  alt={profile?.displayName || 'User'}
                  className="w-6 h-6 rounded-full border border-purple-500/40 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {(profile?.displayName || user?.displayName || 'S').charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* View Switcher Container */}
        <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <>
              {/* Header Hero Banner */}
              <HeaderBanner
                onStartStudying={() => handleStartSession(25, 'Study Session')}
                onOpenSchedule={() => setCurrentTab('goals')}
              />

              {/* 4 Colored Metric Cards Row */}
              <MetricCards
                onOpenSessions={() => setCurrentTab('leaderboard')}
                onOpenGoals={() => setCurrentTab('goals')}
              />

              {/* Level Progress Bar Card */}
              <LevelProgressBar />

              {/* Middle Row: This Week + 14-Day Trend + Current Streak */}
              <ChartsRow
                onOpenDetails={() => setCurrentTab('leaderboard')}
                onOpenStats={() => setCurrentTab('leaderboard')}
              />

              {/* Lower Row: Study Templates + Quick Access */}
              <QuickAccessRow
                onStartSession={handleStartSession}
                onNavigateTab={(tab) => {
                  if (tab === 'focus-timer') {
                    handleStartSession(25, 'Focus Session');
                  } else if (tab === 'ai-tutor') {
                    setIsGeminiModalOpen(true);
                  } else {
                    setCurrentTab(tab);
                  }
                }}
              />
            </>
          )}

          {currentTab === 'partner' && (
            <PartnerLiveView initialPartnerCode={initialPartnerCode} />
          )}

          {currentTab === 'study-rooms' && (
            <CollaborativeRoomView initialRoomCode={initialRoomCode} />
          )}

          {currentTab === 'collab-notes' && <CollabDocsView />}

          {currentTab === 'friends' && (
            <FriendsView
              initialFriendCode={initialFriendCode}
              onJoinStudyWithFriend={() => {
                setCurrentTab('partner');
              }}
            />
          )}

          {currentTab === 'leaderboard' && <ProductivityDashboard />}

          {currentTab === 'goals' && <GoalsView />}

          {currentTab === 'flashcards' && <FlashcardsView />}

          {currentTab === 'templates' && (
            <div className="space-y-6">
              <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#170e2f] via-[#101026] to-[#0d1428] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-purple-950/30">
                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">Classes & Study Modules</h2>
                  <p className="text-slate-400 text-sm max-w-xl">
                    Select a preset study template or class module to launch an optimized focus session with pre-configured intervals.
                  </p>
                </div>
              </div>
              <QuickAccessRow
                onStartSession={handleStartSession}
                onNavigateTab={(tab) => {
                  if (tab === 'ai-tutor') {
                    setIsGeminiModalOpen(true);
                  } else {
                    setCurrentTab(tab);
                  }
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Focus Timer Modal */}
      <FocusTimerModal />

      {/* Floating Timer Mini Widget (persists across all pages when timer runs in background) */}
      <FloatingTimerWidget />

      {/* Gemini AI Study Tutor Modal */}
      <GeminiTutorModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        onSaveToNotes={(content) => {
          setCurrentTab('collab-notes');
          setIsGeminiModalOpen(false);
        }}
      />

      {/* User Profile & Account Settings Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Quick Search Palette */}
      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        onNavigate={(tab) => {
          if (tab === 'ai-tutor') {
            setIsGeminiModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        onStartFocus={() => handleStartSession(25, 'Quick Focus')}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TimerProvider>
        <MainApp />
      </TimerProvider>
    </AuthProvider>
  );
}
