import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import { RoomSettings, WordMode } from '../../types';
import { WORD_CATEGORIES } from '../../constants/game';
import { Button } from '../../components/common/Button';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { socket } from '../../services/socket';

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();

  const playerName = localStorage.getItem('sketchly_player_name') || 'Host';
  const avatar = localStorage.getItem('sketchly_avatar') || '🎨';

  const [maxPlayers, setMaxPlayers] = useState(8);
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(75);
  const [wordCount, setWordCount] = useState(3);
  const [hints, setHints] = useState(2);
  const [wordMode, setWordMode] = useState<WordMode>('Normal');
  const [category, setCategory] = useState<string>('all');
  const [isPublic, setIsPublic] = useState(false);
  const [customWordsText, setCustomWordsText] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!socket.connected) {
      socket.connect();
    }

    const customWords = customWordsText
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    const settings: Partial<RoomSettings> = {
      maxPlayers,
      rounds,
      drawTime,
      wordCount,
      hints,
      wordMode,
      category,
      isPublic,
      customWords,
    };

    socket.emit(
      'room:create',
      {
        hostName: playerName,
        avatar,
        settings,
      },
      (res) => {
        setIsLoading(false);
        if (res.success && res.roomCode) {
          if (res.playerId) {
            sessionStorage.setItem(`sketchly_pid_${res.roomCode}`, res.playerId);
          }
          navigate(`/room/${res.roomCode}`);
        } else {
          setError(res.error || 'Failed to create room.');
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 hover:text-amber-300 mb-6 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> Back to Home
        </Link>

        <div className="bg-white rounded-3xl border-3 border-slate-900 p-6 sm:p-8 shadow-tactile-lg space-y-6 animate-pop-in">
          <div className="border-b-2 border-slate-900/10 pb-4">
            <h1 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2.5">
              <SettingsIcon className="w-6 h-6 text-amber-600 stroke-[2.5]" /> Match Settings
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
              Configure your game parameters before launching the lobby.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-100 border-2 border-slate-900 text-xs text-rose-950 font-black shadow-tactile-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 font-bold">
            {/* Max Players Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                <span>Player Limit</span>
                <span className="font-mono font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg border border-slate-900">{maxPlayers} players</span>
              </div>
              <input
                type="range"
                min={2}
                max={20}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] font-bold text-slate-500 mt-1">
                <span>2 min</span>
                <span>20 max</span>
              </div>
            </div>

            {/* Rounds Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                <span>Total Rounds</span>
                <span className="font-mono font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg border border-slate-900">{rounds} rounds</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] font-bold text-slate-500 mt-1">
                <span>2 rounds</span>
                <span>10 rounds</span>
              </div>
            </div>

            {/* Draw Time Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                <span>Draw Time per Turn</span>
                <span className="font-mono font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg border border-slate-900">{drawTime} seconds</span>
              </div>
              <input
                type="range"
                min={15}
                max={240}
                step={5}
                value={drawTime}
                onChange={(e) => setDrawTime(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] font-bold text-slate-500 mt-1">
                <span>15s fast</span>
                <span>240s extended</span>
              </div>
            </div>

            {/* Word choices & Hints Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                  Word Choices ({wordCount})
                </label>
                <select
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full rounded-xl border-2 border-slate-900 px-3 py-2 text-sm font-bold text-slate-900 bg-white shadow-tactile-sm"
                >
                  <option value={1}>1 word</option>
                  <option value={2}>2 words</option>
                  <option value={3}>3 words (Standard)</option>
                  <option value={4}>4 words</option>
                  <option value={5}>5 words</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                  Hints ({hints})
                </label>
                <select
                  value={hints}
                  onChange={(e) => setHints(Number(e.target.value))}
                  className="w-full rounded-xl border-2 border-slate-900 px-3 py-2 text-sm font-bold text-slate-900 bg-white shadow-tactile-sm"
                >
                  <option value={0}>0 (Disabled)</option>
                  <option value={1}>1 hint</option>
                  <option value={2}>2 hints (Standard)</option>
                  <option value={3}>3 hints</option>
                  <option value={4}>4 hints</option>
                  <option value={5}>5 hints</option>
                </select>
              </div>
            </div>

            {/* Word Mode & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                  Word Mode
                </label>
                <select
                  value={wordMode}
                  onChange={(e) => setWordMode(e.target.value as WordMode)}
                  className="w-full rounded-xl border-2 border-slate-900 px-3 py-2 text-sm font-bold text-slate-900 bg-white shadow-tactile-sm"
                >
                  <option value="Normal">Normal</option>
                  <option value="Hidden">Hidden (Masked)</option>
                  <option value="Combination">Combination</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                  Word Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-900 px-3 py-2 text-sm font-bold text-slate-900 bg-white capitalize shadow-tactile-sm"
                >
                  {WORD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="capitalize">
                      {cat === 'all' ? 'All Categories (250+)' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Public vs Private toggle */}
            <div className="flex items-center justify-between p-3.5 bg-amber-50/70 rounded-2xl border-2 border-slate-900 shadow-tactile-sm">
              <div>
                <p className="text-xs font-black text-slate-950 uppercase tracking-wider">Public Room</p>
                <p className="text-[11px] font-bold text-slate-600">
                  Allow other players to find and join this room from the home page
                </p>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 rounded-md border-2 border-slate-900 cursor-pointer accent-amber-500"
              />
            </div>

            {/* Custom Words */}
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                Custom Words (Optional)
              </label>
              <textarea
                value={customWordsText}
                onChange={(e) => setCustomWordsText(e.target.value)}
                placeholder="dragon, spacesuit, rollercoaster (separated by commas)"
                rows={2}
                className="w-full rounded-xl border-2 border-slate-900 p-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-amber-500 shadow-tactile-sm"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full text-base py-4 font-black shadow-tactile-md"
            >
              CREATE ROOM & OPEN LOBBY
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};
