import React, { useState } from 'react';
import {
  ChatMessage,
  GameStateSnapshot,
  GameWinner,
  Player,
  RoundResult,
} from '@sketchly/shared';
import { GameHeader } from './GameHeader';
import { DrawingCanvas } from './DrawingCanvas';
import { DrawingToolbar } from './DrawingToolbar';
import { PlayerSidebar } from './PlayerSidebar';
import { ChatPanel } from './ChatPanel';
import { WordSelectionModal } from './WordSelectionModal';
import { RoundEndModal } from './RoundEndModal';
import { GameOverModal } from './GameOverModal';

export interface GameViewProps {
  roomCode?: string;
  gameState: GameStateSnapshot;
  players: Player[];
  currentUserId: string;
  isHost: boolean;
  messages: ChatMessage[];
  roundResult: RoundResult | null;
  gameWinner: GameWinner | null;
  roundTimer: number;
  onLeaveRoom: () => void;
}

export const GameView: React.FC<GameViewProps> = ({
  gameState,
  players,
  currentUserId,
  isHost,
  messages,
  roundResult,
  gameWinner,
  roundTimer,
  onLeaveRoom,
}) => {
  // Drawing tool state
  const [color, setColor] = useState<string>('#000000');
  const [size, setSize] = useState<number>(5);
  const [isEraser, setIsEraser] = useState<boolean>(false);

  const isDrawer = gameState.drawerId === currentUserId;
  const currentUser = players.find((p) => p.id === currentUserId);
  const hasGuessed = currentUser?.hasGuessedCorrectly ?? false;
  const drawerPlayer = players.find((p) => p.id === gameState.drawerId);

  return (
    <div className="flex flex-col gap-3 w-full max-w-7xl mx-auto px-2 sm:px-4 py-2">
      {/* Top Bar: Round & Timer & Hint */}
      <GameHeader
        gameState={gameState}
        isDrawer={isDrawer}
        drawerName={drawerPlayer?.name}
        roundTimer={roundTimer}
      />

      {/* Main Gameplay Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* Left Sidebar: Players & Scores (2 cols on large screen) */}
        <div className="order-2 lg:order-1 lg:col-span-3 h-[240px] lg:h-[560px]">
          <PlayerSidebar
            players={players}
            currentDrawerId={gameState.drawerId}
            currentUserId={currentUserId}
          />
        </div>

        {/* Center: Canvas & Drawing Toolbar (6 cols on large screen) */}
        <div className="order-1 lg:order-2 lg:col-span-6 flex flex-col gap-2.5">
          <div className="h-[360px] sm:h-[480px] lg:h-[500px] w-full">
            <DrawingCanvas
              isDrawer={isDrawer && gameState.phase === 'DRAWING'}
              currentColor={color}
              currentSize={size}
              isEraser={isEraser}
            />
          </div>

          {/* Drawer Toolbar (Only visible & active for drawer during DRAWING phase) */}
          {isDrawer && gameState.phase === 'DRAWING' && (
            <DrawingToolbar
              color={color}
              size={size}
              isEraser={isEraser}
              onColorChange={setColor}
              onSizeChange={setSize}
              onEraserToggle={setIsEraser}
            />
          )}
        </div>

        {/* Right Sidebar: Chat & Guessing (3 cols on large screen) */}
        <div className="order-3 lg:order-3 lg:col-span-3 h-[340px] lg:h-[560px]">
          <ChatPanel
            messages={messages}
            isDrawer={isDrawer}
            hasGuessed={hasGuessed}
            isDrawingPhase={gameState.phase === 'DRAWING'}
          />
        </div>
      </div>

      {/* Word Selection Modal */}
      <WordSelectionModal
        isOpen={gameState.phase === 'WORD_SELECTION'}
        isDrawer={isDrawer}
        drawerName={drawerPlayer?.name}
        wordChoices={gameState.wordChoices}
        timeRemaining={roundTimer}
      />

      {/* Round End Modal */}
      <RoundEndModal
        isOpen={gameState.phase === 'ROUND_END'}
        result={roundResult}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={gameState.phase === 'GAME_OVER'}
        winnerData={gameWinner}
        isHost={isHost}
        onLeave={onLeaveRoom}
      />
    </div>
  );
};
