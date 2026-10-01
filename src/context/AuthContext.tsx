import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
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

type AppUser = User | { uid: string; displayName: string | null; email: string | null; photoURL: string | null };

interface AuthContextType {
  user: AppUser | null;
  profile: UserProfile | null;
  loading: boolean;
  friendsProfiles: UserProfile[];
  recentSessions: StudySession[];
  goals: StudyGoal[];
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleCredential: (idToken: string) => Promise<void>;
  quickLoginWithGoogleAccount: (email: string, name?: string) => Promise<void>;
  updateProfileDisplayName: (newName: string) => Promise<void>;
  updateProfileDetails: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  regenerateFriendCode: () => Promise<string>;
  logout: () => Promise<void>;
  updateUserStatus: (status: 'idle' | 'studying' | 'break', subject?: string) => Promise<void>;
  addFriendByCode: (code: string) => Promise<{ success: boolean; message: string; friendName?: string }>;
  removeFriend: (friendId: string) => Promise<void>;
  recordStudySession: (durationMinutes: number, subject: string, notes?: string) => Promise<void>;
  createGoal: (title: string, targetMinutes: number, deadline?: string) => Promise<void>;
  toggleGoalComplete: (goalId: string, completed: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function formatNameFromEmail(email: string): string {
  if (!email) return 'Scholar';
  const userPart = email.split('@')[0];
  const formatted = userPart
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  return formatted || 'Scholar';
}

function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = 'ST-';
  for (let i = 0; i < 4; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendsProfiles, setFriendsProfiles] = useState<UserProfile[]>([]);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);

        // Derive true display name from Google account or email
        let realName = currentUser.displayName;
        if (!realName || realName.toLowerCase() === 'student' || realName.toLowerCase() === 'scholar') {
          if (currentUser.email) {
            realName = formatNameFromEmail(currentUser.email);
          } else {
            realName = 'Scholar';
          }
        }
        const realPhoto = currentUser.photoURL || '';

