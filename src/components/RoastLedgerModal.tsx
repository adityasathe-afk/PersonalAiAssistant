import React, { useState } from 'react';
import { X, Flame, Trash2, Copy, Check, Bookmark, Share2 } from 'lucide-react';
import { SavedRoast } from '../types';
import { soundEffects } from '../utils/soundEffects';

interface RoastLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedRoasts: SavedRoast[];
  onDeleteRoast: (id: string) => void;
  onClearAll: () => void;
  soundMuted: boolean;
}

export const RoastLedgerModal: React.FC<RoastLedgerModalProps> = ({
  isOpen,
  onClose,
  savedRoasts,
  onDeleteRoast,
  onClearAll,
  soundMuted,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = savedRoasts.filter(
    (r) =>
      r.metalAssReply.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.userPrompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundEffects.click(soundMuted);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-950 border border-red-800/60 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-red-950/80 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-red-900/40 bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-950">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
            <div>
              <h2 className="text-base sm:text-lg font-extrabold font-heading text-red-100 uppercase tracking-wide">
                ROAST LEDGER — HALL OF FAME & SHAME
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                {savedRoasts.length} pinned savagery & reality checks preserved for accountability
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

        {/* Search & Actions Bar */}
        <div className="p-3 border-b border-neutral-900 flex items-center justify-between gap-3 bg-neutral-950">
          <input
            type="text"
            placeholder="Search saved roasts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-600 font-mono"
          />
          {savedRoasts.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all saved roasts?')) {
                  onClearAll();
                  soundEffects.savageBoom(soundMuted);
                }
              }}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5 whitespace-nowrap font-mono hover:bg-red-950/40 rounded transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Roast List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 font-mono text-sm space-y-2">
              <Bookmark className="w-8 h-8 text-neutral-600 mx-auto opacity-50" />
              <p>No saved roasts yet.</p>
              <p className="text-xs text-neutral-600">
                Click "Pin Roast" on any Metal Ass response to preserve it here!
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-neutral-900/80 border border-red-900/30 hover:border-red-600/60 transition-colors shadow-sm space-y-2"
              >
                {item.userPrompt && (
                  <div className="text-xs font-mono text-neutral-400 bg-black/50 p-2 rounded border border-neutral-800/80">
                    <span className="text-neutral-500 font-bold">YOU: </span>
                    {item.userPrompt}
                  </div>
                )}
                <div className="text-sm text-neutral-100 font-normal whitespace-pre-wrap leading-relaxed border-l-2 border-red-600 pl-3 py-1">
                  {item.metalAssReply}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-xs font-mono">
                  <span className="text-[10px] text-neutral-500">
                    {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(item.id, item.metalAssReply)}
                      className="p-1 hover:text-white text-neutral-400 transition-colors cursor-pointer"
                      title="Copy roast"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        soundEffects.click(soundMuted);
                        onDeleteRoast(item.id);
                      }}
                      className="p-1 hover:text-red-400 text-neutral-500 transition-colors cursor-pointer"
                      title="Delete from ledger"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
