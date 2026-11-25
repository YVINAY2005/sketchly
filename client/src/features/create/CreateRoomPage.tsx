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
          navigate(`/room/${res.roomCode}`);
        } else {
          setError(res.error || 'Failed to create room.');
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-ground">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-brand-600" /> Room Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Configure your game parameters. You can also adjust these in the lobby.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Max Players Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <span>Player Limit</span>
                <span className="font-mono text-brand-600">{maxPlayers} players</span>
              </div>
              <input
                type="range"
                min={2}
                max={20}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>2 min</span>
                <span>20 max</span>
              </div>
            </div>

            {/* Rounds Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <span>Total Rounds</span>
                <span className="font-mono text-brand-600">{rounds} rounds</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>2 rounds</span>
                <span>10 rounds</span>
              </div>
            </div>

            {/* Draw Time Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <span>Draw Time per Turn</span>
                <span className="font-mono text-brand-600">{drawTime} seconds</span>
              </div>
              <input
                type="range"
                min={15}
                max={240}
                step={5}
                value={drawTime}
                onChange={(e) => setDrawTime(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>15s fast</span>
                <span>240s extended</span>
              </div>
            </div>

            {/* Word choices & Hints Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Word Choices ({wordCount})
                </label>
                <select
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
                >
                  <option value={1}>1 word</option>
                  <option value={2}>2 words</option>
                  <option value={3}>3 words (Standard)</option>
                  <option value={4}>4 words</option>
                  <option value={5}>5 words</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hints ({hints})
                </label>
                <select
                  value={hints}
                  onChange={(e) => setHints(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Word Mode
                </label>
                <select
                  value={wordMode}
                  onChange={(e) => setWordMode(e.target.value as WordMode)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
                >
                  <option value="Normal">Normal</option>
                  <option value="Hidden">Hidden (Masked)</option>
                  <option value="Combination">Combination</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Word Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white capitalize"
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
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-800">Public Room</p>
                <p className="text-[11px] text-slate-500">
                  Allow other players to find and join this room from the home page
                </p>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer accent-brand-600"
              />
            </div>

            {/* Custom Words */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Custom Words (Optional)
              </label>
              <textarea
                value={customWordsText}
                onChange={(e) => setCustomWordsText(e.target.value)}
                placeholder="dragon, spacesuit, rollercoaster (separated by commas)"
                rows={2}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Create Room & Open Lobby
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};
