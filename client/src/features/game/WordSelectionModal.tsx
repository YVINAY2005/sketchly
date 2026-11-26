import React, { useEffect, useState } from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { socket } from '../../services/socket';
import { sound } from '../../services/audio';

export interface WordSelectionModalProps {
  isOpen: boolean;
  isDrawer: boolean;
  drawerName?: string;
  wordChoices?: string[] | null;
  timeRemaining: number;
}

export const WordSelectionModal: React.FC<WordSelectionModalProps> = ({
  isOpen,
  isDrawer,
  drawerName,
  wordChoices,
  timeRemaining,
}) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedWord(null);
    }
  }, [isOpen]);

  const handleSelect = (word: string) => {
    setSelectedWord(word);
    sound.playPop();
    socket.emit('game:select_word', { word });
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      showCloseButton={false}
      maxWidth="md"
      title={isDrawer ? 'Choose your word' : 'Selecting a word'}
      description={
        isDrawer
          ? 'Pick one of the options below to draw this round:'
          : `${drawerName || 'The drawer'} is choosing a word...`
      }
    >
      <div className="space-y-4">
        {/* Timer progress bar */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Time to choose:
          </span>
          <span className="font-mono font-bold text-slate-900">{timeRemaining}s</span>
        </div>

        <div className="w-full h-3 bg-amber-100 border-2 border-slate-900 rounded-full overflow-hidden shadow-tactile-sm">
          <div
            className="h-full bg-amber-400 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${Math.max(0, Math.min(100, (timeRemaining / 15) * 100))}%` }}
          />
        </div>

        {/* Drawer view: Word cards */}
        {isDrawer && wordChoices && wordChoices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {wordChoices.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => handleSelect(word)}
                disabled={Boolean(selectedWord)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-3 transition-all cursor-pointer active:translate-y-1 active:shadow-none ${selectedWord === word
                    ? 'border-slate-900 bg-amber-300 shadow-tactile-md scale-105'
                    : 'border-slate-900 hover:border-slate-950 bg-white hover:bg-amber-100 shadow-tactile hover:-translate-y-1'
                  }`}
              >
                <Sparkles className="w-5 h-5 text-amber-600 mb-1.5 stroke-[2.5]" />
                <span className="text-base font-black text-slate-950 uppercase tracking-wider">
                  {word}
                </span>
                <span className="text-[11px] font-bold text-slate-500 mt-1">
                  {word.length} letters
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Non-drawer waiting animation */
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-200 border-2 border-slate-900 text-slate-950 flex items-center justify-center text-3xl animate-bounce mb-3 shadow-tactile-sm">
              🤔
            </div>
            <p className="text-sm font-black text-slate-950 uppercase tracking-wider">
              Get ready to guess!
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1">
              The drawing board will unlock once {drawerName || 'the drawer'} picks a word.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

