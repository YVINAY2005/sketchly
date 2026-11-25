import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { ChatMessage } from '@sketchly/shared';
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
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[340px] sm:h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Chat & Guesses
        </h3>
        {hasGuessed && (
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Guessed!
          </span>
        )}
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
            Type your guesses below!
          </div>
        )}

        {messages.map((msg) => {
          if (msg.type === 'correct') {
            return (
              <div
                key={msg.id}
                className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-800 flex items-center gap-1.5 animate-fade-in"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{msg.text}</span>
              </div>
            );
          }

          if (msg.type === 'close') {
            return (
              <div
                key={msg.id}
                className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 flex items-center gap-1.5 animate-fade-in"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{msg.text}</span>
              </div>
            );
          }

          if (msg.type === 'system') {
            return (
              <div
                key={msg.id}
                className="text-[11px] font-medium text-slate-400 italic text-center py-1"
              >
                {msg.text}
              </div>
            );
          }

          return (
            <div key={msg.id} className="text-xs break-words">
              <span className="font-bold text-slate-900 mr-1.5">{msg.senderName}:</span>
              <span className="text-slate-700">{msg.text}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-2.5 border-t border-slate-100 bg-slate-50/50">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isDrawer && isDrawingPhase}
            placeholder={
              isDrawer && isDrawingPhase
                ? 'You are drawing! You cannot guess.'
                : hasGuessed
                ? 'You guessed the word!'
                : 'Type your guess here...'
            }
            maxLength={140}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:opacity-60 transition-colors"
          />
          <button
            type="submit"
            disabled={(isDrawer && isDrawingPhase) || !inputText.trim()}
            className="absolute right-1.5 p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-30 disabled:hover:bg-brand-600 transition-colors"
            title="Send guess"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
