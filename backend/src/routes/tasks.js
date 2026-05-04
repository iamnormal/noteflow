// src/routes/tasks.js
import express from 'express';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { status, priority, note_id, sort = 'due_date', order = 'ASC', overdue } = req.query;
  let conditions = ['t.user_id=$1', 't.is_deleted=false', 't.parent_id IS NULL'];
  let params = [req.user.id];
  let idx = 2;

  if (status) { conditions.push(`t.status=$${idx++}`); params.push(status); }
  if (priority) { conditions.push(`t.priority=$${idx++}`); params.push(priority); }
  if (note_id) { conditions.push(`t.note_id=$${idx++}`); params.push(note_id); }
  if (overdue === 'true') { conditions.push(`t.due_date < NOW() AND t.status != 'done'`); }

  const { rows } = await pool.query(
    `SELECT t.*,
      n.title as note_title,
      COALESCE(json_agg(sub.*) FILTER (WHERE sub.id IS NOT NULL), '[]') as subtasks
     FROM tasks t
     LEFT JOIN notes n ON n.id=t.note_id
     LEFT JOIN tasks sub ON sub.parent_id=t.id AND sub.is_deleted=false
     WHERE ${conditions.join(' AND ')}
     GROUP BY t.id, n.title
     ORDER BY t.status='done', NULLIF(t.due_date, NULL) NULLS LAST, t.created_at DESC`,
    params
  );
  res.json({ tasks: rows });
});

router.post('/', async (req, res) => {
  const { title, description, status = 'todo', priority = 'none', due_date, note_id, parent_id } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const { rows } = await pool.query(
    `INSERT INTO tasks (user_id, note_id, parent_id, title, description, status, priority, due_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.id, note_id || null, parent_id || null, title, description, status, priority, due_date || null]
  );
  res.status(201).json({ task: rows[0] });
});

router.patch('/:id', async (req, res) => {
  const { title, description, status, priority, due_date, note_id } = req.body;
  const completed_at = status === 'done' ? new Date().toISOString() : null;
  const { rows } = await pool.query(
    `UPDATE tasks SET
      title=COALESCE($1,title), description=COALESCE($2,description), status=COALESCE($3,status),
      priority=COALESCE($4,priority), due_date=COALESCE($5,due_date), note_id=COALESCE($6,note_id),
      completed_at=CASE WHEN $3='done' THEN NOW() WHEN $3='todo' OR $3='in_progress' THEN NULL ELSE completed_at END,
      updated_at=NOW()
     WHERE id=$7 AND user_id=$8 RETURNING *`,
    [title, description, status, priority, due_date, note_id, req.params.id, req.user.id]
  );
  res.json({ task: rows[0] });
});

// Bulk update
router.patch('/bulk', async (req, res) => {
  const { ids, updates } = req.body;
  if (!ids?.length) return res.status(400).json({ error: 'ids required' });
  const { status, priority, due_date } = updates;
  const placeholders = ids.map((_, i) => `$${i+4}`).join(',');
  const { rows } = await pool.query(
    `UPDATE tasks SET
      status=COALESCE($1,status), priority=COALESCE($2,priority), due_date=COALESCE($3,due_date), updated_at=NOW()
     WHERE id IN (${placeholders}) AND user_id=$${ids.length+4} RETURNING *`,
    [status, priority, due_date, ...ids, req.user.id]
  );
  res.json({ tasks: rows });
});

router.delete('/:id', async (req, res) => {
  await pool.query(`UPDATE tasks SET is_deleted=true WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  res.json({ message: 'Task deleted' });
});

export default router;
