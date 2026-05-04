// src/routes/notebooks.js
import express from 'express';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// List notebooks
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT nb.*, COUNT(n.id) FILTER (WHERE NOT n.is_deleted) as note_count
     FROM notebooks nb
     LEFT JOIN notes n ON n.notebook_id=nb.id
     WHERE nb.user_id=$1
     GROUP BY nb.id
     ORDER BY nb.is_default DESC, nb.position, nb.title`,
    [req.user.id]
  );
  res.json({ notebooks: rows });
});

router.post('/', async (req, res) => {
  const { title, color = '#10b981', icon = '📓', space_id } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const { rows } = await pool.query(
    `INSERT INTO notebooks (user_id, title, color, icon, space_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.id, title, color, icon, space_id || null]
  );
  res.status(201).json({ notebook: rows[0] });
});

router.patch('/:id', async (req, res) => {
  const { title, color, icon, space_id } = req.body;
  const { rows } = await pool.query(
    `UPDATE notebooks SET title=COALESCE($1,title), color=COALESCE($2,color), icon=COALESCE($3,icon), space_id=COALESCE($4,space_id), updated_at=NOW() WHERE id=$5 AND user_id=$6 RETURNING *`,
    [title, color, icon, space_id, req.params.id, req.user.id]
  );
  res.json({ notebook: rows[0] });
});

router.delete('/:id', async (req, res) => {
  // Move notes to default notebook
  const defaultNb = await pool.query(`SELECT id FROM notebooks WHERE user_id=$1 AND is_default=true LIMIT 1`, [req.user.id]);
  if (defaultNb.rows.length) {
    await pool.query(`UPDATE notes SET notebook_id=$1 WHERE notebook_id=$2 AND user_id=$3`, [defaultNb.rows[0].id, req.params.id, req.user.id]);
  }
  await pool.query(`DELETE FROM notebooks WHERE id=$1 AND user_id=$2 AND is_default=false`, [req.params.id, req.user.id]);
  res.json({ message: 'Notebook deleted' });
});

export default router;
