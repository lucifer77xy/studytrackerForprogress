/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { HeaderBanner } from './components/HeaderBanner';
import { MetricCards } from './components/MetricCards';
import { LevelProgressBar } from './components/LevelProgressBar';
import { ChartsRow } from './components/ChartsRow';
import { QuickAccessRow } from './components/QuickAccessRow';
import { FocusTimerModal } from './components/FocusTimerModal';
import { CollaborativeRoomView } from './components/CollaborativeRoomView';
import { CollabDocsView } from './components/CollabDocsView';
import { FriendsView } from './components/FriendsView';
import { ProductivityDashboard } from './components/ProductivityDashboard';
import { GoalsView } from './components/GoalsView';
import { FlashcardsView } from './components/FlashcardsView';
import { QuickSearchModal } from './components/QuickSearchModal';
import { LoginScreen } from './components/LoginScreen';
import { Sparkles, Bell } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, profile, loading } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSubject, setTimerSubject] = useState('General Study');
  const [initialRoomCode, setInitialRoomCode] = useState<string | null>(null);
  const [initialFriendCode, setInitialFriendCode] = useState<string | null>(null);

  // Check URL parameters on mount (?room=XYZ or ?join_friend=ABC)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const friendParam = params.get('join_friend');

    if (roomParam) {
      setInitialRoomCode(roomParam);
      setCurrentTab('study-rooms');
    } else if (friendParam) {
      setInitialFriendCode(friendParam);
      setCurrentTab('friends');
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
    setTimerMinutes(presetMinutes);
    setTimerSubject(subject);
    setIsFocusModalOpen(true);
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
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
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
            <button
              onClick={() => setCurrentTab('study-rooms')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Study Rooms</span>
            </button>

            <button
              onClick={() => setCurrentTab('friends')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors cursor-pointer"
            >
              <span>Code: {profile?.friendCode}</span>
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
                  } else {
                    setCurrentTab(tab);
                  }
                }}
              />
            </>
          )}

          {currentTab === 'study-rooms' && (
            <CollaborativeRoomView initialRoomCode={initialRoomCode} />
          )}

          {currentTab === 'collab-notes' && <CollabDocsView />}

          {currentTab === 'friends' && (
            <FriendsView
              initialFriendCode={initialFriendCode}
              onJoinStudyWithFriend={(friendName) => {
                setCurrentTab('study-rooms');
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
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Focus Timer Modal */}
      <FocusTimerModal
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        initialMinutes={timerMinutes}
        initialSubject={timerSubject}
      />

      {/* Quick Search Palette */}
      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab)}
        onStartFocus={() => handleStartSession(25, 'Quick Focus')}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
