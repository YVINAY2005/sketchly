import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChatMessage,
  GameStateSnapshot,
  GameWinner,
  Player,
  RoomSettings,
  RoundResult,
} from '../../types';
import { socket } from '../../services/socket';
import { sound } from '../../services/audio';
import { LobbyView } from '../lobby/LobbyView';
import { GameView } from '../game/GameView';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AvatarPicker } from '../../components/common/Avatar';
import { Navbar } from '../../components/layout/Navbar';

export const RoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();

  const formattedRoomCode = (roomCode || '').toUpperCase().trim();

  // Stored player profile from localStorage or session
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('sketchly_player_name') || '';
  });
  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem('sketchly_avatar') || '🎨';
  });

  const [playerId, setPlayerId] = useState<string>(() => {
    return sessionStorage.getItem(`sketchly_pid_${formattedRoomCode}`) || '';
  });

  // Prompt for name if user navigated directly via invite URL
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronized Room & Game State
  const [roomSettings, setRoomSettings] = useState<RoomSettings | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [hostId, setHostId] = useState<string>('');
  const [gameState, setGameState] = useState<GameStateSnapshot | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [gameWinner, setGameWinner] = useState<GameWinner | null>(null);

  // Client-interpolated round countdown
  const [roundTimer, setRoundTimer] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  const connectAndJoin = (nameToJoin: string, avatarToJoin: string) => {
    setIsJoining(true);
    setErrorMessage(null);

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      'room:join',
      {
        roomCode: formattedRoomCode,
        playerName: nameToJoin,
        avatar: avatarToJoin,
        playerId: playerId || undefined,
      },
      (res) => {
        setIsJoining(false);
        if (res.success && res.playerId) {
          setPlayerId(res.playerId);
          sessionStorage.setItem(`sketchly_pid_${formattedRoomCode}`, res.playerId);
          localStorage.setItem('sketchly_player_name', nameToJoin);
          localStorage.setItem('sketchly_avatar', avatarToJoin);
          setShowJoinModal(false);
        } else {
          setErrorMessage(res.error || 'Failed to join room.');
        }
      }
    );
  };

  useEffect(() => {
    if (!formattedRoomCode) {
      navigate('/');
      return;
    }

    if (!playerName.trim()) {
      setShowJoinModal(true);
    } else {
      connectAndJoin(playerName, avatar);
    }

    // Socket Event Listeners
    const onRoomState = (payload: {
      roomCode: string;
      settings: RoomSettings;
      players: Player[];
      hostId: string;
      gameState: GameStateSnapshot;
    }) => {
      setRoomSettings(payload.settings);
      setPlayers(payload.players);
      setHostId(payload.hostId);
      setGameState(payload.gameState);
      setRoundTimer(payload.gameState.timeRemaining);
    };

    const onSettingsUpdated = (payload: { settings: RoomSettings }) => {
      setRoomSettings(payload.settings);
    };

    const onRoundStart = (payload: {
      round: number;
      totalRounds: number;
      drawerId: string;
      drawerName: string;
      drawTime: number;
      wordOptions?: string[];
    }) => {
      setRoundResult(null);
      setRoundTimer(15); // 15s word selection timer
      sound.playPop();

      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          phase: 'WORD_SELECTION',
          round: payload.round,
          totalRounds: payload.totalRounds,
          drawerId: payload.drawerId,
          drawerName: payload.drawerName,
          wordChoices: payload.wordOptions || null,
          timeRemaining: 15,
        };
      });
    };

    const onWordChosen = (payload: {
      maskedWord: string;
      wordLength: number;
      category: string;
      drawTime: number;
    }) => {
      setRoundTimer(payload.drawTime);
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          phase: 'DRAWING',
          maskedWord: payload.maskedWord,
          wordLength: payload.wordLength,
          category: payload.category,
          timeRemaining: payload.drawTime,
          wordChoices: null,
        };
      });
    };

    const onPrivateWord = (payload: { word: string }) => {
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          selectedWord: payload.word,
        };
      });
    };

    const onHint = (payload: { maskedWord: string; hintsRevealed: number }) => {
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          maskedWord: payload.maskedWord,
          hintsRevealed: payload.hintsRevealed,
        };
      });
    };

    const onRoundEnd = (result: RoundResult) => {
      setRoundResult(result);
      setRoundTimer(0);
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          phase: 'ROUND_END',
          selectedWord: result.word,
        };
      });
    };

    const onGameOver = (winner: GameWinner) => {
      setGameWinner(winner);
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          phase: 'GAME_OVER',
        };
      });
    };

    const onChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.type === 'correct') {
        sound.playCorrect();
      } else if (msg.type === 'close') {
        sound.playClose();
      }
    };

    const onRoomError = (err: { message: string }) => {
      setErrorMessage(err.message);
    };

    socket.on('room:state', onRoomState);
    socket.on('room:settings_updated', onSettingsUpdated);
    socket.on('game:round_start', onRoundStart);
    socket.on('game:word_chosen', onWordChosen);
    socket.on('game:private_word', onPrivateWord);
    socket.on('game:hint', onHint);
    socket.on('game:round_end', onRoundEnd);
    socket.on('game:over', onGameOver);
    socket.on('chat:message', onChatMessage);
    socket.on('room:error', onRoomError);

    return () => {
      socket.off('room:state', onRoomState);
      socket.off('room:settings_updated', onSettingsUpdated);
      socket.off('game:round_start', onRoundStart);
      socket.off('game:word_chosen', onWordChosen);
      socket.off('game:private_word', onPrivateWord);
      socket.off('game:hint', onHint);
      socket.off('game:round_end', onRoundEnd);
      socket.off('game:over', onGameOver);
      socket.off('chat:message', onChatMessage);
      socket.off('room:error', onRoomError);
    };
  }, [formattedRoomCode]);

  // Client timer interval (smooth 1-second ticks)
  useEffect(() => {
    if (!gameState || gameState.phase === 'LOBBY' || gameState.phase === 'ROUND_END') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setRoundTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        if (prev <= 10 && prev > 1 && gameState.phase === 'DRAWING') {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState?.phase]);

  const handleLeaveRoom = () => {
    socket.emit('room:leave');
    navigate('/');
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    connectAndJoin(playerName.trim(), avatar);
  };

  const isHost = hostId === playerId;

  return (
    <div className="min-h-screen flex flex-col bg-surface-ground">
      <Navbar roomCode={formattedRoomCode} />

      <main className="flex-1 flex flex-col items-center justify-start p-2 sm:p-4">
        {/* Loading state before first state sync */}
        {!gameState && !errorMessage && !showJoinModal && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold">Connecting to room {formattedRoomCode}...</p>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-red-200 shadow-sm text-center my-12 space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✕
            </div>
            <h3 className="text-lg font-bold text-slate-900">Could not join room</h3>
            <p className="text-sm text-slate-600">{errorMessage}</p>
            <Button onClick={() => navigate('/')} variant="primary" className="w-full">
              Back to Home
            </Button>
          </div>
        )}

        {/* Render Lobby View */}
        {gameState && gameState.phase === 'LOBBY' && roomSettings && (
          <LobbyView
            roomCode={formattedRoomCode}
            settings={roomSettings}
            players={players}
            currentUserId={playerId}
            isHost={isHost}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {/* Render Active Game View */}
        {gameState && gameState.phase !== 'LOBBY' && (
          <GameView
            roomCode={formattedRoomCode}
            gameState={gameState}
            players={players}
            currentUserId={playerId}
            isHost={isHost}
            messages={messages}
            roundResult={roundResult}
            gameWinner={gameWinner}
            roundTimer={roundTimer}
            onLeaveRoom={handleLeaveRoom}
          />
        )}
      </main>

      {/* Join Room Details Modal (if user opens invite link directly) */}
      <Modal
        isOpen={showJoinModal}
        showCloseButton={false}
        maxWidth="sm"
        title="Join Sketchly Room"
        description={`Enter your details to join room ${formattedRoomCode}:`}
      >
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <Input
            label="Your Name"
            placeholder="e.g. Picasso"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Choose an Avatar
            </label>
            <AvatarPicker selected={avatar} onSelect={setAvatar} />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isJoining}
            disabled={!playerName.trim()}
            className="w-full"
          >
            Enter Game
          </Button>
        </form>
      </Modal>
    </div>
  );
};

