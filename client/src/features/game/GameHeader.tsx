import React from 'react';
import { Timer, Sparkles } from 'lucide-react';
import { GameStateSnapshot } from '../../types';
import { Badge } from '../../components/common/Badge';

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* Left: Round status & drawer info */}
      <div className="flex items-center gap-3">
        <Badge variant="brand" size="md">
          Round {gameState.round} of {gameState.totalRounds}
        </Badge>

        <div className="text-xs font-semibold text-slate-600">
          {isDrawer ? (
            <span className="text-brand-700 flex items-center gap-1 font-bold">
              <Sparkles className="w-3.5 h-3.5" /> You are drawing
            </span>
          ) : (
            <span>
              <span className="font-bold text-slate-900">{drawerName || 'Someone'}</span> is drawing
            </span>
          )}
        </div>
      </div>

      {/* Center: Secret Word (Drawer) OR Masked Hint (Guesser) */}
      <div className="flex items-center gap-2">
        {isDrawer && gameState.selectedWord ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Word:</span>
            <span className="text-lg font-extrabold text-slate-900 tracking-wide font-mono px-3 py-1 bg-brand-50 border border-brand-200 rounded-xl">
              {gameState.selectedWord.toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="text-xl sm:text-2xl font-mono font-extrabold tracking-widest text-slate-900 px-3 py-1 bg-slate-100 rounded-xl border border-slate-200">
              {gameState.maskedWord || '—'}
            </div>
            {gameState.wordLength > 0 && (
              <span className="text-[11px] font-semibold text-slate-500">
                ({gameState.wordLength})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Timer */}
      <div className="flex items-center gap-2">
        {gameState.category && gameState.category !== 'all' && (
          <Badge variant="neutral" size="sm" className="hidden md:inline-flex capitalize">
            {gameState.category}
          </Badge>
        )}

        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm border transition-all ${
            isTimeCritical
              ? 'bg-red-50 text-red-600 border-red-300 animate-timer-critical shadow-sm'
              : 'bg-slate-100 text-slate-800 border-slate-200'
          }`}
          title="Time remaining"
        >
          <Timer className="w-4 h-4" />
          <span>{formatTimer(roundTimer)}</span>
        </div>
      </div>
    </div>
  );
};

