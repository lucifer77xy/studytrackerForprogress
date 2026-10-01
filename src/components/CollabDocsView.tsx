import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CollaborativeDoc } from '../types';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import {
  FileText,
  Plus,
  Trash2,
  Share2,
  Users,
  Check,
  Copy,
  Sparkles,
  Save
} from 'lucide-react';

export const CollabDocsView: React.FC = () => {
  const { user, profile, friendsProfiles } = useAuth();

  const [docsList, setDocsList] = useState<CollaborativeDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<CollaborativeDoc | null>(null);
  const [docContent, setDocContent] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const syncTimeoutRef = useRef<number | null>(null);

  // 1. Listen to all collaborative docs
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, 'collaborative_docs'),
      (snapshot) => {
        const list: CollaborativeDoc[] = [];
        snapshot.forEach((d) => list.push(d.data() as CollaborativeDoc));
        setDocsList(list);

        // Update selectedDoc if active
        if (selectedDoc) {
          const fresh = list.find((d) => d.id === selectedDoc.id);
          if (fresh) {
            setSelectedDoc(fresh);
            if (document.activeElement?.id !== 'active-doc-editor') {
              setDocContent(fresh.content || '');
            }
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'collaborative_docs');
      }
    );
    return () => unsub();
  }, [user, selectedDoc?.id]);

  // Create new doc
  const handleCreateNewDoc = async () => {
    if (!user || !profile) return;
    const newDocRef = doc(collection(db, 'collaborative_docs'));
    const initialDoc: CollaborativeDoc = {
      id: newDocRef.id,
      title: 'Untitled Study Guide',
      content: '# Study Summary\n\n- [ ] Key definition 1\n- [ ] Important theorem\n- [ ] Practice questions\n',
      ownerId: user.uid,
      ownerName: profile.displayName,
      subject: 'General Study',
      collaborators: [user.uid],
      lastEditorName: profile.displayName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(newDocRef, initialDoc);
    setSelectedDoc(initialDoc);
    setDocTitle(initialDoc.title);
    setDocContent(initialDoc.content);
  };

  const handleSelectDoc = (d: CollaborativeDoc) => {
    setSelectedDoc(d);
    setDocTitle(d.title);
    setDocContent(d.content || '');
  };

  // Debounced auto-save to cloud
  const handleContentChange = (text: string) => {
    setDocContent(text);
    if (!selectedDoc || !user || !profile) return;

    setIsSaving(true);
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = window.setTimeout(async () => {
      try {
        const docRef = doc(db, 'collaborative_docs', selectedDoc.id);
        await updateDoc(docRef, {
          content: text,
          lastEditorName: profile.displayName,
          updatedAt: new Date().toISOString()
        });
        setIsSaving(false);
      } catch (err) {
        console.error('Error syncing doc:', err);
        setIsSaving(false);
      }
    }, 600);
  };

  const handleTitleChange = async (newTitle: string) => {
    setDocTitle(newTitle);
    if (!selectedDoc) return;
    try {
      const docRef = doc(db, 'collaborative_docs', selectedDoc.id);
      await updateDoc(docRef, {
        title: newTitle,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error updating title:', err);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await deleteDoc(doc(db, 'collaborative_docs', docId));
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
      }
    } catch (err) {
      console.error('Delete doc error:', err);
    }
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#170e2f] via-[#101026] to-[#09152b] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-purple-950/30">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>Real-Time Collaborative Editing & Cloud Sync</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Collaborative Study Documents
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Create shared revision guides, lecture summaries, and problem sets. Edits are synchronized across devices in real time.
          </p>
        </div>

        <button
          onClick={handleCreateNewDoc}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Collaborative Doc</span>
        </button>
      </div>

      {/* Editor & List Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Document Sidebar (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0b0c16] border border-purple-900/30 p-4 flex flex-col justify-between shadow-lg shadow-purple-950/20">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1 mb-2">
              All Cloud Documents ({docsList.length})
            </span>

            <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {docsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No documents yet. Click "New Collaborative Doc" to start!
                </div>
              ) : (
                docsList.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDoc(d)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      selectedDoc?.id === d.id
                        ? 'bg-purple-600/20 border-purple-500/50 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <h4 className="text-xs font-bold truncate">{d.title}</h4>
                      <p className="text-[10px] text-slate-500 truncate">
                        By {d.ownerName} · {d.lastEditorName ? `Edited by ${d.lastEditorName}` : 'Synced'}
                      </p>
                    </div>

                    {d.ownerId === user?.uid && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDoc(d.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Live Document Editor (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0b0c16] border border-purple-900/30 p-5 flex flex-col shadow-lg shadow-purple-950/20">
          {selectedDoc ? (
            <div className="flex flex-col h-full space-y-4">
              {/* Document Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="bg-transparent text-lg font-bold text-white outline-none focus:text-purple-300 transition-colors"
                />

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    {isSaving ? 'Syncing...' : 'Saved to Cloud'}
                  </span>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                id="active-doc-editor"
                value={docContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write study notes, formulas, summaries... Changes sync automatically to all collaborators."
                className="w-full flex-1 bg-transparent text-slate-200 text-sm leading-relaxed p-2 font-mono outline-none resize-none scrollbar-thin scrollbar-thumb-white/10 min-h-[380px]"
              />

              <div className="pt-3 border-t border-white/[0.06] text-xs text-slate-500 flex items-center justify-between">
                <span>Real-time collaborative editing</span>
                <span>{docContent.length} characters</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
              <FileText className="w-12 h-12 text-purple-400/40" />
              <h3 className="text-base font-bold text-white">Select or Create a Document</h3>
              <p className="text-xs max-w-sm">
                Choose a document from the left list or create a new collaborative guide to start editing in real time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
