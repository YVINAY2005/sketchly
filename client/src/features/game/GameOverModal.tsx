import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameWinner } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { RotateCcw, Home } from 'lucide-react';
import { socket } from '../../services/socket';
import { sound } from '../../services/audio';

export interface GameOverModalProps {
  isOpen: boolean;
  winnerData: GameWinner | null;
  isHost: boolean;
  onLeave: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winnerData,
  isHost,
  onLeave,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playWin();

      // Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch { }
    }
  }, [isOpen]);

  if (!isOpen || !winnerData) return null;

  const handleRestart = () => {
    socket.emit('game:restart');
  };

  const firstPlace = winnerData.podium.find((p) => p.rank === 1)?.player;
  const secondPlace = winnerData.podium.find((p) => p.rank === 2)?.player;
  const thirdPlace = winnerData.podium.find((p) => p.rank === 3)?.player;

  return (
    <Modal isOpen={isOpen} showCloseButton={false} maxWidth="lg" title="Game Over!">
      <div className="space-y-6 text-center">
        {/* Podium Display */}
        <div className="flex items-end justify-center gap-3 pt-4 pb-2">
          {/* 2nd Place */}
          {secondPlace && (
            <div className="flex flex-col items-center">
              <Avatar emoji={secondPlace.avatar} size="md" />
              <p className="text-xs font-bold text-slate-800 mt-1 max-w-[70px] truncate">
                {secondPlace.name}
              </p>
              <p className="text-[11px] font-mono font-bold text-slate-500">
                {secondPlace.score}
              </p>
              <div className="w-16 sm:w-20 h-20 bg-slate-200 rounded-t-xl mt-2 flex flex-col items-center justify-center font-black text-slate-500 text-lg shadow-inner">
                🥈 2nd
              </div>
            </div>
          )}

          {/* 1st Place (Winner) */}
          {firstPlace && (
            <div className="flex flex-col items-center -translate-y-2">
              <div className="text-2xl animate-bounce mb-1">👑</div>
              <Avatar emoji={firstPlace.avatar} size="lg" className="ring-4 ring-amber-400" />
              <p className="text-sm font-extrabold text-slate-900 mt-1 max-w-[90px] truncate">
                {firstPlace.name}
              </p>
              <p className="text-xs font-mono font-extrabold text-amber-600">
                {firstPlace.score} pts
              </p>
              <div className="w-20 sm:w-24 h-28 bg-amber-300 rounded-t-xl mt-2 flex flex-col items-center justify-center font-black text-amber-950 text-xl shadow-inner border-t-2 border-amber-400">
                🥇 1st
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {thirdPlace && (
            <div className="flex flex-col items-center">
              <Avatar emoji={thirdPlace.avatar} size="md" />
              <p className="text-xs font-bold text-slate-800 mt-1 max-w-[70px] truncate">
                {thirdPlace.name}
              </p>
              <p className="text-[11px] font-mono font-bold text-slate-500">
                {thirdPlace.score}
              </p>
              <div className="w-16 sm:w-20 h-14 bg-amber-100 rounded-t-xl mt-2 flex flex-col items-center justify-center font-black text-amber-800 text-base shadow-inner">
                🥉 3rd
              </div>
            </div>
          )}
        </div>

        {/* Full Leaderboard */}
        <div className="text-left bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Final Standings
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {winnerData.allPlayers.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-400 w-4">#{idx + 1}</span>
                  <Avatar emoji={p.avatar} size="sm" />
                  <span className="font-bold text-slate-900">{p.name}</span>
                </div>
                <span className="font-mono font-extrabold text-slate-800">{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {isHost ? (
            <Button
              onClick={handleRestart}
              variant="primary"
              size="lg"
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Play Again
            </Button>
          ) : (
            <div className="text-xs text-slate-500 italic">
              Waiting for the host to restart or choose a new game...
            </div>
          )}

          <Button
            onClick={onLeave}
            variant="outline"
            size="lg"
            icon={<Home className="w-4 h-4" />}
          >
            Leave Game
          </Button>
        </div>
      </div>
    </Modal>
  );
};
