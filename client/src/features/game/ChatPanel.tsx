import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../../types';
import { socket } from '../../services/socket';

export interface ChatPanelProps {
  messages: ChatMessage[];
  isDrawer: boolean;
  hasGuessed: boolean;
  isDrawingPhase: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isDrawer,
  hasGuessed,
  isDrawingPhase,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    socket.emit('chat:send', { text: trimmed });
    setInputText('');
  };

  return (
    <div className="flex flex-col bg-white rounded-3xl border-3 border-slate-900 shadow-tactile-lg overflow-hidden h-[340px] sm:h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b-2 border-slate-900 flex items-center justify-between bg-amber-50">
        <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">
          CHAT & GUESSES
        </h3>
        {hasGuessed && (
          <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 border border-slate-900 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-tactile-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" /> GUESSED!
          </span>
        )}
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold italic">
            Type your guesses below!
          </div>
        )}

        {messages.map((msg) => {
          if (msg.type === 'correct') {
            return (
              <div
                key={msg.id}
                className="p-2.5 rounded-2xl bg-emerald-200 border-2 border-slate-900 text-xs font-black text-emerald-950 flex items-center gap-2 shadow-tactile-sm animate-pop-in"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-800 stroke-[3] shrink-0" />
                <span>{msg.text}</span>
              </div>
            );
          }

          if (msg.type === 'close') {
            return (
              <div
                key={msg.id}
                className="p-2.5 rounded-2xl bg-amber-200 border-2 border-slate-900 text-xs font-black text-amber-950 flex items-center gap-2 shadow-tactile-sm animate-pop-in"
              >
                <AlertCircle className="w-4 h-4 text-amber-800 stroke-[3] shrink-0" />
                <span>{msg.text}</span>
              </div>
            );
          }

          if (msg.type === 'system') {
            return (
              <div
                key={msg.id}
                className="text-[11px] font-bold text-slate-500 italic text-center py-1 bg-slate-100/60 rounded-lg"
              >
                {msg.text}
              </div>
            );
          }

          return (
            <div key={msg.id} className="text-xs font-bold break-words px-1">
              <span className="font-black text-slate-950 mr-1.5">{msg.senderName}:</span>
              <span className="text-slate-800 font-medium">{msg.text}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-2.5 border-t-2 border-slate-900 bg-amber-50/60">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isDrawer && isDrawingPhase}
            placeholder={
              isDrawer && isDrawingPhase
                ? '✏️ You are drawing! You cannot guess.'
                : hasGuessed
                  ? '🎉 You guessed it! Chat is enabled.'
                  : 'Type your guess here...'
            }
            maxLength={140}
            className="w-full rounded-xl border-2 border-slate-900 bg-white px-3.5 py-2.5 pr-12 text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-amber-500 disabled:bg-slate-100 disabled:opacity-60 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={(isDrawer && isDrawingPhase) || !inputText.trim()}
            className="absolute right-1.5 p-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-slate-900 shadow-tactile-sm disabled:opacity-30 disabled:shadow-none active:translate-y-0.5 transition-all cursor-pointer"
            title="Send guess"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </form>
    </div>
  );
};
