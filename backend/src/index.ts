import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth';
import resumeRoutes from './routes/resumes';
import jobRoutes from './routes/jobs';
import applicationRoutes from './routes/applications';
import candidateRoutes from './routes/candidates';
import extraRoutes from './routes/extras';
import { initTelegramBot } from './services/telegramBot';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Telegram Bot (if token provided in .env)
initTelegramBot();

// Enable CORS for all frontend clients
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded files statically
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

import { syncDataToMongo } from './services/mongoSync';

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/job_recruiter_db';
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 3000,
  })
  .then(async () => {
    console.log('📦 Connected to MongoDB successfully.');
    await syncDataToMongo();
  })
  .catch((err) => {
    console.log('⚡ MongoDB local server not active, using resilient high-performance persistent store (data/store.json).');
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/extras', extraRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    platform: 'Naukri AI Job Recruiter Platform',
    version: '2.0.0',
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 JobWallah Server running on http://localhost:${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another running process.`);
    console.log(`💡 Tip: Run 'npx kill-port ${PORT}' or close the other terminal running the server.`);
  } else {
    console.error('Server error:', err);
  }
});

export default app;
