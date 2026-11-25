import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ENV } from './config/env.js';
import { connectDB } from './services/dbService.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import healthRoutes from './routes/healthRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// CORS configuration for both Express and Socket.IO
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    if (ENV.isDev || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    if (origin === ENV.CLIENT_URL) {
      return callback(null, true);
    }
    // Allow vercel / render preview deployments
    if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api/rooms', roomRoutes);

// Serve static frontend in production if built
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Root route fallback if client not bundled locally
  app.get('/', (_req, res) => {
    res.send({
      name: 'Sketchly Game Server',
      status: 'online',
      version: '1.0.0',
      documentation: '/api/health',
    });
  });
}

// Socket.IO Server initialization
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

setupSocketHandlers(io);

// Start server
async function bootstrap() {
  await connectDB();

  httpServer.listen(ENV.PORT, () => {
    console.log(`
  🎨 ============================================
  🎨   SKETCHLY GAME SERVER RUNNING
  🎨   Port:    http://localhost:${ENV.PORT}
  🎨   Health:  http://localhost:${ENV.PORT}/api/health
  🎨   Mode:    ${ENV.NODE_ENV}
  🎨 ============================================
    `);
  });
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal error during bootstrap:', err);
  process.exit(1);
});

export { app, httpServer, io };
