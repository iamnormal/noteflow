// src/index.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from './db/migrate.js';

dotenv.config();

import authRouter from './routes/auth.js';
import notesRouter from './routes/notes.js';
import notebooksRouter from './routes/notebooks.js';
import tagsRouter from './routes/tags.js';
import tasksRouter from './routes/tasks.js';
import aiRouter from './routes/ai.js';
import templatesRouter from './routes/templates.js';
import attachmentsRouter from './routes/attachments.js';
import searchRouter from './routes/search.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Security & middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:3000',
  ],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/notes', notesRouter);
app.use('/api/notebooks', notebooksRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/ai', aiRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/attachments', attachmentsRouter);
app.use('/api/search', searchRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Serve uploads statically in dev
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start: run migrations first, then listen ─────────────────────────────────
async function start() {
  try {
    await runMigrations();          // ← auto-creates all tables on every deploy
    app.listen(PORT, () => {
      console.log(`🚀 NoteFlow API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('💥 Failed to start server:', err.message);
    process.exit(1);
  }
}

start();