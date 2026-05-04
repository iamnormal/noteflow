// src/routes/templates.js
import express from 'express';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { category } = req.query;
  let q = `SELECT * FROM templates WHERE (user_id=$1 OR is_system=true)`;
  const params = [req.user.id];
  if (category) { q += ` AND category=$2`; params.push(category); }
  q += ` ORDER BY is_system DESC, created_at DESC`;
  const { rows } = await pool.query(q, params);
  res.json({ templates: rows });
});

router.post('/', async (req, res) => {
  const { title, description, content, category = 'general', icon = '📝' } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO templates (user_id, title, description, content, category, icon) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, title, description, content, category, icon]
  );
  res.status(201).json({ template: rows[0] });
});

router.patch('/:id', async (req, res) => {
  const { title, description, content, category, icon } = req.body;
  const { rows } = await pool.query(
    `UPDATE templates SET title=COALESCE($1,title), description=COALESCE($2,description), content=COALESCE($3,content), category=COALESCE($4,category), icon=COALESCE($5,icon), updated_at=NOW() WHERE id=$6 AND user_id=$7 AND is_system=false RETURNING *`,
    [title, description, content, category, icon, req.params.id, req.user.id]
  );
  res.json({ template: rows[0] });
});

router.delete('/:id', async (req, res) => {
  await pool.query(`DELETE FROM templates WHERE id=$1 AND user_id=$2 AND is_system=false`, [req.params.id, req.user.id]);
  res.json({ message: 'Template deleted' });
});

export default router;
