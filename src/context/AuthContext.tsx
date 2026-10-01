import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, StudySession, StudyGoal } from '../types';
import confetti from 'canvas-confetti';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  friendsProfiles: UserProfile[];
  recentSessions: StudySession[];
  goals: StudyGoal[];
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserStatus: (status: 'idle' | 'studying' | 'break', subject?: string) => Promise<void>;
  addFriendByCode: (code: string) => Promise<{ success: boolean; message: string; friendName?: string }>;
  removeFriend: (friendId: string) => Promise<void>;
  recordStudySession: (durationMinutes: number, subject: string, notes?: string) => Promise<void>;
  createGoal: (title: string, targetMinutes: number, deadline?: string) => Promise<void>;
  toggleGoalComplete: (goalId: string, completed: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = 'ST-';
  for (let i = 0; i < 4; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendsProfiles, setFriendsProfiles] = useState<UserProfile[]>([]);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setFriendsProfiles([]);
        setRecentSessions([]);
        setGoals([]);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          const initialProfile: UserProfile = {
            id: currentUser.uid,
            displayName: currentUser.displayName || 'Scholar',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || '',
            friendCode: generateFriendCode(),
            level: 1,
            xp: 0,
            streak: 0,
            bestStreak: 0,
            totalMinutes: 0,
            totalSessions: 0,
            status: 'idle',
            currentSubject: 'General Study',
            friends: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, initialProfile);
          setProfile(initialProfile);
        } else {
          setProfile(snap.data() as UserProfile);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time listener for current user profile
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    );
    return () => unsub();
  }, [user]);

  // 3. Real-time listener for friends' profiles
  useEffect(() => {
    if (!user || !profile || !profile.friends || profile.friends.length === 0) {
      setFriendsProfiles([]);
      return;
    }

    // Limit to up to 20 friends for query constraints
    const friendIds = profile.friends.slice(0, 20);
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('id', 'in', friendIds));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const friends: UserProfile[] = [];
        snapshot.forEach((d) => friends.push(d.data() as UserProfile));
        setFriendsProfiles(friends);
      },
      (error) => {
        console.warn('Friends snapshot error (might need index or empty):', error);
      }
    );

    return () => unsub();
  }, [user, profile?.friends]);

  // 4. Real-time listener for recent user sessions
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'sessions'), where('userId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: StudySession[] = [];
        snapshot.forEach((d) => list.push(d.data() as StudySession));
        // Sort descending by completion
        list.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        setRecentSessions(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'sessions');
      }
    );
    return () => unsub();
  }, [user]);

  // 5. Real-time listener for user goals
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: StudyGoal[] = [];
        snapshot.forEach((d) => list.push(d.data() as StudyGoal));
        setGoals(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'goals');
      }
    );
    return () => unsub();
  }, [user]);

  // Actions
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (user) {
        // Set status to idle before logout
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { status: 'idle', updatedAt: new Date().toISOString() });
      }
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const updateUserStatus = async (status: 'idle' | 'studying' | 'break', subject?: string) => {
    if (!user || !profile) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const updateData: Partial<UserProfile> = {
        status,
        updatedAt: new Date().toISOString()
      };
      if (subject !== undefined) {
        updateData.currentSubject = subject;
      }
      await updateDoc(userDocRef, updateData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const addFriendByCode = async (code: string): Promise<{ success: boolean; message: string; friendName?: string }> => {
    if (!user || !profile) return { success: false, message: 'You must be signed in' };
    const cleanCode = code.trim().toUpperCase();

    if (cleanCode === profile.friendCode) {
      return { success: false, message: 'You cannot add your own friend code!' };
    }

    try {
      const q = query(collection(db, 'users'), where('friendCode', '==', cleanCode));
      const snap = await getDocs(q);
      if (snap.empty) {
        return { success: false, message: 'No student found with that friend code' };
      }

      const friendDoc = snap.docs[0];
      const friendData = friendDoc.data() as UserProfile;

      if (profile.friends?.includes(friendData.id)) {
        return { success: false, message: `${friendData.displayName} is already in your friends list!` };
      }

      // Add to user's friends list
      const userRef = doc(db, 'users', user.uid);
      const newFriends = [...(profile.friends || []), friendData.id];
      await updateDoc(userRef, {
        friends: newFriends,
        updatedAt: new Date().toISOString()
      });

      // Also add reciprocal friendship so both can track each other's live progress
      const friendRef = doc(db, 'users', friendData.id);
      const reciprocalFriends = Array.from(new Set([...(friendData.friends || []), user.uid]));
      await updateDoc(friendRef, {
        friends: reciprocalFriends,
        updatedAt: new Date().toISOString()
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      return {
        success: true,
        message: `Successfully connected with ${friendData.displayName}!`,
        friendName: friendData.displayName
      };
    } catch (err) {
      console.error('Error adding friend:', err);
      return { success: false, message: 'Failed to connect friend. Please try again.' };
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user || !profile) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const updated = (profile.friends || []).filter((id) => id !== friendId);
      await updateDoc(userRef, {
        friends: updated,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const recordStudySession = async (durationMinutes: number, subject: string, notes?: string) => {
    if (!user || !profile) return;
    try {
      const xpGained = durationMinutes * 2 + 25; // 2 XP per minute + 25 session bonus
      const newTotalMinutes = (profile.totalMinutes || 0) + durationMinutes;
      const newTotalSessions = (profile.totalSessions || 0) + 1;
      const newXp = (profile.xp || 0) + xpGained;

      // Calculate level: Level 1 (0-100), Level 2 (100-250), Level 3 (250-450), etc.
      const newLevel = Math.max(1, Math.floor(Math.sqrt(newXp / 50)) + 1);

      // Streak logic: check if streak should increment
      const newStreak = profile.streak === 0 ? 1 : profile.streak + 1;
      const newBestStreak = Math.max(newStreak, profile.bestStreak || 0);

      // 1. Create session document
      const sessionDocRef = doc(collection(db, 'sessions'));
      const sessionData: StudySession = {
        id: sessionDocRef.id,
        userId: user.uid,
        userName: profile.displayName,
        subject: subject || 'General Study',
        durationMinutes,
        xpEarned: xpGained,
        notes: notes || '',
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      await setDoc(sessionDocRef, sessionData);

      // 2. Update user profile
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        totalMinutes: newTotalMinutes,
        totalSessions: newTotalSessions,
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        bestStreak: newBestStreak,
        status: 'idle',
        updatedAt: new Date().toISOString()
      });

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'sessions');
    }
  };

  const createGoal = async (title: string, targetMinutes: number, deadline?: string) => {
    if (!user) return;
    try {
      const goalRef = doc(collection(db, 'goals'));
      const newGoal: StudyGoal = {
        id: goalRef.id,
        userId: user.uid,
        title,
        targetMinutes,
        currentMinutes: 0,
        completed: false,
        deadline: deadline || '',
        createdAt: new Date().toISOString()
      };
      await setDoc(goalRef, newGoal);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'goals');
    }
  };

  const toggleGoalComplete = async (goalId: string, completed: boolean) => {
    if (!user) return;
    try {
      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, { completed });
      if (completed) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `goals/${goalId}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        friendsProfiles,
        recentSessions,
        goals,
        loginWithGoogle,
        logout,
        updateUserStatus,
        addFriendByCode,
        removeFriend,
        recordStudySession,
        createGoal,
        toggleGoalComplete
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
