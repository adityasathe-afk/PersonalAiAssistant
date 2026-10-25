import React from 'react';
import { Flame, Code, Dumbbell, HeartHandshake, Zap, Sliders } from 'lucide-react';
import { PersonaMode } from '../types';
import { soundEffects } from '../utils/soundEffects';

interface ModeSelectorProps {
  currentMode: PersonaMode;
  onSelectMode: (mode: PersonaMode) => void;
  savageLevel: number;
  onSavageChange: (level: number) => void;
  soundMuted: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  savageLevel,
  onSavageChange,
  soundMuted,
}) => {
  const modes: { id: PersonaMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'standard',
      label: 'Street Smart (9/10)',
      icon: <Zap className="w-3.5 h-3.5" />,
      desc: 'Default signature personality. Loyal, blunt, hilarious, zero corporate BS.',
    },
    {
      id: 'roast',
      label: 'Max Roast 🔥',
      icon: <Flame className="w-3.5 h-3.5" />,
      desc: 'No mercy. Full teardown of bad ideas, procrastination, or goofy mistakes.',
    },
    {
      id: 'code',
      label: 'Dev Roast 💻',
      icon: <Code className="w-3.5 h-3.5" />,
      desc: 'Code review from hell. Destroys bad patterns and gives clean working code.',
    },
    {
      id: 'tough_love',
      label: 'Tough Love ⚡',
      icon: <Dumbbell className="w-3.5 h-3.5" />,
      desc: 'Calls out excuses and procrastination. Demands real accountability.',
    },
    {
      id: 'homie',
      label: 'Loyal Homie 🤝',
      icon: <HeartHandshake className="w-3.5 h-3.5" />,
      desc: 'When you are down, stressed, or need to vent. Less roasting, genuine backup.',
    },
  ];

  return (
    <div className="bg-neutral-950/80 border-b border-red-950/50 p-2.5 px-4 backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Mode Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {modes.map((m) => {
            const isActive = currentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  soundEffects.click(soundMuted);
                  onSelectMode(m.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-red-700/80 text-white shadow-md shadow-red-900/50 border border-red-500 scale-102 font-bold'
                    : 'bg-neutral-900/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
                }`}
                title={m.desc}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Savage Intensity Slider */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end px-1">
          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
            <Sliders className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">SAVAGE DIAL:</span>
            <span className={`font-bold ${savageLevel >= 8 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
              {savageLevel}/10
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={savageLevel}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onSavageChange(val);
              if (val === 10) soundEffects.savageBoom(soundMuted);
            }}
            className="w-24 sm:w-28 accent-red-600 cursor-pointer"
            title="Adjust Metal Ass Savage Level (1: Calm, 9: Standard, 10: Nuclear)"
          />
        </div>
      </div>
    </div>
  );
};
