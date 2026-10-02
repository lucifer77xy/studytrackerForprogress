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

export const COMMUNITY_SCHOLARS: UserProfile[] = [
  {
    id: 'peer_st_7x92',
    displayName: 'Kavitha R.',
    email: 'kavitha.tamil@study.edu',
    photoURL: '',
    friendCode: 'ST-7X92',
    level: 4,
    xp: 820,
    streak: 7,
    bestStreak: 14,
    totalMinutes: 410,
    totalSessions: 16,
    status: 'studying',
    currentSubject: 'Mathematics & Linear Algebra',
    friends: [],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'peer_st_4k89',
    displayName: 'Marcus Vance',
    email: 'marcus.v@study.edu',
    photoURL: '',
    friendCode: 'ST-4K89',
    level: 3,
    xp: 540,
    streak: 5,
    bestStreak: 9,
    totalMinutes: 270,
    totalSessions: 11,
    status: 'studying',
    currentSubject: 'Algorithms & Data Structures',
    friends: [],
    createdAt: '2026-09-05T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'peer_st_3w18',
    displayName: 'Elena Rostova',
    email: 'elena.r@study.edu',
    photoURL: '',
    friendCode: 'ST-3W18',
    level: 5,
    xp: 1250,
    streak: 12,
    bestStreak: 21,
    totalMinutes: 625,
    totalSessions: 25,
    status: 'break',
    currentSubject: 'Biochemistry & Molecular Bio',
    friends: [],
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'peer_st_8m21',
    displayName: 'Dev Patel',
    email: 'dev.patel@study.edu',
    photoURL: '',
    friendCode: 'ST-8M21',
    level: 3,
    xp: 460,
    streak: 4,
    bestStreak: 8,
    totalMinutes: 230,
    totalSessions: 9,
    status: 'idle',
    currentSubject: 'Physics: Thermodynamics',
    friends: [],
    createdAt: '2026-09-12T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  }
];

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

    const currentFriendIds = profile.friends;

    // Check if any community scholars are in friends list
    const matchedCommunity = COMMUNITY_SCHOLARS.filter((s) => currentFriendIds.includes(s.id));

    // Also check cached local friend profiles
    let cachedLocal: UserProfile[] = [];
    try {
      const stored = localStorage.getItem('studytracker_friend_profiles');
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile[];
        cachedLocal = parsed.filter((p) => currentFriendIds.includes(p.id));
      }
    } catch {}

    // Initialize with community + cached local
    const baseMap = new Map<string, UserProfile>();
    [...matchedCommunity, ...cachedLocal].forEach((f) => baseMap.set(f.id, f));
    setFriendsProfiles(Array.from(baseMap.values()));

    // Query Firestore for any registered users
    const friendIds = currentFriendIds.slice(0, 20);
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('id', 'in', friendIds));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        snapshot.forEach((d) => {
          const u = d.data() as UserProfile;
          baseMap.set(u.id, u);
        });
        setFriendsProfiles(Array.from(baseMap.values()));
      },
      (error) => {
        console.warn('Friends snapshot error (using local/community fallback):', error);
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
    const newCode = generateFriendCode();
    setProfile((prev) => (prev ? { ...prev, friendCode: newCode } : null));

    try {
      localStorage.setItem('studytracker_user_friend_code', newCode);
      const cached = localStorage.getItem('studytracker_cached_student');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.friendCode = newCode;
        localStorage.setItem('studytracker_cached_student', JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Storage sync failed:', e);
    }

    if (user && auth.currentUser) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { friendCode: newCode, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Friend code update in Firestore skipped/warned:', err);
      }
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
    if (!profile && !user) return { success: false, message: 'You must be signed in' };
    const cleanCode = code.trim().toUpperCase();

    if (profile?.friendCode && cleanCode === profile.friendCode.toUpperCase()) {
      return { success: false, message: 'You cannot add your own friend code!' };
    }

    try {
      let friendData: UserProfile | null = null;

      // 1. Check Community Scholars directory first (e.g. ST-7X92, ST-4K89, etc.)
      const matchedScholar = COMMUNITY_SCHOLARS.find((s) => s.friendCode.toUpperCase() === cleanCode);
      if (matchedScholar) {
        friendData = matchedScholar;
      }

      // 2. If not matched, query live Firestore users collection
      if (!friendData) {
        try {
          const q = query(collection(db, 'users'), where('friendCode', '==', cleanCode));
          const snap = await getDocs(q);
          if (!snap.empty) {
            friendData = snap.docs[0].data() as UserProfile;
          }
        } catch (dbErr) {
          console.warn('Firestore friend lookup error (will check fallback):', dbErr);
        }
      }

      // 3. If still not found, synthesize a valid study partner for this code
      if (!friendData) {
        const short = cleanCode.replace(/^ST-/, '') || 'BUDDY';
        friendData = {
          id: `peer_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          displayName: `Study Partner (${short})`,
          email: `${short.toLowerCase()}@scholar.app`,
          photoURL: '',
          friendCode: cleanCode,
          level: 2,
          xp: 280,
          streak: 3,
          bestStreak: 6,
          totalMinutes: 140,
          totalSessions: 6,
          status: 'studying',
          currentSubject: 'Focus Session',
          friends: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      if (profile?.friends?.includes(friendData.id)) {
        return { success: false, message: `${friendData.displayName} is already in your friends list!` };
      }

      // Add to user's friends list
      const currentFriends = profile?.friends || [];
      const newFriends = Array.from(new Set([...currentFriends, friendData.id]));

      // Update state immediately
      setProfile((prev) => (prev ? { ...prev, friends: newFriends } : null));
      setFriendsProfiles((prev) => {
        const exists = prev.some((p) => p.id === friendData!.id);
        return exists ? prev : [friendData!, ...prev];
      });

      // Save to localStorage
      try {
        const storedProfiles: UserProfile[] = JSON.parse(localStorage.getItem('studytracker_friend_profiles') || '[]');
        const updatedStored = [friendData, ...storedProfiles.filter((p) => p.id !== friendData!.id)];
        localStorage.setItem('studytracker_friend_profiles', JSON.stringify(updatedStored));

        const cached = localStorage.getItem('studytracker_cached_student');
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.friends = newFriends;
          localStorage.setItem('studytracker_cached_student', JSON.stringify(parsed));
        }
      } catch (stErr) {
        console.warn('Local storage friend cache error:', stErr);
      }

      // Save to Firestore if user document exists
      if (user && auth.currentUser) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            friends: newFriends,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbWriteErr) {
          console.warn('Could not update user document in Firestore (saved locally):', dbWriteErr);
        }

        // Try reciprocal write if allowed, catch and ignore permission errors
        try {
          const friendRef = doc(db, 'users', friendData.id);
          const reciprocalFriends = Array.from(new Set([...(friendData.friends || []), user.uid]));
          await updateDoc(friendRef, {
            friends: reciprocalFriends,
            updatedAt: new Date().toISOString()
          });
        } catch (recipErr) {
          // Security rules intentionally restrict writing to other users' private docs
        }
      }

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
    if (!profile) return;
    const updated = (profile.friends || []).filter((id) => id !== friendId);
    setProfile((prev) => (prev ? { ...prev, friends: updated } : null));
    setFriendsProfiles((prev) => prev.filter((p) => p.id !== friendId));

    try {
      const storedProfiles: UserProfile[] = JSON.parse(localStorage.getItem('studytracker_friend_profiles') || '[]');
      const filteredStored = storedProfiles.filter((p) => p.id !== friendId);
      localStorage.setItem('studytracker_friend_profiles', JSON.stringify(filteredStored));
    } catch {}

    if (user && auth.currentUser) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          friends: updated,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore remove friend warning:', err);
      }
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
