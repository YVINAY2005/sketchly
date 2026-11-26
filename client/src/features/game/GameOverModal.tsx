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
              <p className="text-xs font-black text-slate-900 mt-1 max-w-[70px] truncate">
                {secondPlace.name}
              </p>
              <p className="text-[11px] font-mono font-black text-slate-600">
                {secondPlace.score} pts
              </p>
              <div className="w-16 sm:w-20 h-20 bg-slate-200 rounded-t-2xl border-3 border-b-0 border-slate-900 mt-2 flex flex-col items-center justify-center font-black text-slate-700 text-base shadow-tactile-sm">
                🥈 2nd
              </div>
            </div>
          )}

          {/* 1st Place (Winner) */}
          {firstPlace && (
            <div className="flex flex-col items-center -translate-y-2">
              <div className="text-3xl animate-bounce mb-1">👑</div>
              <Avatar emoji={firstPlace.avatar} size="lg" className="ring-4 ring-amber-400" />
              <p className="text-sm font-black text-slate-950 mt-1 max-w-[90px] truncate">
                {firstPlace.name}
              </p>
              <p className="text-xs font-mono font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-slate-900 shadow-sm mt-0.5">
                {firstPlace.score} pts
              </p>
              <div className="w-20 sm:w-24 h-28 bg-amber-300 rounded-t-2xl border-3 border-b-0 border-slate-900 mt-2 flex flex-col items-center justify-center font-black text-slate-950 text-xl shadow-tactile">
                🥇 1st
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {thirdPlace && (
            <div className="flex flex-col items-center">
              <Avatar emoji={thirdPlace.avatar} size="md" />
              <p className="text-xs font-black text-slate-900 mt-1 max-w-[70px] truncate">
                {thirdPlace.name}
              </p>
              <p className="text-[11px] font-mono font-black text-slate-600">
                {thirdPlace.score} pts
              </p>
              <div className="w-16 sm:w-20 h-14 bg-amber-100 rounded-t-2xl border-3 border-b-0 border-slate-900 mt-2 flex flex-col items-center justify-center font-black text-amber-900 text-sm shadow-tactile-sm">
                🥉 3rd
              </div>
            </div>
          )}
        </div>

        {/* Full Leaderboard */}
        <div className="text-left bg-amber-50 p-4 rounded-2xl border-2 border-slate-900 shadow-tactile-sm">
          <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider mb-2.5">
            FINAL STANDINGS
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-1.5">
            {winnerData.allPlayers.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white border-2 border-slate-900/60 shadow-tactile-sm text-xs font-bold"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-600 w-4">#{idx + 1}</span>
                  <Avatar emoji={p.avatar} size="sm" />
                  <span className="font-black text-slate-950">{p.name}</span>
                </div>
                <span className="font-mono font-black text-slate-950 bg-amber-100 px-2 py-0.5 rounded border border-slate-900/40">{p.score} pts</span>
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
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black shadow-tactile-md"
              icon={<RotateCcw className="w-4 h-4 stroke-[3]" />}
            >
              PLAY AGAIN
            </Button>
          ) : (
            <div className="text-xs text-slate-600 font-bold italic">
              Waiting for the host to restart match...
            </div>
          )}

          <Button
            onClick={onLeave}
            variant="outline"
            size="lg"
            className="font-black"
            icon={<Home className="w-4 h-4 stroke-[2.5]" />}
          >
            LEAVE GAME
          </Button>
        </div>
      </div>
    </Modal>
  );
};
