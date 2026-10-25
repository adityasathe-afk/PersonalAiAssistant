import React, { useState } from 'react';
import { Volume2, VolumeX, Bookmark, BookmarkCheck, Copy, Check, Terminal, Share2, Sparkles } from 'lucide-react';
import { ChatMessageItem } from '../types';
import { soundEffects } from '../utils/soundEffects';

interface ChatMessageProps {
  message: ChatMessageItem;
  userPrompt?: string;
  onSaveRoast: (prompt: string, reply: string) => void;
  isSaved?: boolean;
  onPlayTTS: (text: string, msgId: string) => void;
  onStopTTS: () => void;
  isCurrentlyPlayingAudio: boolean;
  soundMuted: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  userPrompt = '',
  onSaveRoast,
  isSaved = false,
  onPlayTTS,
  onStopTTS,
  isCurrentlyPlayingAudio,
  soundMuted,
}) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    soundEffects.click(soundMuted);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    soundEffects.click(soundMuted);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleToggleVoice = () => {
    if (isCurrentlyPlayingAudio) {
      onStopTTS();
    } else {
      soundEffects.click(soundMuted);
      onPlayTTS(message.content, message.id);
    }
  };

  const handleBookmark = () => {
    soundEffects.electricSpark(soundMuted);
    onSaveRoast(userPrompt, message.content);
  };

  // Robust Markdown Parser for Code blocks, bold, headers, lists
  const renderFormattedContent = (rawText: string) => {
    // Split by code blocks ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let blockCounter = 0;

    while ((match = codeBlockRegex.exec(rawText)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        const textSegment = rawText.substring(lastIndex, matchIndex);
        parts.push(renderTextSegment(textSegment, `seg-${lastIndex}`));
      }

      const lang = match[1] || 'code';
      const code = match[2];
      const blockId = `code-${message.id}-${blockCounter++}`;

      parts.push(
        <div key={blockId} className="my-3 rounded-xl overflow-hidden border border-red-900/60 bg-neutral-950/90 shadow-lg">
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-900/90 border-b border-red-950/80 text-[11px] font-mono text-neutral-400">
            <span className="flex items-center gap-1.5 text-red-400 font-bold uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              {lang}
            </span>
            <button
              onClick={() => handleCopyCode(code, blockId)}
              className="flex items-center gap-1 text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-800/60 hover:bg-neutral-800 cursor-pointer transition-colors"
            >
              {copiedCodeId === blockId ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[10px]">Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3.5 text-xs sm:text-sm font-mono text-neutral-200 overflow-x-auto selection:bg-red-800 leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < rawText.length) {
      parts.push(renderTextSegment(rawText.substring(lastIndex), `seg-${lastIndex}`));
    }

    return parts;
  };

  const renderTextSegment = (text: string, keyPrefix: string) => {
    const lines = text.split('\n');
    return (
      <div key={keyPrefix} className="space-y-1.5">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={`${keyPrefix}-blank-${idx}`} className="h-2" />;
          }

          // Headers
          if (line.startsWith('### ')) {
            return (
              <h4 key={`${keyPrefix}-h3-${idx}`} className="text-base font-bold text-red-300 mt-2 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-red-500 inline" />
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={`${keyPrefix}-h2-${idx}`} className="text-lg font-extrabold text-red-400 border-b border-red-950/60 pb-1 mt-3 mb-1.5">
                {line.replace('## ', '')}
              </h3>
            );
          }

          // Bullet points
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={`${keyPrefix}-li-${idx}`} className="flex items-start gap-2 pl-2">
                <span className="text-red-500 font-bold leading-relaxed">•</span>
                <span className="text-neutral-200 text-sm leading-relaxed">
                  {formatInlineText(line.substring(2))}
                </span>
              </div>
            );
          }

          // Blockquote
          if (line.startsWith('> ')) {
            return (
              <blockquote key={`${keyPrefix}-quote-${idx}`} className="border-l-2 border-red-600 pl-3 py-1 my-1.5 text-neutral-300 italic text-sm bg-red-950/15 rounded-r">
                {formatInlineText(line.substring(2))}
              </blockquote>
            );
          }

          return (
            <p key={`${keyPrefix}-p-${idx}`} className="text-sm sm:text-base text-neutral-100 leading-relaxed font-normal">
              {formatInlineText(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const formatInlineText = (raw: string) => {
    // Replace **bold** and `code`
    const parts: React.ReactNode[] = [];
    const inlineRegex = /(\*\*.*?\*\*|`.*?`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let counter = 0;

    while ((m = inlineRegex.exec(raw)) !== null) {
      if (m.index > last) {
        parts.push(raw.substring(last, m.index));
      }
      const token = m[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={`bold-${counter++}`} className="font-bold text-white tracking-wide">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={`code-${counter++}`} className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 font-mono text-xs text-red-300">
            {token.slice(1, -1)}
          </code>
        );
      }
      last = m.index + token.length;
    }
    if (last < raw.length) {
      parts.push(raw.substring(last));
    }
    return parts;
  };

  return (
    <div className={`flex w-full mb-4 ${isAssistant ? 'justify-start' : 'justify-end'} group`}>
      <div className={`flex gap-3 max-w-[92%] sm:max-w-[85%] md:max-w-[78%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar for Assistant */}
        {isAssistant ? (
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-10 sm:w-9 sm:h-12 rounded-lg overflow-hidden border border-red-600/70 shadow-md shadow-red-900/40 relative">
              <img
                src="/assets/aistudio/metal_mascot_befe2d28.jpg"
                alt="Metal Ass"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-red-600/10" />
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-mono font-bold text-neutral-300 shadow">
              YOU
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative rounded-2xl p-4 transition-all duration-200 ${
            isAssistant
              ? 'bg-neutral-950/90 border border-red-900/50 shadow-xl shadow-red-950/30 text-neutral-100 backdrop-blur-md rounded-tl-sm'
              : 'bg-neutral-900/95 border border-neutral-700 text-neutral-100 shadow-md rounded-tr-sm'
          }`}
        >
          {/* Header row for Assistant */}
          {isAssistant && (
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-red-950/60 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-red-500 tracking-wider">METAL ASS</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/40">
                  REAL TALK
                </span>
              </div>
              <span className="text-[11px] text-neutral-500">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* Body Content */}
          <div className="break-words">
            {renderFormattedContent(message.content)}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-red-500 animate-pulse align-middle" />
            )}
          </div>

          {/* Action Bar for Assistant Messages */}
          {isAssistant && !message.isStreaming && (
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-red-950/40 text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Voice Readout Button */}
                <button
                  onClick={handleToggleVoice}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                    isCurrentlyPlayingAudio
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                  }`}
                  title={isCurrentlyPlayingAudio ? 'Stop Voice' : 'Hear Metal Ass Voice (Fenrir)'}
                >
                  {isCurrentlyPlayingAudio ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-white" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Hear Voice</span>
                    </>
                  )}
                </button>

                {/* Bookmark Roast to Ledger */}
                <button
                  onClick={handleBookmark}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-600/50'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                  }`}
                  title="Save to Roast Ledger / Hall of Fame"
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="hidden sm:inline">Pin Roast</span>
                    </>
                  )}
                </button>
              </div>

              {/* Copy message button */}
              <button
                onClick={handleCopyText}
                className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Copy entire response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* User timestamp */}
          {!isAssistant && (
            <div className="text-[10px] font-mono text-neutral-500 text-right mt-1.5">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
