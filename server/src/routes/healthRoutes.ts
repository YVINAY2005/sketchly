import { Router, Request, Response } from 'express';
import { isDbConnected } from '../services/dbService.js';
import { GameManager } from '../game/GameManager.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const gameManager = GameManager.getInstance();
  const stats = gameManager.getStats();

  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      connected: isDbConnected(),
      mode: isDbConnected() ? 'mongodb' : 'in-memory',
    },
    rooms: stats.totalRooms,
    activePlayers: stats.activePlayers,
  });
});

export default router;

