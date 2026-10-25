import React from 'react';
import { Zap, Flame, Volume2, ShieldAlert } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

interface MascotAvatarProps {
  isThinking: boolean;
  isSpeaking: boolean;
  savageLevel: number;
  mode: string;
  soundMuted: boolean;
  onAvatarClick?: () => void;
  size?: 'compact' | 'standard' | 'large';
}

export const MascotAvatar: React.FC<MascotAvatarProps> = ({
  isThinking,
  isSpeaking,
  savageLevel,
  mode,
  soundMuted,
  onAvatarClick,
  size = 'standard',
}) => {
  const handleClick = () => {
    soundEffects.electricSpark(soundMuted);
    onAvatarClick?.();
  };

  const sizeClasses = {
    compact: 'w-24 h-32 md:w-28 md:h-36',
    standard: 'w-36 h-48 md:w-48 md:h-64',
    large: 'w-56 h-76 md:w-64 md:h-84',
  }[size];

  return (
    <div className="flex flex-col items-center select-none relative group">
      {/* Dynamic Red Fiery Backlight & Aura */}
      <div
        className={`absolute inset-0 -m-3 rounded-2xl transition-all duration-700 pointer-events-none blur-xl opacity-70 ${
          isThinking
            ? 'bg-red-600 opacity-90 scale-105 animate-pulse'
            : isSpeaking
            ? 'bg-rose-500 opacity-80 scale-102'
            : 'bg-red-950/60 group-hover:bg-red-800/70'
        }`}
      />

      {/* Mascot Card Container */}
      <div
        onClick={handleClick}
        className={`relative ${sizeClasses} rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 shadow-2xl ${
          isThinking
            ? 'border-red-500 shadow-red-600/50 scale-[1.02]'
            : isSpeaking
            ? 'border-rose-400 shadow-rose-500/40 ring-2 ring-red-500/30'
            : 'border-red-900/40 hover:border-red-600/80 hover:shadow-red-900/50'
        }`}
        title="Metal Ass — Click to trigger surge"
      >
        {/* The Exact User-Supplied Image */}
        <img
          src="/assets/aistudio/metal_mascot_befe2d28.jpg"
          alt="Metal Ass Mascot"
          className={`w-full h-full object-cover transition-transform duration-700 ${
            isThinking
              ? 'scale-105 contrast-125'
              : isSpeaking
              ? 'scale-102 brightness-110'
              : 'group-hover:scale-102'
          }`}
        />

        {/* Ambient Dark Gradient Vignette for Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />

        {/* Electric Glitch Overlay when Thinking */}
        {isThinking && (
          <div className="absolute inset-0 bg-red-600/15 mix-blend-color-dodge pointer-events-none animate-pulse">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/70 animate-bounce" />
          </div>
        )}

        {/* Reactive Speaking Waveform in Footer */}
        {isSpeaking && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center gap-1 px-3 py-1 bg-black/70 backdrop-blur-sm border-t border-red-500/30">
            <Volume2 className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <div className="flex items-end gap-0.5 h-3">
              <span className="w-1 bg-red-500 rounded-full animate-bounce [animation-delay:0.1s] h-3" />
              <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:0.25s] h-2" />
              <span className="w-1 bg-red-400 rounded-full animate-bounce [animation-delay:0.15s] h-3.5" />
              <span className="w-1 bg-rose-500 rounded-full animate-bounce [animation-delay:0.3s] h-2" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-red-300 font-mono font-bold">Vocalizing</span>
          </div>
        )}

        {/* State Badge Top Right */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md border border-red-600/30 text-[10px] font-mono font-bold">
          {isThinking ? (
            <span className="flex items-center gap-1 text-amber-400 animate-pulse">
              <Zap className="w-3 h-3" />
              <span>JUDGING...</span>
            </span>
          ) : isSpeaking ? (
            <span className="flex items-center gap-1 text-red-400">
              <Flame className="w-3 h-3 text-red-500 animate-spin" />
              <span>SPITTING</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span>READY</span>
            </span>
          )}
        </div>
      </div>

      {/* Cyber Status Tag */}
      <div className="mt-2.5 flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-950/90 border border-red-800/40 text-xs font-mono shadow-lg">
        <span className="flex items-center gap-1 font-bold text-red-400">
          <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
          SAVAGE {savageLevel}/10
        </span>
        <span className="text-neutral-600">|</span>
        <span className="uppercase text-[11px] text-neutral-300 tracking-wider">
          {mode === 'roast' ? 'MAX ROAST' : mode === 'code' ? 'DEV ROAST' : mode === 'tough_love' ? 'TOUGH LOVE' : mode === 'homie' ? 'LOYAL HOMIE' : 'STREET SMART'}
        </span>
      </div>
    </div>
  );
};
