// src/routes/search.js
import express from 'express';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json({ notes: [], tasks: [] });

  const userId = req.user.id;
  const search = q.trim();

  const [notesResult, tasksResult] = await Promise.all([
    pool.query(
      `SELECT n.id, n.title, n.content_text, n.updated_at, n.notebook_id,
              nb.title as notebook_title, nb.icon as notebook_icon
       FROM notes n
       LEFT JOIN notebooks nb ON nb.id=n.notebook_id
       WHERE n.user_id=$1 AND n.is_deleted=false
       AND (to_tsvector('english', COALESCE(n.title,'') || ' ' || COALESCE(n.content_text,'')) @@ plainto_tsquery('english', $2)
            OR n.title ILIKE $3)
       ORDER BY ts_rank(to_tsvector('english', COALESCE(n.title,'') || ' ' || COALESCE(n.content_text,'')), plainto_tsquery('english', $2)) DESC
       LIMIT 10`,
      [userId, search, `%${search}%`]
    ),
    pool.query(
      `SELECT id, title, status, priority, due_date FROM tasks WHERE user_id=$1 AND is_deleted=false AND title ILIKE $2 LIMIT 5`,
      [userId, `%${search}%`]
    )
  ]);

  res.json({ notes: notesResult.rows, tasks: tasksResult.rows });
});

export default router;
