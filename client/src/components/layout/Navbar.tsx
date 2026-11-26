import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, VolumeX, HelpCircle, Palette, Copy, Check } from 'lucide-react';
import { sound } from '../../services/audio';
import { Modal } from '../common/Modal';

export interface NavbarProps {
  roomCode?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ roomCode }) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    sound.playPop();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b-2 border-slate-950 bg-[#0c1222]/95 backdrop-blur-md shadow-tactile-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-transform active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-tactile-sm">
              <Palette className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="tracking-tight text-2xl font-black text-white drop-shadow-[0_2px_0_#050814]">
                Sketchly
              </span>
              <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-400 border border-slate-950 text-slate-950 shadow-tactile-sm">
                GAME
              </span>
            </div>
          </Link>

          {/* Room code badge if in room */}
          {roomCode && (
            <button
              type="button"
              onClick={copyCode}
              title="Click to copy room code"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#16203a] hover:bg-[#1e2c50] rounded-xl border-2 border-slate-950 text-xs font-mono font-black text-white shadow-tactile-sm transition-all cursor-pointer group active:translate-y-0.5"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-slate-950" />
              <span>ROOM: {roomCode}</span>
              {copiedCode ? (
                <span className="text-[11px] text-emerald-300 font-sans font-black flex items-center gap-0.5 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500">
                  <Check className="w-3 h-3 stroke-[3]" /> Copied!
                </span>
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
              )}
            </button>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHowToPlay(true)}
              className="p-2 rounded-xl border-2 border-slate-950 bg-[#16203a] hover:bg-[#1e2c50] text-slate-200 hover:text-white shadow-tactile-sm active:translate-y-0.5 transition-all cursor-pointer"
              title="How to play"
              aria-label="How to play"
            >
              <HelpCircle className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={toggleSound}
              className="p-2 rounded-xl border-2 border-slate-950 bg-[#16203a] hover:bg-[#1e2c50] text-slate-200 hover:text-white shadow-tactile-sm active:translate-y-0.5 transition-all cursor-pointer"
              title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
              aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400 stroke-[2.5]" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400 stroke-[2.5]" />
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

