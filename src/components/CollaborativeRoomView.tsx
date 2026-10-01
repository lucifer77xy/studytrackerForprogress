import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { StudyRoom, RoomMessage } from '../types';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  addDoc
} from 'firebase/firestore';
import {
  Radio,
  Plus,
  Copy,
  Check,
  Users,
  Play,
  Pause,
  RotateCcw,
  Send,
  Sparkles,
  Flame,
  Coffee,
  CheckCircle2,
  Share2,
  LogOut,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CollaborativeRoomViewProps {
  initialRoomCode?: string | null;
}

export const CollaborativeRoomView: React.FC<CollaborativeRoomViewProps> = ({
  initialRoomCode
}) => {
  const { user, profile } = useAuth();

  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<StudyRoom | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState(initialRoomCode || '');
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomSubject, setNewRoomSubject] = useState('Mathematics & Science');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  const notesTimeoutRef = useRef<number | null>(null);

  // 1. Listen to all active study rooms
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'study_rooms'),
      (snapshot) => {
        const list: StudyRoom[] = [];
        snapshot.forEach((d) => list.push(d.data() as StudyRoom));
        setRooms(list);

        // Check if there's an initialRoomCode to auto-join
        if (initialRoomCode && !currentRoom) {
          const matched = list.find((r) => r.code.toUpperCase() === initialRoomCode.toUpperCase());
          if (matched) {
            joinRoom(matched);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'study_rooms');
      }
    );
    return () => unsub();
  }, [initialRoomCode]);

  // 2. Listen to active room details & messages when in a room
  useEffect(() => {
    if (!currentRoom) return;

    // Listen to current room doc
    const roomRef = doc(db, 'study_rooms', currentRoom.id);
    const unsubRoom = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as StudyRoom;
        setCurrentRoom(data);
        // Only sync notes if not actively focused/typing
        if (document.activeElement?.id !== 'collab-notes-area') {
          setNotesDraft(data.collaborativeNotes || '');
        }
      } else {
        setCurrentRoom(null);
      }
    });

    // Listen to messages subcollection
    const msgRef = collection(db, 'study_rooms', currentRoom.id, 'messages');
    const q = query(msgRef, orderBy('createdAt', 'asc'));
    const unsubMsgs = onSnapshot(q, (snap) => {
      const msgs: RoomMessage[] = [];
      snap.forEach((d) => msgs.push(d.data() as RoomMessage));
      setMessages(msgs);
    });

    return () => {
      unsubRoom();
      unsubMsgs();
    };
  }, [currentRoom?.id]);

  // 3. Room synchronized timer interval (Host runs the countdown)
  useEffect(() => {
    if (!currentRoom || !currentRoom.isTimerRunning) return;

    const interval = window.setInterval(async () => {
      if (currentRoom.hostId === user?.uid) {
        if (currentRoom.timerSecondsRemaining > 0) {
          const roomRef = doc(db, 'study_rooms', currentRoom.id);
          await updateDoc(roomRef, {
            timerSecondsRemaining: currentRoom.timerSecondsRemaining - 1,
            updatedAt: new Date().toISOString()
          });
        } else {
          // Timer finished
          const roomRef = doc(db, 'study_rooms', currentRoom.id);
          await updateDoc(roomRef, {
            isTimerRunning: false,
            timerSecondsRemaining: 25 * 60,
            updatedAt: new Date().toISOString()
          });
          confetti({ particleCount: 70, spread: 80 });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRoom?.isTimerRunning, currentRoom?.timerSecondsRemaining, currentRoom?.hostId, user?.uid]);

  // Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !newRoomTitle.trim()) return;

    const roomDoc = doc(collection(db, 'study_rooms'));
    const code = 'ROOM-' + Math.floor(1000 + Math.random() * 9000);

    const roomData: StudyRoom = {
      id: roomDoc.id,
      code,
      title: newRoomTitle.trim(),
      subject: newRoomSubject,
      hostId: user.uid,
      hostName: profile.displayName,
      isTimerRunning: false,
      timerSecondsRemaining: 25 * 60,
      timerMode: 'pomodoro',
      collaborativeNotes: `# ${newRoomTitle.trim()} - Collaborative Study Notes\n\n- [ ] Main concepts to master\n- [ ] Formulas and key proofs\n- [ ] Questions for the group\n`,
      activeMemberIds: [user.uid],
      activeMemberNames: [profile.displayName],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(roomDoc, roomData);
    setCurrentRoom(roomData);
    setNotesDraft(roomData.collaborativeNotes);
    setIsCreatingRoom(false);
    setNewRoomTitle('');
  };

  // Join Room
  const joinRoom = async (targetRoom: StudyRoom) => {
    if (!user || !profile) return;
    const roomRef = doc(db, 'study_rooms', targetRoom.id);

    const memberIds = Array.from(new Set([...targetRoom.activeMemberIds, user.uid]));
    const memberNames = Array.from(new Set([...targetRoom.activeMemberNames, profile.displayName]));

    await updateDoc(roomRef, {
      activeMemberIds: memberIds,
      activeMemberNames: memberNames,
      updatedAt: new Date().toISOString()
    });

    setCurrentRoom({
      ...targetRoom,
      activeMemberIds: memberIds,
      activeMemberNames: memberNames
    });
    setNotesDraft(targetRoom.collaborativeNotes || '');
  };

  // Join Room by Code input
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCodeInput.trim().toUpperCase();
    const found = rooms.find((r) => r.code.toUpperCase() === clean);
    if (found) {
      await joinRoom(found);
      setJoinCodeInput('');
    } else {
      alert(`No active room found with code "${clean}". Please double check with your friend!`);
    }
  };

  // Leave Room
  const handleLeaveRoom = async () => {
    if (!currentRoom || !user || !profile) return;
    const roomRef = doc(db, 'study_rooms', currentRoom.id);
    const memberIds = currentRoom.activeMemberIds.filter((id) => id !== user.uid);
    const memberNames = currentRoom.activeMemberNames.filter((name) => name !== profile.displayName);

    if (memberIds.length === 0) {
      await deleteDoc(roomRef);
    } else {
      await updateDoc(roomRef, {
        activeMemberIds: memberIds,
        activeMemberNames: memberNames,
        updatedAt: new Date().toISOString()
      });
    }
    setCurrentRoom(null);
  };

  // Debounced notes update
  const handleNotesChange = (text: string) => {
    setNotesDraft(text);
    if (!currentRoom) return;

    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }

    notesTimeoutRef.current = window.setTimeout(async () => {
      try {
        const roomRef = doc(db, 'study_rooms', currentRoom.id);
        await updateDoc(roomRef, {
          collaborativeNotes: text,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Notes sync error:', err);
      }
    }, 600);
  };

  // Toggle Room Timer
  const handleToggleTimer = async () => {
    if (!currentRoom) return;
    const roomRef = doc(db, 'study_rooms', currentRoom.id);
    await updateDoc(roomRef, {
      isTimerRunning: !currentRoom.isTimerRunning,
      updatedAt: new Date().toISOString()
    });
  };

  const handleResetTimer = async () => {
    if (!currentRoom) return;
    const roomRef = doc(db, 'study_rooms', currentRoom.id);
    await updateDoc(roomRef, {
      isTimerRunning: false,
      timerSecondsRemaining: 25 * 60,
      updatedAt: new Date().toISOString()
    });
  };

  // Send Chat Message
  const handleSendMessage = async (contentToSend?: string) => {
    const text = contentToSend || inputMessage;
    if (!text.trim() || !currentRoom || !user || !profile) return;

    const msgRef = doc(collection(db, 'study_rooms', currentRoom.id, 'messages'));
    const newMsg: RoomMessage = {
      id: msgRef.id,
      roomId: currentRoom.id,
      userId: user.uid,
      userName: profile.displayName,
      content: text.trim(),
      createdAt: new Date().toISOString()
    };

    await setDoc(msgRef, newMsg);
    if (!contentToSend) setInputMessage('');
  };

  const copyCodeToClipboard = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLinkToClipboard = () => {
    if (!currentRoom) return;
    const link = `${window.location.origin}?room=${currentRoom.code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ROOM DETAILS VIEW
  if (currentRoom) {
    return (
      <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif] animate-in fade-in duration-200">
        {/* Room Header Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#170e2f] via-[#101026] to-[#0a1426] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-purple-950/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Live Study Room
              </span>
              <span className="text-xs text-slate-400 font-medium">· Host: {currentRoom.hostName}</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">{currentRoom.title}</h2>
            <p className="text-xs text-purple-300/80 font-medium">{currentRoom.subject}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Room Code Pill */}
            <button
              onClick={copyCodeToClipboard}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-mono text-white transition-all cursor-pointer"
            >
              <span>{currentRoom.code}</span>
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {/* Copy Shareable Link */}
            <button
              onClick={copyLinkToClipboard}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-xs font-semibold text-purple-200 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Link Copied!' : 'Invite Link'}</span>
            </button>

            {/* Leave Room Button */}
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-semibold text-red-300 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          </div>
        </div>

        {/* Synchronized Timer Card */}
        <div className="p-5 rounded-2xl bg-[#0e0c19] border border-purple-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Synchronized Room Pomodoro
              </span>
              <div className="text-3xl font-black font-mono text-white">
                {formatTimer(currentRoom.timerSecondsRemaining)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleTimer}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                currentRoom.isTimerRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
              }`}
            >
              {currentRoom.isTimerRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{currentRoom.isTimerRunning ? 'Pause Squad Timer' : 'Sync Start Timer'}</span>
            </button>

            <button
              onClick={handleResetTimer}
              className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Body: 2 Columns (Collaborative Notes + Live Members/Chat) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Collaborative Notes (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-[#0b0c16] border border-purple-900/30 p-5 flex flex-col h-[520px] shadow-lg shadow-purple-950/20">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Real-Time Collaborative Notes
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Sync
              </span>
            </div>

            <textarea
              id="collab-notes-area"
              value={notesDraft}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Type shared study notes, formulas, questions, or checklists here... Changes sync instantly to everyone in this room!"
              className="w-full flex-1 bg-transparent text-slate-200 text-sm leading-relaxed p-2 font-mono resize-none outline-none scrollbar-thin scrollbar-thumb-white/10"
            />

            <div className="pt-2 border-t border-white/[0.06] text-[11px] text-slate-500 flex items-center justify-between">
              <span>Auto-saves to cloud as you type</span>
              <span>{notesDraft.length} chars</span>
            </div>
          </div>

          {/* Right Column: Active Members & Live Encouragement Chat (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Active Members Card */}
            <div className="p-4 rounded-2xl bg-[#0c0c17] border border-purple-900/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>Active Squad ({currentRoom.activeMemberNames.length})</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentRoom.activeMemberNames.map((name, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="font-medium">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* In-Room Live Chat & Cheers */}
            <div className="flex-1 rounded-2xl bg-[#0c0c17] border border-purple-900/30 p-4 flex flex-col h-[380px]">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Squad Encouragement & Chat
                </span>
              </div>

              {/* Messages list */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs">
                    <Sparkles className="w-6 h-6 mb-2 text-purple-400/50" />
                    <span>No messages yet. Send a cheer or question to your study squad!</span>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.userId === user?.uid;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-slate-500 mb-0.5 font-medium">
                          {m.userName}
                        </span>
                        <div
                          className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] break-words ${
                            isMe
                              ? 'bg-purple-600 text-white rounded-tr-none'
                              : 'bg-white/[0.07] text-slate-200 rounded-tl-none border border-white/[0.08]'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Cheer Buttons */}
              <div className="flex items-center gap-1.5 py-2 border-t border-white/[0.06] overflow-x-auto scrollbar-none">
                <button
                  onClick={() => handleSendMessage('🔥 Crushing it! Keep the focus!')}
                  className="px-2 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  <Flame className="w-3 h-3" />
                  <span>Crushing it</span>
                </button>
                <button
                  onClick={() => handleSendMessage('☕ Take a 5m breather & hydrate!')}
                  className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  <Coffee className="w-3 h-3" />
                  <span>Break time</span>
                </button>
                <button
                  onClick={() => handleSendMessage('🎯 Completed my current task!')}
                  className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Finished task</span>
                </button>
              </div>

              {/* Message Input */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Send a message..."
                  className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ROOMS BROWSER / CREATOR
  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#170e2f] via-[#101026] to-[#0a1226] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-purple-950/30">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Real-Time Collaborative Study Rooms</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Study Rooms & Squad Sync
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Join or launch a synchronized study room. Friends can connect via room code or direct link to share synchronized Pomodoro cycles, edit live collaborative notes, and cheer each other on.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingRoom(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Study Room</span>
        </button>
      </div>

      {/* Join Room by Code input */}
      <div className="p-5 rounded-2xl bg-[#0e0c19] border border-purple-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Join with Room Code</h3>
          <p className="text-xs text-slate-400">Have a code from a friend? Enter it below to jump directly in.</p>
        </div>

        <form onSubmit={handleJoinByCode} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
            placeholder="e.g. ROOM-4921"
            className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-white font-mono placeholder-slate-500 outline-none uppercase focus:border-purple-500/60"
          />
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Join
          </button>
        </form>
      </div>

      {/* Create Room Modal */}
      {isCreatingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#0f0e1a] border border-purple-500/30 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create New Study Room</h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Room Title
                </label>
                <input
                  type="text"
                  required
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder="e.g. Organic Chemistry Night Sprint"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Subject Category
                </label>
                <input
                  type="text"
                  value={newRoomSubject}
                  onChange={(e) => setNewRoomSubject(e.target.value)}
                  placeholder="e.g. Mathematics, Biology, Computer Science..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingRoom(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Launch Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Public / Group Rooms Grid */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">Live Active Rooms</h3>
        {rooms.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
            <Radio className="w-8 h-8 text-purple-400/50 mx-auto" />
            <h4 className="text-sm font-bold text-white">No active rooms right now</h4>
            <p className="text-xs text-slate-400">Be the first to start a room and invite your friends!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((rm) => (
              <div
                key={rm.id}
                className="p-5 rounded-2xl bg-[#0d0c17] border border-purple-900/30 hover:border-purple-500/50 transition-all flex flex-col justify-between group shadow-lg shadow-purple-950/20"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                      {rm.code}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {rm.activeMemberNames?.length || 1} online
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    {rm.title}
                  </h4>
                  <p className="text-xs text-slate-400">{rm.subject}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-slate-500">Host: {rm.hostName}</span>
                  <button
                    onClick={() => joinRoom(rm)}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Join Room
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
