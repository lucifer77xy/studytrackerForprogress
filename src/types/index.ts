export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  friendCode: string;
  level: number;
  xp: number;
  streak: number;
  bestStreak: number;
  totalMinutes: number;
  totalSessions: number;
  status: 'idle' | 'studying' | 'break';
  currentSubject?: string;
  friends: string[]; // List of friend user IDs
  updatedAt: string;
  createdAt: string;
}

export interface StudyRoom {
  id: string;
  code: string;
  title: string;
  subject: string;
  hostId: string;
  hostName: string;
  isTimerRunning: boolean;
  timerSecondsRemaining: number;
  timerMode: 'pomodoro' | 'short_break' | 'long_break';
  collaborativeNotes: string;
  activeMemberIds: string[];
  activeMemberNames: string[];
  updatedAt: string;
  createdAt: string;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  durationMinutes: number;
  xpEarned: number;
  notes?: string;
  completedAt: string;
  createdAt: string;
}

export interface StudyGoal {
  id: string;
  userId: string;
  title: string;
  targetMinutes: number;
  currentMinutes: number;
  completed: boolean;
  deadline?: string;
  createdAt: string;
}

export interface CollaborativeDoc {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  ownerName: string;
  subject: string;
  collaborators: string[];
  lastEditorName?: string;
  updatedAt: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  unit: string;
  xpReward: number;
  unlocked: boolean;
  claimed: boolean;
}
