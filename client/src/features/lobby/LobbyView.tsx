import React, { useState } from 'react';
import {
  Copy,
  Check,
  Link2,
  Play,
  Settings as SettingsIcon,
  LogOut,
  Users,
  Clock,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { Player, RoomSettings } from '../../types';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { socket } from '../../services/socket';
import { sound } from '../../services/audio';

export interface LobbyViewProps {
  roomCode: string;
  settings: RoomSettings;
  players: Player[];
  currentUserId: string;
  isHost: boolean;
  onLeaveRoom: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomCode,
  settings,
  players,
  currentUserId,
  isHost,
  onLeaveRoom,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Editable settings draft for host
  const [draftSettings, setDraftSettings] = useState<RoomSettings>(settings);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    sound.playPop();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    sound.playPop();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartGame = () => {
    sound.playPop();
    socket.emit('game:start');
  };

  const handleToggleReady = () => {
    sound.playPop();
    socket.emit('room:toggle_ready');
  };

  const handleKickPlayer = (targetId: string) => {
    if (window.confirm('Kick this player from the room?')) {
      socket.emit('room:kick_player', { playerId: targetId });
    }
  };

  const handleSaveSettings = () => {
    socket.emit('room:update_settings', { settings: draftSettings });
    setShowSettingsModal(false);
  };

  const currentUser = players.find((p) => p.id === currentUserId);
  const canStart = players.length >= 2;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-pop-in">
      {/* Top Banner: Room Code & Quick Share */}
      <div className="bg-white rounded-3xl border-3 border-slate-900 p-5 sm:p-6 shadow-tactile-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-1">
            🎮 ROOM PASSCODE
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-1.5 bg-amber-100 border-2 border-slate-900 rounded-2xl shadow-tactile-sm">
              <h1 className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-slate-950 select-all">
                {roomCode}
              </h1>
            </div>

            {/* Separate Button: Copy Code */}
            <Button
              variant="outline"
              size="sm"
              onClick={copyRoomCode}
              icon={copiedCode ? <Check className="w-4 h-4 text-emerald-700 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              className={copiedCode ? 'bg-emerald-100 border-slate-900 text-emerald-950 font-black' : 'font-extrabold'}
              title="Copy 6-character room code only"
            >
              {copiedCode ? 'CODE COPIED!' : 'COPY CODE'}
            </Button>

            {/* Separate Button: Copy Link */}
            <Button
              variant="outline"
              size="sm"
              onClick={copyInviteLink}
              icon={copiedLink ? <Check className="w-4 h-4 text-emerald-700 stroke-[3]" /> : <Link2 className="w-4 h-4" />}
              className={copiedLink ? 'bg-emerald-100 border-slate-900 text-emerald-950 font-black' : 'font-extrabold'}
              title="Copy full invite link with URL"
            >
              {copiedLink ? 'LINK COPIED!' : 'COPY LINK'}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <Button
              variant="secondary"
              onClick={() => {
                setDraftSettings(settings);
                setShowSettingsModal(true);
              }}
              icon={<SettingsIcon className="w-4 h-4 text-slate-900 stroke-[2.5]" />}
            >
              RULES
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={onLeaveRoom}
            icon={<LogOut className="w-4 h-4 text-slate-600 stroke-[2.5]" />}
          >
            Leave
          </Button>
        </div>
      </div>

      {/* Main Grid: Player Roster & Room Settings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Players List (2 cols) */}
        <div className="md:col-span-2 bg-white rounded-3xl border-3 border-slate-900 p-5 sm:p-6 shadow-tactile-lg space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-900/10 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600 stroke-[2.5]" />
              <h2 className="text-base font-black text-slate-950 uppercase tracking-wider">
                Players in Lobby ({players.length}/{settings.maxPlayers})
              </h2>
            </div>
            {players.length < 2 && (
              <span className="text-xs text-amber-900 bg-amber-100 border border-slate-900 px-2 py-0.5 rounded-lg font-black">
                Needs 2+ players
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p) => {
              const isSelf = p.id === currentUserId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 border-slate-900 shadow-tactile-sm transition-all ${
                    isSelf
                      ? 'bg-amber-100/80 ring-2 ring-amber-400'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar emoji={p.avatar} size="md" isHost={p.isHost} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-black text-slate-950 truncate">
                          {p.name}
                        </p>
                        {isSelf && (
                          <span className="text-[10px] font-black text-slate-900 bg-amber-300 border border-slate-900 px-1.5 py-0.2 rounded-md">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.isHost ? (
                          <Badge variant="warning" size="sm">
                            Host 👑
                          </Badge>
                        ) : p.isReady ? (
                          <Badge variant="success" size="sm">
                            Ready ✓
                          </Badge>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400">Waiting...</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kick action for host */}
                  {isHost && !p.isHost && (
                    <button
                      type="button"
                      onClick={() => handleKickPlayer(p.id)}
                      className="text-slate-500 hover:text-rose-700 text-xs font-black p-1.5 rounded-lg hover:bg-rose-50 border border-transparent hover:border-slate-900 transition-all cursor-pointer"
                      title="Kick player"
                    >
                      Kick
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t-2 border-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            {isHost ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartGame}
                disabled={!canStart}
                className="w-full sm:w-auto text-base px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black"
                icon={<Play className="w-5 h-5 fill-current" />}
              >
                START GAME
              </Button>
            ) : (
              <Button
                variant={currentUser?.isReady ? 'secondary' : 'primary'}
                size="lg"
                onClick={handleToggleReady}
                className={`w-full sm:w-auto font-black ${
                  currentUser?.isReady ? '' : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                }`}
                icon={<Check className="w-5 h-5 stroke-[3]" />}
              >
                {currentUser?.isReady ? 'READY (CANCEL)' : 'READY UP!'}
              </Button>
            )}

            {!isHost && (
              <p className="text-xs font-bold text-slate-600 italic text-center sm:text-right">
                Waiting for host to start the game...
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Room Settings Summary Card (1 col) */}
        <div className="bg-white rounded-3xl border-3 border-slate-900 p-5 sm:p-6 shadow-tactile-lg space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-slate-900/10 pb-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 stroke-[2.5]" />
            <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">
              Match Rules
            </h3>
          </div>

          <div className="space-y-2.5 text-xs font-bold">
            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-slate-900/20">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-800" /> Rounds:
              </span>
              <span className="font-mono font-black text-slate-900">{settings.rounds}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-slate-900/20">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-800" /> Draw Time:
              </span>
              <span className="font-mono font-black text-slate-900">{settings.drawTime}s</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-slate-900/20">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-800" /> Word Choices:
              </span>
              <span className="font-mono font-black text-slate-900">{settings.wordCount}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-slate-900/20">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-800" /> Hints:
              </span>
              <span className="font-mono font-black text-slate-900">{settings.hints}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-slate-900/20">
              <span className="text-slate-600">Mode:</span>
              <span className="font-black text-slate-900">{settings.wordMode}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-slate-900/20">
              <span className="text-slate-600">Category:</span>
              <span className="font-black text-slate-900 capitalize">{settings.category}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Host Settings Modal */}
      {isHost && (
        <Modal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title="Room Configuration"
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Rounds ({draftSettings.rounds})
              </label>
              <input
                type="range"
                min={2}
                max={10}
                value={draftSettings.rounds}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, rounds: Number(e.target.value) })
                }
                className="w-full accent-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Draw Time ({draftSettings.drawTime} seconds)
              </label>
              <input
                type="range"
                min={20}
                max={180}
                step={5}
                value={draftSettings.drawTime}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, drawTime: Number(e.target.value) })
                }
                className="w-full accent-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Word Choices ({draftSettings.wordCount})
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={draftSettings.wordCount}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, wordCount: Number(e.target.value) })
                }
                className="w-full accent-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hints ({draftSettings.hints})
              </label>
              <input
                type="range"
                min={0}
                max={5}
                value={draftSettings.hints}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, hints: Number(e.target.value) })
                }
                className="w-full accent-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Word Mode
              </label>
              <select
                value={draftSettings.wordMode}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, wordMode: e.target.value as any })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
              >
                <option value="Normal">Normal (Hints with letter count)</option>
                <option value="Hidden">Hidden (Blank question marks)</option>
                <option value="Combination">Combination</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowSettingsModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveSettings}>
                Apply Settings
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

