import React, { useState } from 'react';
import {
  Copy,
  Check,
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
  const [copied, setCopied] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Editable settings draft for host
  const [draftSettings, setDraftSettings] = useState<RoomSettings>(settings);

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    sound.playPop();
    setTimeout(() => setCopied(false), 2000);
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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner: Room Code & Quick Share */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Room Code
          </span>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-3xl sm:text-4xl font-mono font-black tracking-wider text-slate-900">
              {roomCode}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={copyInviteLink}
              icon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied Link!' : 'Copy Link'}
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
              icon={<SettingsIcon className="w-4 h-4 text-slate-600" />}
            >
              Room Settings
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={onLeaveRoom}
            icon={<LogOut className="w-4 h-4 text-slate-500" />}
          >
            Leave
          </Button>
        </div>
      </div>

      {/* Main Grid: Player Roster & Room Settings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Players List (2 cols) */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Players ({players.length}/{settings.maxPlayers})
              </h2>
            </div>
            {players.length < 2 && (
              <span className="text-xs text-amber-600 font-semibold">
                Needs 2+ players to start
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {players.map((p) => {
              const isSelf = p.id === currentUserId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isSelf
                      ? 'bg-brand-50/60 border-brand-200'
                      : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar emoji={p.avatar} size="md" isHost={p.isHost} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {p.name}
                        </p>
                        {isSelf && (
                          <span className="text-[10px] font-bold text-brand-600 bg-brand-100 px-1.5 py-0.2 rounded-md">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.isHost ? (
                          <Badge variant="warning" size="sm">
                            Host
                          </Badge>
                        ) : p.isReady ? (
                          <Badge variant="success" size="sm">
                            Ready
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-slate-400">Waiting</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kick action for host */}
                  {isHost && !p.isHost && (
                    <button
                      type="button"
                      onClick={() => handleKickPlayer(p.id)}
                      className="text-slate-400 hover:text-red-600 text-xs font-semibold p-1.5 rounded-lg hover:bg-red-50 transition-colors"
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
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {isHost ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartGame}
                disabled={!canStart}
                className="w-full sm:w-auto"
                icon={<Play className="w-5 h-5 fill-current" />}
              >
                Start Game
              </Button>
            ) : (
              <Button
                variant={currentUser?.isReady ? 'secondary' : 'primary'}
                size="lg"
                onClick={handleToggleReady}
                className="w-full sm:w-auto"
                icon={<Check className="w-4 h-4" />}
              >
                {currentUser?.isReady ? 'I am Ready (Cancel)' : 'Ready Up!'}
              </Button>
            )}

            {!isHost && (
              <p className="text-xs text-slate-500 italic text-center sm:text-right">
                Waiting for host to start the game...
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Room Settings Summary Card (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
            Match Rules
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Rounds:
              </span>
              <span className="font-bold text-slate-800">{settings.rounds}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Draw time:
              </span>
              <span className="font-bold text-slate-800">{settings.drawTime}s</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Word choices:
              </span>
              <span className="font-bold text-slate-800">{settings.wordCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Hints enabled:
              </span>
              <span className="font-bold text-slate-800">{settings.hints}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Mode:</span>
              <span className="font-bold text-slate-800">{settings.wordMode}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-bold text-slate-800 capitalize">{settings.category}</span>
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

