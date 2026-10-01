import React, { useState } from 'react';
import { CreditCard, Plus, RotateCw, Check, X, ArrowLeft, ArrowRight } from 'lucide-react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
}

export const FlashcardsView: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([
    {
      id: '1',
      front: 'What is the second law of thermodynamics?',
      back: 'The total entropy of an isolated system can never decrease over time; it remains constant only in reversible processes.',
      subject: 'Physics'
    },
    {
      id: '2',
      front: 'What is the time complexity of QuickSort on average?',
      back: 'O(n log n). In the worst-case scenario with poor pivot selection, it degrades to O(n²).',
      subject: 'Computer Science'
    },
    {
      id: '3',
      front: 'What is an esterification reaction?',
      back: 'A chemical reaction between an alcohol and a carboxylic acid forming an ester and water, typically catalyzed by an acid.',
      subject: 'Chemistry'
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newSubject, setNewSubject] = useState('General');
  const [isCreating, setIsCreating] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;
    const newCard: Flashcard = {
      id: Date.now().toString(),
      front: newFront.trim(),
      back: newBack.trim(),
      subject: newSubject.trim() || 'General'
    };
    setCards([...cards, newCard]);
    setNewFront('');
    setNewBack('');
    setIsCreating(false);
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#170e2f] via-[#101026] to-[#0d1428] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-purple-950/30">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Spaced Repetition & Active Recall</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Study Flashcards</h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Test your knowledge with rapid flashcard decks. Create custom cards for key terms, theorems, and definitions.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Flashcard</span>
        </button>
      </div>

      {isCreating && (
        <div className="p-5 rounded-2xl bg-[#0e0c19] border border-purple-900/40 space-y-4">
          <h3 className="text-sm font-bold text-white">Create New Flashcard</h3>
          <form onSubmit={handleAddCard} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Question / Prompt (Front)
              </label>
              <textarea
                required
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder="What is the concept or question?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Answer / Explanation (Back)
              </label>
              <textarea
                required
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder="The detailed answer or proof..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                Save Flashcard
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Flip Card */}
      {cards.length > 0 && currentCard && (
        <div className="max-w-xl mx-auto flex flex-col items-center space-y-6">
          <div className="text-xs font-medium text-purple-300">
            Card {currentIndex + 1} of {cards.length} · {currentCard.subject}
          </div>

          {/* Flashcard container with 3D flip */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-80 rounded-3xl bg-[#0f0e1c] border border-purple-500/30 p-8 flex flex-col justify-between items-center text-center cursor-pointer shadow-2xl shadow-purple-950/40 relative group transition-all duration-300 hover:border-purple-500/60"
          >
            <div className="w-full flex justify-between text-xs text-slate-500">
              <span className="uppercase tracking-wider font-bold">
                {isFlipped ? 'Answer' : 'Question'}
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <RotateCw className="w-3.5 h-3.5" />
                Flip
              </span>
            </div>

            <div className="text-lg md:text-xl font-bold text-white px-4 leading-relaxed">
              {isFlipped ? currentCard.back : currentCard.front}
            </div>

            <div className="text-[11px] text-slate-500">Click anywhere to flip</div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrev}
              className="p-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 cursor-pointer"
            >
              {isFlipped ? 'Show Front' : 'Show Answer'}
            </button>

            <button
              onClick={handleNext}
              className="p-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors cursor-pointer"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
