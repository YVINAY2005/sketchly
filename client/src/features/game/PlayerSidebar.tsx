import React from 'react';
import { Check, Paintbrush } from 'lucide-react';
import { Player } from '../../types';
import { Avatar } from '../../components/common/Avatar';

export interface PlayerSidebarProps {
  players: Player[];
  currentDrawerId: string | null;
  currentUserId?: string;
}

export const PlayerSidebar: React.FC<PlayerSidebarProps> = ({
  players,
  currentDrawerId,
  currentUserId,
}) => {
  // Sort players by total score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Players ({players.length})
        </h3>
        <span className="text-[11px] font-semibold text-slate-400">Score</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[220px] sm:max-h-none">
        {sortedPlayers.map((player, index) => {
          const isDrawer = player.id === currentDrawerId;
          const isSelf = player.id === currentUserId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-xl transition-all ${player.hasGuessedCorrectly
                  ? 'bg-emerald-50 border border-emerald-200/80'
                  : isDrawer
                    ? 'bg-brand-50 border border-brand-200/80'
                    : isSelf
                      ? 'bg-slate-100/90 border border-slate-200'
                      : 'bg-white hover:bg-slate-50 border border-transparent'
                } ${!player.isConnected ? 'opacity-40' : ''}`}
            >
              {/* Left: Avatar + Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[11px] font-mono font-bold text-slate-400 w-4 text-center">
                  #{index + 1}
                </span>

                <Avatar
                  emoji={player.avatar}
                  name={player.name}
                  size="sm"
                  isHost={player.isHost}
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {player.name}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] font-medium text-slate-400">(You)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[10px]">
                    {isDrawer && (
                      <span className="inline-flex items-center gap-0.5 text-brand-700 font-bold">
                        <Paintbrush className="w-2.5 h-2.5" /> Drawing
                      </span>
                    )}
                    {player.hasGuessedCorrectly && (
                      <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                        <Check className="w-2.5 h-2.5" /> Guessed!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Score */}
              <div className="flex flex-col items-end shrink-0 pl-2">
                <span className="text-xs font-mono font-extrabold text-slate-900">
                  {player.score}
                </span>
                {player.roundScore > 0 && (
                  <span className="text-[10px] font-mono font-bold text-emerald-600 animate-fade-in">
                    +{player.roundScore}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

