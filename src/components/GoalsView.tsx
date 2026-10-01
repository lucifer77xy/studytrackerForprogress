import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Target, Plus, CheckCircle2, Circle, Clock, Trash2, Calendar } from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { goals, createGoal, toggleGoalComplete } = useAuth();
  const [title, setTitle] = useState('');
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [deadline, setDeadline] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createGoal(title.trim(), targetMinutes, deadline);
    setTitle('');
    setIsAdding(false);
  };

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#170e2f] via-[#101026] to-[#07191d] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-purple-950/30">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Target className="w-3.5 h-3.5" />
            <span>Study Goals & Milestones</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Target Focus Goals
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Set weekly focus targets, break study material into achievable milestones, and celebrate completed objectives.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Study Goal</span>
        </button>
      </div>

      {/* Add Goal Modal / Form */}
      {isAdding && (
        <div className="p-5 rounded-2xl bg-[#0e0c19] border border-purple-900/40 space-y-4">
          <h3 className="text-sm font-bold text-white">Create New Study Target</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Goal Description
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete 5 Practice Physics Exams"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Target Minutes
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(parseInt(e.target.value) || 30)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-xs text-white outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 md:col-span-3 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Save Target
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Goals */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Active Goals</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono">
            {activeGoals.length}
          </span>
        </h3>

        {activeGoals.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0c0c16] border border-white/[0.06] text-center text-xs text-slate-500">
            No active goals right now. Click "Add Study Goal" to set your milestones!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeGoals.map((g) => (
              <div
                key={g.id}
                className="p-4 rounded-xl bg-[#0e0c19] border border-purple-900/30 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleGoalComplete(g.id, true)}
                    className="p-1 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <Circle className="w-5 h-5" />
                  </button>
                  <div>
                    <h4 className="text-xs font-bold text-white">{g.title}</h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-purple-400" />
                      <span>Target: {g.targetMinutes}m</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/[0.06]">
          <h3 className="text-sm font-bold text-slate-400">
            Completed Objectives ({completedGoals.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-70">
            {completedGoals.map((g) => (
              <div
                key={g.id}
                className="p-4 rounded-xl bg-[#0b0c14] border border-white/[0.04] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleGoalComplete(g.id, false)}
                    className="p-1 text-emerald-400 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 line-through">{g.title}</h4>
                    <p className="text-[11px] text-slate-500">Achieved</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
