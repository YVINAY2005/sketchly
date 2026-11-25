import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Sparkles, Users, Globe } from 'lucide-react';
import { PublicRoomSummary } from '@sketchly/shared';
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
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) {
      setError('Please enter a valid room code.');
      return;
    }
    setError(null);
    navigate(`/room/${code}`);
  };

  // Fetch active public rooms from REST API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms/public');
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

  return (
    <div className="min-h-screen flex flex-col bg-surface-ground">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 border border-brand-200 rounded-full text-xs font-semibold text-brand-700">
            <Sparkles className="w-3.5 h-3.5" /> Fast, real-time multiplayer sketching
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Draw something.{' '}
            <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
              Let everyone guess.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
            Create a private room with friends or join open matches. Real-time canvas strokes, instant guessing, and live leaderboards.
          </p>
        </div>

        {/* Profile Card & Action Hub */}
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          {/* Avatar & Display Name */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
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
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Choose an Avatar
              </span>
              <AvatarPicker selected={avatar} onSelect={handleAvatarChange} />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Action CTAs */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <Button
              onClick={handleCreateRoom}
              variant="primary"
              size="lg"
              className="w-full"
              icon={<PlusCircle className="w-5 h-5" />}
            >
              Create New Room
            </Button>

            {/* Quick Join Code Form */}
            <form onSubmit={handleJoinByCode} className="flex gap-2">
              <Input
                placeholder="ROOM CODE (e.g. AB7K92)"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={8}
                className="font-mono uppercase font-bold text-center"
              />
              <Button type="submit" variant="secondary" size="md">
                Join
              </Button>
            </form>
          </div>
        </div>

        {/* Public Rooms Section */}
        {publicRooms.length > 0 && (
          <div className="w-full max-w-md mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-brand-600" /> Active Public Rooms
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {publicRooms.length} online
              </span>
            </div>

            <div className="space-y-2">
              {publicRooms.map((room) => (
                <div
                  key={room.roomCode}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-colors shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {room.roomCode}
                      </span>
                      <span className="text-xs text-slate-500">by {room.hostName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {room.playerCount}/{room.maxPlayers}
                      </span>
                      <span>•</span>
                      <span>Round {room.currentRound}/{room.totalRounds}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
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

        {/* How It Works (3 Simple Steps) */}
        <div className="w-full max-w-2xl mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-white/60 rounded-2xl border border-slate-200/80">
            <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 font-black flex items-center justify-center mx-auto mb-2 text-sm">
              1
            </div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Create a Room
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Invite friends with a short link or unique 6-character room code.
            </p>
          </div>

          <div className="p-4 bg-white/60 rounded-2xl border border-slate-200/80">
            <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 font-black flex items-center justify-center mx-auto mb-2 text-sm">
              2
            </div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Draw Secret Words
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Choose a word and sketch with smooth brush tools while strokes stream live.
            </p>
          </div>

          <div className="p-4 bg-white/60 rounded-2xl border border-slate-200/80">
            <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 font-black flex items-center justify-center mx-auto mb-2 text-sm">
              3
            </div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Race to Guess
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Type guesses in the chat. Fast correct guesses earn maximum points!
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
