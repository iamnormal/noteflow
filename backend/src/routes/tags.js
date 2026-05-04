// src/routes/tags.js
import express from 'express';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.*, COUNT(nt.note_id) as note_count FROM tags t
     LEFT JOIN note_tags nt ON nt.tag_id=t.id
     WHERE t.user_id=$1
     GROUP BY t.id ORDER BY t.name`,
    [req.user.id]
  );
  res.json({ tags: rows });
});

router.post('/', async (req, res) => {
  const { name, color = '#10b981', parent_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const { rows } = await pool.query(
    `INSERT INTO tags (user_id, name, color, parent_id) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.id, name.trim(), color, parent_id || null]
  );
  res.status(201).json({ tag: rows[0] });
});

router.patch('/:id', async (req, res) => {
  const { name, color, parent_id } = req.body;
  const { rows } = await pool.query(
    `UPDATE tags SET name=COALESCE($1,name), color=COALESCE($2,color), parent_id=COALESCE($3,parent_id) WHERE id=$4 AND user_id=$5 RETURNING *`,
    [name, color, parent_id, req.params.id, req.user.id]
  );
  res.json({ tag: rows[0] });
});

router.delete('/:id', async (req, res) => {
  await pool.query(`DELETE FROM tags WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  res.json({ message: 'Tag deleted' });
});

export default router;
