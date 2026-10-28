import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { db } from './server/db.js';

import authRoutes from './server/routes/authRoutes.js';
import employeeRoutes from './server/routes/employeeRoutes.js';
import attendanceRoutes from './server/routes/attendanceRoutes.js';
import leaveRoutes from './server/routes/leaveRoutes.js';
import announcementRoutes from './server/routes/announcementRoutes.js';
import notificationRoutes from './server/routes/notificationRoutes.js';
import trainingRoutes from './server/routes/trainingRoutes.js';
import reportRoutes from './server/routes/reportRoutes.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure embedded database is initialized
db.init();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Rate limiter for authentication attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});
app.use('/api/auth/login', authLimiter);

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'StaffSync HRMS Backend',
    version: '1.0.0',
    mode: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString()
  });
});

// Demo Data Reseed Endpoint
app.post('/api/seed', (_req: Request, res: Response) => {
  db.resetAndSeed();
  res.json({
    success: true,
    message: 'StaffSync database successfully reseeded with standard demonstration accounts and records.'
  });
});

// Mount Modular API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/reports', reportRoutes);

// Centralized API Error Handler
app.use('/api', (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

async function startServer() {
  if (!isProduction) {
    // Mount Vite in middleware mode for hot development
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StaffSync HRMS] Server running on http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode.`);
  });
}

startServer().catch(err => {
  console.error('[StaffSync HRMS] Server startup failure:', err);
  process.exit(1);
});
