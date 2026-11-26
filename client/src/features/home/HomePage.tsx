import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Sparkles, Users, Globe } from 'lucide-react';
import { PublicRoomSummary } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { AvatarPicker, Avatar } from '../../components/common/Avatar';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState(() => localStorage.getItem('sketchly_player_name') || '');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('sketchly_avatar') || '🎨');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const saveProfile = (newName: string, newAvatar: string) => {
    localStorage.setItem('sketchly_player_name', newName);
    localStorage.setItem('sketchly_avatar', newAvatar);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    saveProfile(val, avatar);
  };

  const handleAvatarChange = (val: string) => {
    setAvatar(val);
    saveProfile(name, val);
  };

  const handleCreateRoom = () => {
    if (!name.trim()) {
      setError('Please enter a display name first.');
      return;
    }
    setError(null);
    navigate('/create');
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a display name first.');
      return;
    }
    let code = roomCodeInput.trim().toUpperCase();
    if (code.includes('/ROOM/')) {
      code = code.split('/ROOM/').pop()?.split(/[?#/]/)[0].trim().toUpperCase() || code;
    }
    if (!code) {
      setError('Please enter a valid room code.');
      return;
    }
    setError(null);
    navigate(`/room/${code}`);
  };

  const handleRoomCodeChange = (raw: string) => {
    let val = raw.trim().toUpperCase();
    if (val.includes('/ROOM/')) {
      val = val.split('/ROOM/').pop()?.split(/[?#/]/)[0].trim().toUpperCase() || val;
    }
    setRoomCodeInput(val.slice(0, 10));
  };

  // Fetch active public rooms from REST API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const serverUrl = import.meta.env.VITE_SERVER_URL || '';
        const res = await fetch(`${serverUrl}/api/rooms/public`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setPublicRooms(data.rooms);
          }
        }
      } catch (err) {
        // Fallback silently if offline or initial load
      }
    };

    fetchRooms();
  }, []);

  const handleRandomizeAvatar = () => {
    const avatars = ['🎨', '🦊', '🚀', '🐱', '🐶', '🦁', '🐼', '🍕', '⚡', '💎', '👾', '🦄', '🥑', '🍩', '🎸', '⭐'];
    const random = avatars[Math.floor(Math.random() * avatars.length)];
    handleAvatarChange(random);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
        {/* Game Hero Title */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-400/20 border-2 border-amber-400 rounded-full text-xs font-black text-amber-300 shadow-tactile-sm">
            <Sparkles className="w-4 h-4 text-amber-400" /> MULTIPLAYER DRAWING & GUESSING
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase drop-shadow-[0_4px_0_#050814]">
            Sketch. Guess.{' '}
            <span className="text-amber-400 drop-shadow-[0_4px_0_#78350f]">
              Win!
            </span>
          </h1>
          <p className="text-sm sm:text-base font-bold text-slate-300 max-w-md mx-auto">
            Grab your friends, sketch secret words, race to guess in live chat, and conquer the podium!
          </p>
        </div>

        {/* Profile Card & Action Hub */}
        <div className="w-full max-w-md bg-white rounded-3xl border-3 border-slate-900 p-6 sm:p-7 shadow-tactile-lg space-y-5 animate-pop-in">
          {/* Avatar & Display Name */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-amber-50/80 p-3 rounded-2xl border-2 border-slate-900 shadow-tactile-sm">
              <Avatar emoji={avatar} size="lg" />
              <div className="flex-1">
                <Input
                  label="Your Player Name"
                  placeholder="e.g. Leonardo"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  maxLength={20}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  Choose Your Character
                </span>
                <button
                  type="button"
                  onClick={handleRandomizeAvatar}
                  className="text-xs font-black text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer hover:underline"
                >
                  Random 🎲
                </button>
              </div>
              <AvatarPicker selected={avatar} onSelect={handleAvatarChange} />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-100 border-2 border-slate-900 text-xs text-rose-900 font-extrabold shadow-tactile-sm">
              {error}
            </div>
          )}

          {/* Action CTAs */}
          <div className="space-y-3 pt-3 border-t-2 border-slate-900/10">
            <Button
              onClick={handleCreateRoom}
              variant="primary"
              size="lg"
              className="w-full text-base py-4 font-black shadow-tactile hover:-translate-y-1"
              icon={<PlusCircle className="w-5 h-5 stroke-[2.5]" />}
            >
              CREATE A NEW ROOM
            </Button>

            {/* Quick Join Code Form */}
            <form onSubmit={handleJoinByCode} className="flex gap-2">
              <Input
                placeholder="ENTER 6-CHAR CODE"
                value={roomCodeInput}
                onChange={(e) => handleRoomCodeChange(e.target.value)}
                maxLength={200}
                className="font-mono uppercase font-black text-center text-base tracking-widest"
              />
              <Button type="submit" variant="secondary" size="md" className="shrink-0 px-5">
                JOIN
              </Button>
            </form>
          </div>
        </div>

        {/* Public Rooms Section */}
        {publicRooms.length > 0 && (
          <div className="w-full max-w-md mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-amber-400" /> Active Public Rooms
              </h3>
              <span className="text-xs font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/50 font-mono">
                {publicRooms.length} online
              </span>
            </div>

            <div className="space-y-2.5">
              {publicRooms.map((room) => (
                <div
                  key={room.roomCode}
                  className="p-3.5 bg-[#0f172a]/90 rounded-2xl border-2 border-slate-700 flex items-center justify-between shadow-tactile-sm hover:-translate-y-0.5 transition-all text-white"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-400 text-base">
                        {room.roomCode}
                      </span>
                      <span className="text-xs font-bold text-slate-300">by {room.hostName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {room.playerCount}/{room.maxPlayers} players
                      </span>
                      <span>•</span>
                      <span>Round {room.currentRound}/{room.totalRounds}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (!name.trim()) {
                        setError('Please enter a display name first.');
                        return;
                      }
                      navigate(`/room/${room.roomCode}`);
                    }}
                  >
                    Join
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How It Works (3 Tactile Game Steps) */}
        <div className="w-full max-w-3xl mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-[#0f172a]/85 rounded-2xl border-2 border-slate-700/80 shadow-tactile-sm text-white backdrop-blur-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-400 border-2 border-slate-950 text-slate-950 font-black flex items-center justify-center mx-auto mb-2 text-base shadow-tactile-sm">
              🎨
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              1. Draw Fast
            </h4>
            <p className="text-xs font-bold text-slate-300 mt-1">
              Pick your secret word and sketch it live with vibrant brushes and tools.
            </p>
          </div>

          <div className="p-4 bg-[#0f172a]/85 rounded-2xl border-2 border-slate-700/80 shadow-tactile-sm text-white backdrop-blur-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-400 border-2 border-slate-950 text-slate-950 font-black flex items-center justify-center mx-auto mb-2 text-base shadow-tactile-sm">
              💬
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              2. Guess in Chat
            </h4>
            <p className="text-xs font-bold text-slate-300 mt-1">
              Watch strokes appear in real-time. Type your guesses fast to earn maximum points!
            </p>
          </div>

          <div className="p-4 bg-[#0f172a]/85 rounded-2xl border-2 border-slate-700/80 shadow-tactile-sm text-white backdrop-blur-xs">
            <div className="w-9 h-9 rounded-xl bg-rose-400 border-2 border-slate-950 text-slate-950 font-black flex items-center justify-center mx-auto mb-2 text-base shadow-tactile-sm">
              🏆
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              3. Win the Crown
            </h4>
            <p className="text-xs font-bold text-slate-300 mt-1">
              Rotate turns, uncover hints, outsmart your friends, and stand on the podium!
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
