import { Router, Request, Response } from 'express';
import { GameManager } from '../game/GameManager.js';
import { GameSessionModel } from '../models/GameSessionModel.js';
import { isDbConnected } from '../services/dbService.js';

const router = Router();

// GET /api/rooms/public
router.get('/public', (_req: Request, res: Response) => {
  const gameManager = GameManager.getInstance();
  const rooms = gameManager.getPublicRooms();
  res.json({ success: true, rooms });
});

// GET /api/rooms/:roomCode
router.get('/:roomCode', (req: Request, res: Response): void => {
  const gameManager = GameManager.getInstance();
  const room = gameManager.getRoom(req.params.roomCode);

  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' });
    return;
  }

  res.json({
    success: true,
    room: room.getSummary(),
  });
});

// GET /api/rooms/:roomCode/history
router.get('/:roomCode/history', async (req: Request, res: Response): Promise<void> => {
  if (!isDbConnected()) {
    res.json({ success: true, history: [] });
    return;
  }

  try {
    const history = await GameSessionModel.find({
      roomCode: req.params.roomCode.toUpperCase().trim(),
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ success: true, history });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: 'Failed to query match history' });
  }
});

export default router;
