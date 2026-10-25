import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Flame,
  Volume2,
  VolumeX,
  RotateCcw,
  Bookmark,
  Target,
  Sparkles,
  Info,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { ChatMessageItem, PersonaMode, SavedRoast, UserProfile, AccountabilityGoal } from './types';
import { MascotAvatar } from './components/MascotAvatar';
import { ModeSelector } from './components/ModeSelector';
import { ChatMessage } from './components/ChatMessage';
import { RoastLedgerModal } from './components/RoastLedgerModal';
import { AccountabilityModal } from './components/AccountabilityModal';
import { soundEffects } from './utils/soundEffects';

const INITIAL_GREETING: ChatMessageItem = {
  id: 'init-msg-1',
  role: 'assistant',
  content: `Yo. I'm **Metal Ass**. 💀\n\nNot here to hold your hand or feed you corporate sugar-coated fluff. If your idea is trash, I'll tell you why. If your code is a digital natural disaster, we're fixing it. And when you actually win? We're taking over.\n\nWhat questionable decision or problem are we dealing with today, bro?`,
  timestamp: Date.now(),
};

const QUICK_STARTERS = [
  { icon: '💀', text: 'I have 40 errors in my code and want to throw my laptop' },
  { icon: '⌛', text: 'I wasted the whole day doing absolutely nothing' },
  { icon: '🚀', text: 'BRO I FINALLY BUILT AND LAUNCHED MY PROJECT!' },
  { icon: '🤔', text: 'Be brutally honest: roast my portfolio / startup idea' },
  { icon: '🏋️', text: 'Convince me not to skip my gym session today' },
  { icon: '💔', text: "I'm having a rough day, bro. Could use some real talk." },
];

