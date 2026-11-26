import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { AvatarPicker, Avatar } from '../../components/common/Avatar';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState(() => localStorage.getItem('sketchly_player_name') || '');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('sketchly_avatar') || '🎨');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a display name.');
      return;
    }
    let cleanCode = roomCode.trim().toUpperCase();
    if (cleanCode.includes('/ROOM/')) {
      cleanCode = cleanCode.split('/ROOM/').pop()?.split(/[?#/]/)[0].trim().toUpperCase() || cleanCode;
    }
    if (!cleanCode) {
      setError('Please enter a valid room code.');
      return;
    }

    localStorage.setItem('sketchly_player_name', name.trim());
    localStorage.setItem('sketchly_avatar', avatar);

    navigate(`/room/${cleanCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 hover:text-amber-300 mb-6 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> Back to Home
        </Link>

        <div className="bg-white rounded-3xl border-3 border-slate-900 p-6 sm:p-8 shadow-tactile-lg space-y-5 animate-pop-in">
          <div className="border-b-2 border-slate-900/10 pb-3">
            <h1 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <LogIn className="w-5 h-5 text-amber-600 stroke-[2.5]" /> Join a Game
            </h1>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              Enter the 6-character room code to jump straight into the match.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-100 border-2 border-slate-900 text-xs text-rose-950 font-black shadow-tactile-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Room Code"
              placeholder="e.g. AB7K92"
              value={roomCode}
              onChange={(e) => {
                let val = e.target.value.trim().toUpperCase();
                if (val.includes('/ROOM/')) {
                  val = val.split('/ROOM/').pop()?.split(/[?#/]/)[0].trim().toUpperCase() || val;
                }
                setRoomCode(val.slice(0, 10));
              }}
              maxLength={200}
              className="font-mono text-center font-bold tracking-widest uppercase text-base"
              required
              autoFocus
            />

            <div className="flex items-center gap-3">
              <Avatar emoji={avatar} size="md" />
              <div className="flex-1">
                <Input
                  label="Your Display Name"
                  placeholder="e.g. Picasso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  required
                />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Choose an Avatar
              </span>
              <AvatarPicker selected={avatar} onSelect={setAvatar} />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full font-black text-base py-3.5 shadow-tactile-md">
              JOIN GAME
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

