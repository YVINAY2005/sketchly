import React from 'react';
import { Timer, Sparkles } from 'lucide-react';
import { GameStateSnapshot } from '../../types';

export interface GameHeaderProps {
  gameState: GameStateSnapshot;
  isDrawer: boolean;
  drawerName?: string;
  roundTimer: number;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameState,
  isDrawer,
  drawerName,
  roundTimer,
}) => {
  const isTimeCritical = roundTimer <= 10 && gameState.phase === 'DRAWING';

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 bg-white rounded-3xl border-3 border-slate-900 shadow-tactile-lg">
      {/* Left: Round status & drawer info */}
      <div className="flex items-center gap-3">
        <div className="px-3 py-1 bg-amber-400 border-2 border-slate-900 rounded-xl text-xs font-black text-slate-950 shadow-tactile-sm uppercase tracking-wider">
          Round {gameState.round}/{gameState.totalRounds}
        </div>

        <div className="text-xs font-black text-slate-800">
          {isDrawer ? (
            <span className="text-amber-900 bg-amber-100 border border-slate-900 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-tactile-sm">
              <Sparkles className="w-4 h-4 text-amber-600 stroke-[2.5]" /> YOU ARE DRAWING
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-slate-100 border border-slate-900/30 px-2.5 py-1 rounded-xl">
              <span className="font-black text-slate-950">{drawerName || 'Someone'}</span> is sketching
            </span>
          )}
        </div>
      </div>

      {/* Center: Secret Word (Drawer) OR Chunky Masked Word Tiles (Guesser) */}
      <div className="flex items-center gap-2">
        {isDrawer && gameState.selectedWord ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">SECRET WORD:</span>
            <span className="text-lg sm:text-xl font-black text-slate-950 tracking-wider font-mono px-4 py-1 bg-amber-200 border-2 border-slate-900 rounded-xl shadow-tactile-sm uppercase">
              {gameState.selectedWord}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {gameState.maskedWord ? (
              <div className="flex flex-wrap items-center justify-center gap-1.5 font-mono">
                {gameState.maskedWord.split(' ').map((wordChunk, wIdx) => (
                  <span key={wIdx} className="inline-flex gap-1 mx-1">
                    {wordChunk.split('').map((char, cIdx) => (
                      <span
                        key={cIdx}
                        className={`inline-flex items-center justify-center w-7 h-8 sm:w-8 sm:h-9 text-base sm:text-lg font-mono font-black rounded-lg border-2 border-slate-900 uppercase ${char === '_'
                            ? 'bg-amber-50 text-slate-300 shadow-tactile-sm'
                            : 'bg-amber-300 text-slate-950 shadow-tactile-sm animate-pop-in'
                          }`}
                      >
                        {char === '_' ? '•' : char}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xl font-mono font-black text-slate-400">—</span>
            )}
            {gameState.wordLength > 0 && (
              <span className="text-xs font-black text-slate-500 ml-1">
                ({gameState.wordLength})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Timer & Category */}
      <div className="flex items-center gap-2.5">
        {gameState.category && gameState.category !== 'all' && (
          <span className="hidden md:inline-flex px-2 py-0.5 rounded-lg bg-amber-100 border border-slate-900 text-slate-900 text-[11px] font-black uppercase tracking-wider">
            {gameState.category}
          </span>
        )}

        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-sm border-2 transition-all ${isTimeCritical
              ? 'bg-rose-500 text-white border-slate-900 animate-timer-critical shadow-tactile'
              : 'bg-white text-slate-950 border-slate-900 shadow-tactile-sm'
            }`}
          title="Time remaining"
        >
          <Timer className="w-4 h-4 stroke-[2.5]" />
          <span>{formatTimer(roundTimer)}</span>
        </div>
      </div>
    </div>
  );
};