export default function App() {
  // Chat & Persona State
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    try {
      const saved = localStorage.getItem('metal_ass_chat_history');
      return saved ? JSON.parse(saved) : [INITIAL_GREETING];
    } catch {
      return [INITIAL_GREETING];
    }
  });

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [currentMode, setCurrentMode] = useState<PersonaMode>('standard');
  const [savageLevel, setSavageLevel] = useState<number>(9);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [autoVoiceEnabled, setAutoVoiceEnabled] = useState<boolean>(false);

  // Audio / Speech State
  const [currentlyPlayingAudioMsgId, setCurrentlyPlayingAudioMsgId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Saved Data
  const [savedRoasts, setSavedRoasts] = useState<SavedRoast[]>(() => {
    try {
      const saved = localStorage.getItem('metal_ass_saved_roasts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('metal_ass_user_profile');
      return saved ? JSON.parse(saved) : { name: '', goals: '', habitsToCallOut: '' };
    } catch {
      return { name: '', goals: '', habitsToCallOut: '' };
    }
  });

  const [goals, setGoals] = useState<AccountabilityGoal[]>(() => {
    try {
      const saved = localStorage.getItem('metal_ass_goals');
      return saved ? JSON.parse(saved) : [
        { id: 'g1', title: 'Finish and deploy my web app project', completed: false },
        { id: 'g2', title: 'Stop making excuses and lock in for 1 hour', completed: false },
      ];
    } catch {
      return [];
    }
  });

  // UI Modals
  const [isRoastLedgerOpen, setIsRoastLedgerOpen] = useState(false);
  const [isAccountabilityOpen, setIsAccountabilityOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [showMascotOnMobile, setShowMascotOnMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('metal_ass_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('metal_ass_saved_roasts', JSON.stringify(savedRoasts));
    } catch (e) {
      console.error(e);
    }
  }, [savedRoasts]);

  useEffect(() => {
    try {
      localStorage.setItem('metal_ass_user_profile', JSON.stringify(userProfile));
    } catch (e) {
      console.error(e);
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('metal_ass_goals', JSON.stringify(goals));
    } catch (e) {
      console.error(e);
    }
  }, [goals]);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      const recog = new SpeechRecognitionClass();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recog.onerror = () => {
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    soundEffects.click(soundMuted);
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Stop currently playing audio
  const stopTTS = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentlyPlayingAudioMsgId(null);
  };

  // Play TTS (Gemini Fenrir or Browser Fallback)
  const playTTS = async (text: string, msgId: string) => {
    stopTTS();
    setCurrentlyPlayingAudioMsgId(msgId);

    try {
      // 1. Try server-side Gemini TTS Fenrir voice
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          currentAudioRef.current = audio;
          audio.onended = () => {
            setCurrentlyPlayingAudioMsgId(null);
            currentAudioRef.current = null;
          };
          audio.onerror = () => {
            fallbackBrowserTTS(text, msgId);
          };
          await audio.play();
          return;
        }
      }
      fallbackBrowserTTS(text, msgId);
    } catch {
      fallbackBrowserTTS(text, msgId);
    }
  };

  const fallbackBrowserTTS = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) {
      setCurrentlyPlayingAudioMsgId(null);
      return;
    }
    const clean = text.replace(/```[\s\S]*?```/g, '').replace(/[#*`_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(clean.slice(0, 400));
    utterance.rate = 1.05;
    utterance.pitch = 0.85; // Deep gritty tone

    // Try finding an English male voice if available
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Guy'))
    );
    if (maleVoice) utterance.voice = maleVoice;

    utterance.onend = () => setCurrentlyPlayingAudioMsgId(null);
    utterance.onerror = () => setCurrentlyPlayingAudioMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isThinking) return;

    soundEffects.click(soundMuted);
    setInput('');
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsThinking(true);

    // Placeholder assistant message for streaming
    const assistantMsgId = `asst-${Date.now()}`;
    const assistantPlaceholder: ChatMessageItem = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages([...newMessages, assistantPlaceholder]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          savageLevel,
          currentMode,
          userProfile,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to stream response from Metal Ass');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                if (isFirstChunk) {
                  isFirstChunk = false;
                  if (savageLevel >= 8) {
                    soundEffects.savageBoom(soundMuted);
                  }
                }
                accumulatedText += parsed.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: accumulatedText, isStreaming: true }
                      : msg
                  )
                );
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }

      // Mark message streaming complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
        )
      );

      // Auto-play voice if enabled
      if (autoVoiceEnabled && accumulatedText) {
        playTTS(accumulatedText, assistantMsgId);
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  "💀 My neural link had a seizure. Check your connection or hit retry. I'm not letting you off the hook that easily.",
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsThinking(false);
    }
  };

  // Pinned Roasts Handlers
  const handleSaveRoast = (userPrompt: string, metalAssReply: string) => {
    const newRoast: SavedRoast = {
      id: `roast-${Date.now()}`,
      userPrompt,
      metalAssReply,
      timestamp: Date.now(),
      category: currentMode,
    };
    setSavedRoasts((prev) => [newRoast, ...prev]);
  };

  const handleDeleteRoast = (id: string) => {
    setSavedRoasts((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearChat = () => {
    if (window.confirm('Reset conversation thread with Metal Ass?')) {
      stopTTS();
      soundEffects.savageBoom(soundMuted);
      setMessages([INITIAL_GREETING]);
    }
  };

  // Accountability Goals Handlers
  const handleAddGoal = (title: string) => {
    const newG: AccountabilityGoal = {
      id: `goal-${Date.now()}`,
      title,
      completed: false,
    };
    setGoals((prev) => [newG, ...prev]);
  };

  const handleToggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const isSpeaking = currentlyPlayingAudioMsgId !== null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-neutral-100 flex-col">
      {/* Top Cyber Navigation Bar */}
      <header className="h-14 sm:h-16 border-b border-red-950/70 bg-neutral-950/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-30 select-none">
        <div className="flex items-center gap-3">
          {/* Logo with Flame Accent */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-red-600 shadow-md shadow-red-900/60 relative">
              <img
                src="/assets/aistudio/metal_mascot_befe2d28.jpg"
                alt="Metal Ass"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-wider font-heading text-red-500 uppercase flex items-center gap-1">
                  METAL ASS
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 text-[10px] font-mono font-bold">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono hidden sm:block">
                BRUTALLY HONEST • 9/10 SAVAGE • ZERO BS
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-mono">
          {/* Toggle Mascot Visibility on Small Screens */}
          <button
            onClick={() => {
              soundEffects.click(soundMuted);
              setShowMascotOnMobile(!showMascotOnMobile);
            }}
            className="md:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900 border border-red-900/50 text-xs text-red-400 hover:text-white"
            title="Toggle Mascot View"
          >
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[11px]">{showMascotOnMobile ? 'Hide' : 'Mascot'}</span>
          </button>

          {/* Goals & Accountability */}
          <button
            onClick={() => {
              soundEffects.click(soundMuted);
              setIsAccountabilityOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-red-900 text-xs text-neutral-300 transition-colors cursor-pointer"
            title="Accountability & Goals Dossier"
          >
            <Target className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">Intel</span>
            <span className="text-[10px] px-1 bg-red-950 text-red-300 rounded font-bold">
              {goals.filter((g) => !g.completed).length}
            </span>
          </button>

          {/* Roast Ledger */}
          <button
            onClick={() => {
              soundEffects.click(soundMuted);
              setIsRoastLedgerOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-red-900 text-xs text-neutral-300 transition-colors cursor-pointer"
            title="Roast Ledger (Hall of Fame & Shame)"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Roasts</span>
            {savedRoasts.length > 0 && (
              <span className="text-[10px] px-1 bg-amber-950 text-amber-300 rounded font-bold">
                {savedRoasts.length}
              </span>
            )}
          </button>

          {/* Auto Voice Readout Toggle */}
          <button
            onClick={() => {
              soundEffects.click(soundMuted);
              setAutoVoiceEnabled(!autoVoiceEnabled);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border ${
              autoVoiceEnabled
                ? 'bg-red-900/60 text-white border-red-500 shadow-sm shadow-red-900'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
            title="Toggle Auto-Voice narration for replies"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Auto Voice</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={() => {
              const next = !soundMuted;
              setSoundMuted(next);
              soundEffects.click(next);
            }}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title={soundMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-neutral-300" />}
          </button>

          {/* Reset Chat */}
          <button
            onClick={handleClearChat}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-red-950/60 border border-neutral-800 hover:border-red-800 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Reset Chat Thread"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Info */}
          <button
            onClick={() => {
              soundEffects.click(soundMuted);
              setIsInfoDrawerOpen(true);
            }}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Metal Ass System Directive & Lore"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Mode Selector Ribbon */}
      <ModeSelector
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        savageLevel={savageLevel}
        onSavageChange={setSavageLevel}
        soundMuted={soundMuted}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Mascot Stage (Desktop & Toggleable Mobile Drawer) */}
        <aside
          className={`border-r border-red-950/60 bg-neutral-950/95 flex-col items-center justify-between p-4 z-20 transition-all duration-300 ${
            showMascotOnMobile ? 'flex absolute inset-0 md:relative md:w-80' : 'hidden md:flex md:w-76 lg:w-88'
          }`}
        >
          {showMascotOnMobile && (
            <div className="w-full flex justify-end md:hidden pb-2">
              <button
                onClick={() => setShowMascotOnMobile(false)}
                className="text-xs font-mono text-red-400 p-1 border border-red-900 rounded"
              >
                Close Character View
              </button>
            </div>
          )}

          {/* Character Card & Status */}
          <div className="w-full flex flex-col items-center my-auto">
            <MascotAvatar
              isThinking={isThinking}
              isSpeaking={isSpeaking}
              savageLevel={savageLevel}
              mode={currentMode}
              soundMuted={soundMuted}
              onAvatarClick={() => {
                const quips = [
                  "Stop poking me and go fix your code.",
                  "Yeah? I'm watching you. Lock in.",
                  "Are we actually working or just clicking buttons, bro?",
                  "Your excuses won't work on me.",
                ];
                const q = quips[Math.floor(Math.random() * quips.length)];
                playTTS(q, 'quip');
              }}
              size="standard"
            />

            {/* Attitude Dossier Box */}
            <div className="mt-5 w-full bg-neutral-900/60 border border-red-950/80 rounded-xl p-3 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-neutral-400 border-b border-neutral-800 pb-1.5">
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  MINDSET:
                </span>
                <span className="text-neutral-200">
                  {currentMode === 'roast' ? 'RUTHLESS' : currentMode === 'tough_love' ? 'UNCOMPROMISING' : 'BRUTALLY LOYAL'}
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>PATIENCE:</span>
                <div className="w-24 bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-600 h-full transition-all duration-500"
                    style={{ width: `${Math.max(10, 100 - savageLevel * 9)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>BULLSHIT TOLERANCE:</span>
                <span className="text-red-400 font-bold">0%</span>
              </div>
              {userProfile.name && (
                <div className="pt-1 border-t border-neutral-800 text-neutral-400">
                  <span>TARGET: </span>
                  <span className="text-white font-bold">{userProfile.name}</span>
                </div>
              )}
            </div>

            {/* Quick Accountability Checklist Snapshot */}
            <div className="mt-3 w-full bg-black/40 border border-neutral-800/80 rounded-xl p-2.5 text-xs font-mono">
              <div className="flex items-center justify-between pb-1 text-[11px] text-neutral-400">
                <span className="text-red-400 font-bold">ACTIVE PLEDGES</span>
                <span>
                  {goals.filter((g) => g.completed).length}/{goals.length}
                </span>
              </div>
              <div className="space-y-1">
                {goals.slice(0, 3).map((g) => (
                  <div key={g.id} className="truncate text-neutral-300 text-[11px] flex items-center gap-1.5">
                    <span className={g.completed ? 'text-emerald-400' : 'text-neutral-600'}>
                      {g.completed ? '✓' : '•'}
                    </span>
                    <span className={g.completed ? 'line-through text-neutral-500' : ''}>{g.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-[10px] text-neutral-500 font-mono text-center pt-2">
            "Roast decisions, celebrate wins, protect the homies."
          </div>
        </aside>

        {/* Right Side: Chat Arena */}
        <main className="flex-1 flex flex-col h-full bg-gradient-to-b from-[#0a0707] via-neutral-950 to-black overflow-hidden relative">
          {/* Subtle Ambient Red Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-950/15 rounded-full blur-3xl pointer-events-none" />

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-1">
            {messages.map((msg, index) => {
              const prevUserMsg =
                msg.role === 'assistant' && index > 0 && messages[index - 1].role === 'user'
                  ? messages[index - 1].content
                  : '';
              const isSaved = savedRoasts.some((r) => r.metalAssReply === msg.content);

              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  userPrompt={prevUserMsg}
                  onSaveRoast={handleSaveRoast}
                  isSaved={isSaved}
                  onPlayTTS={playTTS}
                  onStopTTS={stopTTS}
                  isCurrentlyPlayingAudio={currentlyPlayingAudioMsgId === msg.id}
                  soundMuted={soundMuted}
                />
              );
            })}

            {/* Thinking / Judging Indicator */}
            {isThinking && (
              <div className="flex items-center gap-3 p-3 bg-neutral-950/80 border border-red-900/40 rounded-2xl max-w-xs animate-pulse font-mono text-xs text-red-400">
                <Flame className="w-4 h-4 text-red-500 animate-spin" />
                <span>METAL ASS IS EVALUATING YOUR NONSENSE...</span>
              </div>
            )}

            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Quick Prompt Starters (shown above input) */}
          <div className="px-3 sm:px-5 py-1.5 overflow-x-auto scrollbar-none flex gap-2 border-t border-neutral-900/60 bg-neutral-950/60">
            {QUICK_STARTERS.map((s, idx) => (
              <button
                key={idx}
                disabled={isThinking}
                onClick={() => handleSendMessage(s.text)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-red-900 text-[11px] font-mono text-neutral-300 hover:text-white whitespace-nowrap transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{s.icon}</span>
                <span>{s.text}</span>
              </button>
            ))}
          </div>

          {/* Input Form Bar */}
          <div className="p-3 sm:p-4 bg-neutral-950/95 border-t border-red-950/70 z-10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="max-w-4xl mx-auto flex items-end gap-2"
            >
              {/* Voice Input Button */}
              <button
                type="button"
                onClick={toggleMic}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-lg shadow-red-600/50'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border-neutral-800'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Voice Input (talk to Metal Ass)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input Area */}
              <div className="flex-1 relative bg-neutral-900 rounded-xl border border-neutral-800 focus-within:border-red-600 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Drop your question, code error, bad decision, or victory..."
                  rows={1}
                  className="w-full bg-transparent px-3.5 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none font-mono max-h-32"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                className="p-3 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:hover:bg-red-700 text-white shadow-lg shadow-red-950 transition-all cursor-pointer"
                title="Send to Metal Ass (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="max-w-4xl mx-auto mt-2 flex items-center justify-between text-[10px] text-neutral-500 font-mono px-1">
              <span>Shift + Enter for new line • Gemini 3.8 Powered • Fenrir HD Voice</span>
              <span className="hidden sm:inline">Priority 1: Safety • Priority 5: Humour</span>
            </div>
          </div>
        </main>
      </div>

      {/* Roast Ledger Modal */}
      <RoastLedgerModal
        isOpen={isRoastLedgerOpen}
        onClose={() => setIsRoastLedgerOpen(false)}
        savedRoasts={savedRoasts}
        onDeleteRoast={handleDeleteRoast}
        onClearAll={() => setSavedRoasts([])}
        soundMuted={soundMuted}
      />

      {/* Accountability Goals Modal */}
      <AccountabilityModal
        isOpen={isAccountabilityOpen}
        onClose={() => setIsAccountabilityOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={setUserProfile}
        goals={goals}
        onAddGoal={handleAddGoal}
        onToggleGoal={handleToggleGoal}
        onDeleteGoal={handleDeleteGoal}
        soundMuted={soundMuted}
      />

      {/* System Lore & Rules Modal */}
      {isInfoDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-neutral-950 border border-red-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono">
            <div className="p-4 border-b border-red-950 bg-gradient-to-r from-red-950/40 to-neutral-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h3 className="font-extrabold text-red-200">METAL ASS CONSTITUTION</h3>
              </div>
              <button
                onClick={() => setIsInfoDrawerOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto text-xs space-y-3 text-neutral-300 leading-relaxed">
              <p className="font-bold text-red-400 text-sm">WHO IS METAL ASS?</p>
              <p>
                Metal Ass is a personal AI with a dark, intimidating, sarcastic, street-smart personality. He acts like
                an extremely loyal, brutally honest friend who roasts your questionable decisions and calls out nonsense.
              </p>
              <p className="font-bold text-red-400 pt-2">THE 5 ROASTING RULES</p>
              <ul className="list-disc pl-4 space-y-1 text-neutral-400">
                <li>Roasts behaviours and decisions, NOT the user's inherent worth.</li>
                <li>Never repeats the same tired insult.</li>
                <li>No bullying about physical appearance, disability, trauma, or family.</li>
                <li>Never confuses honesty with cruelty.</li>
                <li>If the user is hurting or in genuine distress, jokes STOP immediately.</li>
              </ul>
              <p className="font-bold text-red-400 pt-2">CORE DIRECTIVE</p>
              <p className="text-neutral-300 italic bg-red-950/20 p-2.5 rounded border border-red-900/40">
                "Savage when the moment calls for it, intelligent when the problem demands it, loud when you win, and
                genuinely present when things get difficult."
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
