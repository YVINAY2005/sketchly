import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, VolumeX, HelpCircle, Palette } from 'lucide-react';
import { sound } from '../../services/audio';
import { Modal } from '../common/Modal';

export interface NavbarProps {
  roomCode?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ roomCode }) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-lg text-slate-900 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-tactile">
              <Palette className="w-4 h-4" />
            </div>
            <span className="tracking-tight text-xl font-extrabold bg-gradient-to-r from-slate-950 via-slate-900 to-brand-700 bg-clip-text text-transparent">
              Sketchly
            </span>
          </Link>

          {/* Room code badge if in room */}
          {roomCode && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ROOM: {roomCode}
            </div>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHowToPlay(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="How to play"
              aria-label="How to play"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <button
              onClick={toggleSound}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
              aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-red-500" />
              ) : (
                <Volume2 className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* How To Play Modal */}
      <Modal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        title="How to play Sketchly"
        maxWidth="md"
      >
        <div className="space-y-4 text-sm text-slate-600">
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Take turns drawing</h4>
              <p className="mt-0.5">
                Each round, one player is chosen as the drawer and picks a secret word.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Guess the secret word</h4>
              <p className="mt-0.5">
                Everyone else watches the canvas live and types guesses in the chat box.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Earn points & win!</h4>
              <p className="mt-0.5">
                The faster you guess, the more points you get. Drawers earn bonus points when other players guess their artwork.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

