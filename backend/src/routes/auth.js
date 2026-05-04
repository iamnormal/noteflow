// src/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Register
router.post('/register', async (req, res) => {
  const { email, password, display_name } = req.body;
  if (!email || !password || !display_name) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const client = await pool.connect();
  try {
    const exists = await client.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await client.query(
      `INSERT INTO users (email, password_hash, display_name) VALUES ($1,$2,$3) RETURNING id, email, display_name, plan, theme, font_family, editor_width, ai_provider`,
      [email.toLowerCase(), password_hash, display_name]
    );
    const user = rows[0];

    // Create default notebook
    await client.query(
      `INSERT INTO notebooks (user_id, title, is_default, icon) VALUES ($1,'My Notes',true,'📓')`,
      [user.id]
    );

    const token = signToken(user.id);
    res.status(201).json({ token, user });
  } finally {
    client.release();
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
  if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user.id);
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// Get me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Update profile
router.patch('/me', authenticate, async (req, res) => {
  const { display_name, avatar_url, theme, font_family, editor_width, ai_provider, openai_api_key, anthropic_api_key, sidebar_collapsed } = req.body;
  const { rows } = await pool.query(
    `UPDATE users SET
      display_name = COALESCE($1, display_name),
      avatar_url = COALESCE($2, avatar_url),
      theme = COALESCE($3, theme),
      font_family = COALESCE($4, font_family),
      editor_width = COALESCE($5, editor_width),
      ai_provider = COALESCE($6, ai_provider),
      openai_api_key = COALESCE($7, openai_api_key),
      anthropic_api_key = COALESCE($8, anthropic_api_key),
      sidebar_collapsed = COALESCE($9, sidebar_collapsed),
      updated_at = NOW()
    WHERE id=$10
    RETURNING id, email, display_name, avatar_url, plan, theme, font_family, editor_width, ai_provider, sidebar_collapsed`,
    [display_name, avatar_url, theme, font_family, editor_width, ai_provider, openai_api_key, anthropic_api_key, sidebar_collapsed, req.user.id]
  );
  res.json({ user: rows[0] });
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both fields required' });
  if (new_password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
  const valid = await bcrypt.compare(current_password, rows[0].password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

  const hash = await bcrypt.hash(new_password, 12);
  await pool.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, req.user.id]);
  res.json({ message: 'Password updated' });
});

export default router;
