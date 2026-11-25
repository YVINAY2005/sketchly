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
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a valid room code.');
      return;
    }

    localStorage.setItem('sketchly_player_name', name.trim());
    localStorage.setItem('sketchly_avatar', avatar);

    navigate(`/room/${cleanCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-ground">
      <Navbar />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <LogIn className="w-5 h-5 text-brand-600" /> Join a Room
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter the 6-character room code shared by your friend.
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Room Code"
              placeholder="e.g. AB7K92"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={8}
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

            <Button type="submit" variant="primary" size="lg" className="w-full">
              Join Game
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