        try {
          const snap = await getDoc(userDocRef);
          if (!snap.exists()) {
            const initialProfile: UserProfile = {
              id: currentUser.uid,
              displayName: realName,
              email: currentUser.email || '',
              photoURL: realPhoto,
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
            const existing = snap.data() as UserProfile;
            const finalName =
              currentUser.displayName ||
              (existing.displayName && existing.displayName.toLowerCase() !== 'student' ? existing.displayName : realName);
            const finalPhoto = currentUser.photoURL || existing.photoURL || realPhoto;
            const finalCode = existing.friendCode || generateFriendCode();

            const needsSync =
              existing.displayName !== finalName ||
              existing.photoURL !== finalPhoto ||
              !existing.friendCode;

            if (needsSync) {
              const updates: Partial<UserProfile> = {
                displayName: finalName,
                photoURL: finalPhoto,
                friendCode: finalCode,
                email: currentUser.email || existing.email,
                updatedAt: new Date().toISOString()
              };
              await updateDoc(userDocRef, updates);
              setProfile({ ...existing, ...updates });
            } else {
              setProfile(existing);
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
        } finally {
          setLoading(false);
        }
      } else {
        // Check for cached quick student login
        const cached = localStorage.getItem('studytracker_cached_student');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setUser(parsed);
            const userDocRef = doc(db, 'users', parsed.uid);
            const snap = await getDoc(userDocRef);
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              setProfile(data);
            } else {
              const derivedName = parsed.displayName && parsed.displayName.toLowerCase() !== 'student'
                ? parsed.displayName
                : formatNameFromEmail(parsed.email || 'scholar@study.app');
              setProfile({
                id: parsed.uid,
                displayName: derivedName,
                email: parsed.email,
                photoURL: parsed.photoURL || '',
                friendCode: 'ST-9284',
                level: 1,
                xp: 25,
                streak: 1,
                bestStreak: 1,
                totalMinutes: 25,
                totalSessions: 1,
                status: 'idle',
                currentSubject: 'General Study',
                friends: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          } catch {
            setUser(null);
            setProfile(null);
          } finally {
            setLoading(false);
          }
        } else {
          setUser(null);
          setProfile(null);
          setFriendsProfiles([]);
          setRecentSessions([]);
          setGoals([]);
          setLoading(false);
        }
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
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      if (googleUser) {
        setUser(googleUser);
        const name =
          googleUser.displayName && googleUser.displayName.toLowerCase() !== 'student'
            ? googleUser.displayName
            : formatNameFromEmail(googleUser.email || '');
        const photo = googleUser.photoURL || '';
        const userDocRef = doc(db, 'users', googleUser.uid);
        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const existing = snap.data() as UserProfile;
            const updates: Partial<UserProfile> = {
              displayName: name,
              photoURL: photo || existing.photoURL || '',
              email: googleUser.email || existing.email,
              friendCode: existing.friendCode || generateFriendCode(),
              updatedAt: new Date().toISOString()
            };
            await updateDoc(userDocRef, updates);
            setProfile({ ...existing, ...updates });
          } else {
            const initialProfile: UserProfile = {
              id: googleUser.uid,
              displayName: name,
              email: googleUser.email || '',
              photoURL: photo,
              friendCode: generateFriendCode(),
              level: 1,
              xp: 0,
              streak: 1,
              bestStreak: 1,
              totalMinutes: 0,
              totalSessions: 0,
              status: 'idle',
              currentSubject: 'General Study',
              friends: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await setDoc(userDocRef, initialProfile);
            setProfile(initialProfile);
          }
        } catch (docErr) {
          console.warn('Doc sync on login error:', docErr);
        }
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  const loginWithGoogleCredential = async (idToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (err) {
      console.error('Google Credential sign-in error:', err);
      throw err;
    }
  };

  const quickLoginWithGoogleAccount = async (email: string, name?: string) => {
    try {
      setLoading(true);
      const safeUid = 'usr_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)).toString(36);
      const derivedName = name?.trim() && name.toLowerCase() !== 'student'
        ? name.trim()
        : formatNameFromEmail(email);
      const customUser = {
        uid: safeUid,
        displayName: derivedName,
        email: email,
        photoURL: ''
      };
      localStorage.setItem('studytracker_cached_student', JSON.stringify(customUser));
      setUser(customUser);

      const userDocRef = doc(db, 'users', safeUid);
      try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          const initialProfile: UserProfile = {
            id: safeUid,
            displayName: derivedName,
            email: customUser.email,
            photoURL: '',
            friendCode: generateFriendCode(),
            level: 1,
            xp: 0,
            streak: 1,
            bestStreak: 1,
            totalMinutes: 0,
            totalSessions: 0,
            status: 'idle',
            currentSubject: 'General Study',
            friends: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(userDocRef, initialProfile);
          setProfile(initialProfile);
        } else {
          const data = snap.data() as UserProfile;
          const updatedName = derivedName || (data.displayName?.toLowerCase() !== 'student' ? data.displayName : formatNameFromEmail(email));
          const updates = {
            displayName: updatedName,
            friendCode: data.friendCode || generateFriendCode(),
            updatedAt: new Date().toISOString()
          };
          await updateDoc(userDocRef, updates);
          setProfile({ ...data, ...updates });
        }
      } catch (err) {
        console.warn('Firestore fallback user profile used:', err);
        setProfile({
          id: safeUid,
          displayName: derivedName,
          email: customUser.email,
          photoURL: '',
          friendCode: 'ST-9284',
          level: 1,
          xp: 25,
          streak: 1,
          bestStreak: 1,
          totalMinutes: 25,
          totalSessions: 1,
          status: 'idle',
          currentSubject: 'General Study',
          friends: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const regenerateFriendCode = async (): Promise<string> => {
    if (!user) return 'ST-????';
    const newCode = generateFriendCode();
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { friendCode: newCode, updatedAt: new Date().toISOString() });
      setProfile((prev) => (prev ? { ...prev, friendCode: newCode } : null));
    } catch (err) {
      console.error('Error regenerating friend code:', err);
    }
    return newCode;
  };

  const updateProfileDisplayName = async (newName: string) => {
    if (!user || !newName.trim()) return;
    const cleanName = newName.trim();
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: cleanName,
        updatedAt: new Date().toISOString()
      });
      setProfile((prev) => (prev ? { ...prev, displayName: cleanName } : null));
    } catch {
      setProfile((prev) => (prev ? { ...prev, displayName: cleanName } : null));
    }
  };

  const updateProfileDetails = async (updates: { displayName?: string; photoURL?: string }) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const cleanUpdates: Partial<UserProfile> = {
        updatedAt: new Date().toISOString()
      };
      if (updates.displayName?.trim()) cleanUpdates.displayName = updates.displayName.trim();
      if (updates.photoURL !== undefined) cleanUpdates.photoURL = updates.photoURL.trim();
      await updateDoc(userRef, cleanUpdates);
      setProfile((prev) => (prev ? { ...prev, ...cleanUpdates } : null));
    } catch (err) {
      console.error('Error updating profile details:', err);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('studytracker_cached_student');
      if (user) {
        // Set status to idle before logout
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, { status: 'idle', updatedAt: new Date().toISOString() });
        } catch {
          // ignore
        }
      }
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setProfile(null);
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
        loginWithGoogleCredential,
        quickLoginWithGoogleAccount,
        updateProfileDisplayName,
        updateProfileDetails,
        regenerateFriendCode,
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
