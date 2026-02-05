import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { configurePassport } from './config/passport.js';
import { initializeDatabase, getDataDir } from './models/database.js';
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/business.js';
import receiptRoutes from './routes/receipt.js';
import dashboardRoutes from './routes/dashboard.js';
import exportRoutes from './routes/export.js';
import userRoutes from './routes/user.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 업로드 경로: 프로덕션에서는 DATA_DIR/uploads, 개발에서는 프로젝트 내 uploads 폴더
export function getUploadsDir(): string {
  const dataDir = process.env.DATA_DIR;
  if (dataDir) {
    const uploadsDir = path.join(dataDir, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    return uploadsDir;
  }
  return path.join(__dirname, '../uploads');
}

const app = express();
const PORT = process.env.PORT || 3001;

async function startServer() {
  // Initialize database
  await initializeDatabase();

  // Configure Passport
  configurePassport();

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === 'production', // trust proxy in production
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Trust proxy for production (Render, etc.)
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Static files for uploaded images
  const uploadsDir = getUploadsDir();
  app.use('/uploads', express.static(uploadsDir));
  console.log(`Uploads directory: ${uploadsDir}`);

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/businesses', businessRoutes);
  app.use('/api/receipts', receiptRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/users', userRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling middleware
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

export default app;
