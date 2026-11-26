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
    <div className="flex flex-col bg-white rounded-3xl border-3 border-slate-900 shadow-tactile-lg overflow-hidden h-full">
      <div className="px-4 py-3 border-b-2 border-slate-900 flex items-center justify-between bg-amber-50">
        <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">
          LEADERBOARD ({players.length})
        </h3>
        <span className="text-xs font-black text-slate-600 uppercase">PTS</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[220px] sm:max-h-none">
        {sortedPlayers.map((player, index) => {
          const isDrawer = player.id === currentDrawerId;
          const isSelf = player.id === currentUserId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2.5 rounded-2xl border-2 transition-all shadow-tactile-sm ${
                player.hasGuessedCorrectly
                  ? 'bg-emerald-100 border-slate-900'
                  : isDrawer
                    ? 'bg-amber-300 border-slate-900'
                    : isSelf
                      ? 'bg-amber-50 border-slate-900'
                      : 'bg-white border-slate-900/40 hover:border-slate-900'
              } ${!player.isConnected ? 'opacity-40' : ''}`}
            >
              {/* Left: Avatar + Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs font-mono font-black text-slate-700 w-5 text-center">
                  {index === 0 ? '👑' : `#${index + 1}`}
                </span>

                <Avatar
                  emoji={player.avatar}
                  name={player.name}
                  size="sm"
                  isHost={player.isHost}
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-950 truncate">
                      {player.name}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] font-black text-slate-900 bg-amber-200 border border-slate-900 px-1 py-0.2 rounded-md">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[10px]">
                    {isDrawer && (
                      <span className="inline-flex items-center gap-0.5 text-slate-950 font-black uppercase">
                        <Paintbrush className="w-2.5 h-2.5 stroke-[2.5]" /> Sketching
                      </span>
                    )}
                    {player.hasGuessedCorrectly && (
                      <span className="inline-flex items-center gap-0.5 text-emerald-950 font-black uppercase">
                        <Check className="w-3 h-3 stroke-[3]" /> Guessed!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Score */}
              <div className="flex flex-col items-end shrink-0 pl-2">
                <span className="text-xs font-mono font-black text-slate-950 bg-white/90 border border-slate-900 px-2 py-0.5 rounded-lg shadow-tactile-sm">
                  {player.score}
                </span>
                {player.roundScore > 0 && (
                  <span className="text-[10px] font-mono font-black text-emerald-800 animate-fade-in mt-0.5">
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

