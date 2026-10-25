import React, { useState } from 'react';
import { X, Dumbbell, Plus, Trash2, CheckSquare, Square, Target, AlertTriangle } from 'lucide-react';
import { UserProfile, AccountabilityGoal } from '../types';
import { soundEffects } from '../utils/soundEffects';

interface AccountabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  goals: AccountabilityGoal[];
  onAddGoal: (title: string) => void;
  onToggleGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
  soundMuted: boolean;
}

export const AccountabilityModal: React.FC<AccountabilityModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  goals,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  soundMuted,
}) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [newGoalText, setNewGoalText] = useState('');

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    onUpdateProfile(profile);
    soundEffects.successChime(soundMuted);
    onClose();
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    onAddGoal(newGoalText.trim());
    setNewGoalText('');
    soundEffects.click(soundMuted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-950 border border-red-800/60 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl shadow-red-950/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-red-900/40 bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-950">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-red-500 animate-pulse" />
            <div>
              <h2 className="text-base sm:text-lg font-extrabold font-heading text-red-100 uppercase tracking-wide">
                ACCOUNTABILITY DOSSIER
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Give Metal Ass the ammunition he needs to keep you honest
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.click(soundMuted);
              onClose();
            }}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* User Nickname */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>What Should Metal Ass Call You?</span>
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="e.g. Bro, Alex, Dev, Captain Chaos"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-red-600 font-mono"
            />
          </div>

          {/* Current Serious Goals */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-red-500" />
              <span>Current Goals & Targets</span>
            </label>
            <textarea
              rows={2}
              value={profile.goals}
              onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
              placeholder="e.g. Launching my SaaS app by next Friday, finishing college assignments on time, going to gym 4x a week"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-red-600 font-mono leading-relaxed"
            />
          </div>

          {/* Bad Habits / Excuses */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Excuses & Bad Habits to Call Out</span>
            </label>
            <textarea
              rows={2}
              value={profile.habitsToCallOut}
              onChange={(e) => setProfile({ ...profile, habitsToCallOut: e.target.value })}
              placeholder="e.g. Procrastinating on social media, complaining without coding, skipping workouts, saying 'I will start tomorrow'"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-red-600 font-mono leading-relaxed"
            />
          </div>

          {/* Actionable Commitments List */}
          <div className="space-y-2 pt-2 border-t border-neutral-900">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                Live Commitments ({goals.filter((g) => g.completed).length}/{goals.length})
              </label>
            </div>

            <form onSubmit={handleAddGoal} className="flex gap-2">
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Add a task or pledge to commit to..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-red-600 font-mono"
              />
              <button
                type="submit"
                className="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {goals.length === 0 ? (
                <p className="text-xs font-mono text-neutral-600 italic py-2">No active commitments added.</p>
              ) : (
                goals.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700"
                  >
                    <button
                      onClick={() => {
                        onToggleGoal(g.id);
                        if (!g.completed) {
                          soundEffects.successChime(soundMuted);
                        } else {
                          soundEffects.click(soundMuted);
                        }
                      }}
                      className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                    >
                      {g.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                      )}
                      <span
                        className={`text-xs font-mono ${
                          g.completed ? 'line-through text-neutral-500' : 'text-neutral-200'
                        }`}
                      >
                        {g.title}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        onDeleteGoal(g.id);
                        soundEffects.click(soundMuted);
                      }}
                      className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-neutral-900 bg-neutral-950 flex justify-end gap-2">
          <button
            onClick={() => {
              soundEffects.click(soundMuted);
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveProfile}
            className="px-5 py-2 rounded-lg text-xs font-mono font-bold bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-950 transition-all cursor-pointer"
          >
            Update Metal Ass Intel
          </button>
        </div>
      </div>
    </div>
  );
};
