// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT id, email, display_name, avatar_url, plan, theme, font_family, editor_width, ai_provider, sidebar_collapsed, openai_api_key, anthropic_api_key FROM users WHERE id=$1', [decoded.userId]);
    if (!rows.length) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
