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

        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-1000 ease-linear rounded-full"
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
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                  selectedWord === word
                    ? 'border-brand-600 bg-brand-50 shadow-md scale-102'
                    : 'border-slate-200 hover:border-brand-400 bg-white hover:bg-slate-50 shadow-tactile'
                }`}
              >
                <Sparkles className="w-5 h-5 text-brand-600 mb-1.5" />
                <span className="text-base font-extrabold text-slate-900 capitalize tracking-wide">
                  {word}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1">
                  {word.length} letters
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Non-drawer waiting animation */
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-2xl animate-bounce mb-3 shadow-sm">
              🤔
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Get ready to guess!
            </p>
            <p className="text-xs text-slate-400 mt-1">
              The drawing canvas will unlock once the word is chosen.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
