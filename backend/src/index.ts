import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

import { ENV, validateEnv } from './config/env';
import connectDB from './config/database';
import { globalErrorHandler } from './middleware/errorHandler';
import routes from './routes';

validateEnv();

const app = express();
const httpServer = createServer(app);

// Socket.IO for real-time alerts
const io = new Server(httpServer, {
  cors: {
    origin: ENV.NODE_ENV === 'development' ? true : ENV.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  socket.on('join-room', (room: string) => socket.join(room));
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: ENV.NODE_ENV === 'development' ? true : ENV.CLIENT_URL,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Attach io to request for use in controllers
app.use((req: any, _res, next) => { req.io = io; next(); });

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: '🚀 DisasterConnect API is running!', timestamp: new Date() });
});

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Centralized Error handler
app.use(globalErrorHandler);

const PORT = ENV.PORT;

const start = async () => {
  await connectDB();
  const server = httpServer.listen(PORT, () => {
  });

  const gracefulShutdown = (signal: string) => {
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

start();
