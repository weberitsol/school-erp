import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Load environment variables
dotenv.config();

// Import Redis
import { redis } from './config/redis';
import { initializeSocketIO } from './config/socket.config';

// Import routes
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import teacherRoutes from './routes/teacher.routes';
import parentRoutes from './routes/parent.routes';
import classRoutes from './routes/class.routes';
import attendanceRoutes from './routes/attendance.routes';
import examRoutes from './routes/exam.routes';
import feeRoutes from './routes/fee.routes';
import announcementRoutes from './routes/announcement.routes';
import dashboardRoutes from './routes/dashboard.routes';
import documentRoutes from './routes/document.routes';
import questionRoutes from './routes/question.routes';
import testRoutes from './routes/test.routes';
import subjectRoutes from './routes/subject.routes';
import patternRoutes from './routes/pattern.routes';
import chapterRoutes from './routes/chapter.routes';
import resultRoutes from './routes/result.routes';
import reportsRoutes from './routes/reports.routes';
import bookRoutes from './routes/book.routes';

// Admin Master Data Routes
import branchRoutes from './routes/branch.routes';
import tagRoutes from './routes/tag.routes';
import assessmentReasonRoutes from './routes/assessment-reason.routes';
import taskRoutes from './routes/task.routes';
import transferRoutes from './routes/transfer.routes';

// Finance Routes
import invoiceRoutes from './routes/invoice.routes';

// Practice MCQ Routes
import practiceRoutes from './routes/practice.routes';

// Test Upload Routes (Word file parsing)
import testUploadRoutes from './routes/test-upload.routes';

// YouTube Video Learning Routes
import videoRoutes from './routes/video.routes';

// Study Planner Routes
import studyPlannerRoutes from './routes/study-planner.routes';

// Transportation Routes
import transportationRoutes from './routes/transportation.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/notFound.middleware';

// Import GPS controller for Socket.IO initialization
import { setSocketIOInstance } from './controllers/gps-tracking.controller';

const app: Application = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to load from different origins (frontend)
}));
app.use(cors({
  origin: [
    process.env.WEB_ADMIN_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    process.env.MOBILE_APP_URL || 'exp://localhost:19000',
  ],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check - main endpoint with all services
app.get('/health', async (req: Request, res: Response) => {
  const redisHealth = await redis.healthCheck();

  const overallStatus = redisHealth.status === 'connected' ? 'ok' : 'degraded';

  res.status(200).json({
    success: true,
    data: {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {
        redis: redisHealth.status,
      },
    },
  });
});

// Redis-specific health check
app.get('/health/redis', async (req: Request, res: Response) => {
  const health = await redis.healthCheck();

  const statusCode = health.status === 'connected' ? 200 : 503;

  res.status(statusCode).json({
    success: health.status === 'connected',
    data: {
      status: health.status,
      latencyMs: health.latencyMs,
      memoryUsage: health.memoryUsage,
      uptime: health.uptime,
    },
    error: health.error,
  });
});

// API Routes
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/students`, studentRoutes);
app.use(`${API_PREFIX}/teachers`, teacherRoutes);
app.use(`${API_PREFIX}/parents`, parentRoutes);
app.use(`${API_PREFIX}/classes`, classRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/exams`, examRoutes);
app.use(`${API_PREFIX}/fees`, feeRoutes);
app.use(`${API_PREFIX}/announcements`, announcementRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/documents`, documentRoutes);
app.use(`${API_PREFIX}/questions`, questionRoutes);
app.use(`${API_PREFIX}/tests`, testRoutes);
app.use(`${API_PREFIX}/subjects`, subjectRoutes);
app.use(`${API_PREFIX}/patterns`, patternRoutes);
app.use(`${API_PREFIX}/chapters`, chapterRoutes);
app.use(`${API_PREFIX}/results`, resultRoutes);
app.use(`${API_PREFIX}/reports`, reportsRoutes);
app.use(`${API_PREFIX}/books`, bookRoutes);

// Admin Master Data Routes
app.use(`${API_PREFIX}/branches`, branchRoutes);
app.use(`${API_PREFIX}/tags`, tagRoutes);
app.use(`${API_PREFIX}/assessment-reasons`, assessmentReasonRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/transfers`, transferRoutes);

// Finance Routes
app.use(`${API_PREFIX}/invoices`, invoiceRoutes);

// Practice MCQ Routes
app.use(`${API_PREFIX}/practice`, practiceRoutes);

// Test Upload Routes (Word file parsing)
app.use(`${API_PREFIX}/tests/upload`, testUploadRoutes);

// YouTube Video Learning Routes
app.use(`${API_PREFIX}/videos`, videoRoutes);

// Study Planner Routes
app.use(`${API_PREFIX}/study-planner`, studyPlannerRoutes);

// Transportation Routes
app.use(`${API_PREFIX}/transportation`, transportationRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server with Redis initialization and Socket.IO
const PORT = process.env.PORT || 5000;

let io: SocketIOServer;

const startServer = async () => {
  // Initialize Redis connection in background (graceful degradation if unavailable)
  // Fire and forget - don't block server startup
  setImmediate(async () => {
    try {
      await redis.connect();
    } catch (err) {
      console.warn('Background Redis connection error:', err);
    }
  });

  // Create HTTP server (required for Socket.IO)
  const httpServer = createServer(app);

  // Initialize Socket.IO
  io = initializeSocketIO(httpServer);

  // Pass Socket.IO instance to GPS controller for broadcasting
  setSocketIOInstance(io);

  httpServer.listen(PORT, () => {
    const redisStatus = redis.isConnected() ? '✅ Connected' : '⚠️ Degraded (unavailable)';
    console.log(`
  🚀 Server is running!
  📡 Environment: ${process.env.NODE_ENV}
  🔗 http://localhost:${PORT}
  📚 API: http://localhost:${PORT}${API_PREFIX}
  🔴 Redis: ${redisStatus}
  📡 WebSocket: ws://localhost:${PORT}/socket.io
  🚌 Transport Namespace: ws://localhost:${PORT}/transport
    `);
  });

  return httpServer;
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  if (io) {
    console.log('Disconnecting WebSocket clients...');
    io.of('/transport').disconnectSockets();
  }

  await redis.disconnect();
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
export { io };
