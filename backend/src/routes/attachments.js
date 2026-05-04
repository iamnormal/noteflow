// src/routes/attachments.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => cb(null, true)
});

const router = express.Router();
router.use(authenticate);

router.post('/upload', upload.array('files', 10), async (req, res) => {
  const { note_id } = req.body;
  if (!note_id) return res.status(400).json({ error: 'note_id required' });

  const attachments = [];
  for (const file of req.files) {
    const url = `/api/attachments/file/${file.filename}`;
    const { rows } = await pool.query(
      `INSERT INTO attachments (note_id, user_id, filename, original_name, mime_type, size_bytes, url)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [note_id, req.user.id, file.filename, file.originalname, file.mimetype, file.size, url]
    );
    attachments.push(rows[0]);
  }
  res.json({ attachments });
});

// Serve files
router.get('/file/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.sendFile(filePath);
});

router.delete('/:id', async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM attachments WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const filePath = path.join(uploadDir, rows[0].filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await pool.query(`DELETE FROM attachments WHERE id=$1`, [req.params.id]);
  res.json({ message: 'Deleted' });
});

export default router;
