// src/routes/notes.js
import express from 'express';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// List notes
router.get('/', async (req, res) => {
  const { notebook_id, tag_id, search, pinned, deleted, sort = 'updated_at', order = 'DESC', limit = 50, offset = 0 } = req.query;
  const userId = req.user.id;

  let conditions = ['n.user_id=$1', 'n.is_deleted=$2'];
  let params = [userId, deleted === 'true'];
  let idx = 3;

  if (notebook_id) { conditions.push(`n.notebook_id=$${idx++}`); params.push(notebook_id); }
  if (pinned === 'true') { conditions.push(`n.pinned=true`); }
  if (search) {
    conditions.push(`(to_tsvector('english', COALESCE(n.title,'') || ' ' || COALESCE(n.content_text,'')) @@ plainto_tsquery('english', $${idx}) OR n.title ILIKE $${idx+1})`);
    params.push(search, `%${search}%`);
    idx += 2;
  }

  let tagJoin = '';
  if (tag_id) {
    tagJoin = `JOIN note_tags nt ON nt.note_id=n.id AND nt.tag_id=$${idx}`;
    params.push(tag_id); idx++;
  }

  const validSorts = ['updated_at', 'created_at', 'title'];
  const sortCol = validSorts.includes(sort) ? sort : 'updated_at';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

  params.push(parseInt(limit), parseInt(offset));

  const query = `
    SELECT n.id, n.title, n.content_text, n.pinned, n.word_count, n.ai_summary,
           n.notebook_id, n.created_at, n.updated_at, n.reminder_at, n.reminder_done,
           nb.title as notebook_title, nb.color as notebook_color, nb.icon as notebook_icon,
           COALESCE(
             json_agg(DISTINCT jsonb_build_object('id',t.id,'name',t.name,'color',t.color)) FILTER (WHERE t.id IS NOT NULL),
             '[]'
           ) as tags
    FROM notes n
    LEFT JOIN notebooks nb ON nb.id=n.notebook_id
    LEFT JOIN note_tags nt2 ON nt2.note_id=n.id
    LEFT JOIN tags t ON t.id=nt2.tag_id
    ${tagJoin}
    WHERE ${conditions.join(' AND ')}
    GROUP BY n.id, nb.title, nb.color, nb.icon
    ORDER BY n.pinned DESC, n.${sortCol} ${sortOrder}
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  const { rows } = await pool.query(query, params);
  const count = await pool.query(`SELECT COUNT(*) FROM notes n WHERE n.user_id=$1 AND n.is_deleted=$2`, [userId, deleted === 'true']);
  res.json({ notes: rows, total: parseInt(count.rows[0].count) });
});

// Get single note
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT n.*, nb.title as notebook_title, nb.color as notebook_color,
     COALESCE(json_agg(DISTINCT jsonb_build_object('id',t.id,'name',t.name,'color',t.color)) FILTER (WHERE t.id IS NOT NULL),'[]') as tags,
     COALESCE(json_agg(DISTINCT jsonb_build_object('id',a.id,'filename',a.filename,'original_name',a.original_name,'mime_type',a.mime_type,'size_bytes',a.size_bytes,'url',a.url,'thumbnail_url',a.thumbnail_url)) FILTER (WHERE a.id IS NOT NULL),'[]') as attachments
     FROM notes n
     LEFT JOIN notebooks nb ON nb.id=n.notebook_id
     LEFT JOIN note_tags nt ON nt.note_id=n.id
     LEFT JOIN tags t ON t.id=nt.tag_id
     LEFT JOIN attachments a ON a.note_id=n.id
     WHERE n.id=$1 AND n.user_id=$2
     GROUP BY n.id, nb.title, nb.color`,
    [req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Note not found' });
  res.json({ note: rows[0] });
});

// Create note
router.post('/', async (req, res) => {
  const { title = 'Untitled', content = '', notebook_id, tag_ids = [], pinned = false } = req.body;
  const content_text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const word_count = content_text.split(/\s+/).filter(Boolean).length;

  const client = await pool.connect();
  try {
    // Get default notebook if none provided
    let nbId = notebook_id;
    if (!nbId) {
      const nb = await client.query(`SELECT id FROM notebooks WHERE user_id=$1 AND is_default=true LIMIT 1`, [req.user.id]);
      nbId = nb.rows[0]?.id;
    }

    const { rows } = await client.query(
      `INSERT INTO notes (user_id, notebook_id, title, content, content_text, word_count, pinned)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, nbId, title, content, content_text, word_count, pinned]
    );
    const note = rows[0];

    if (tag_ids.length) {
      const tagValues = tag_ids.map((tid, i) => `($1,$${i+2})`).join(',');
      await client.query(`INSERT INTO note_tags (note_id, tag_id) VALUES ${tagValues} ON CONFLICT DO NOTHING`, [note.id, ...tag_ids]);
    }

    res.status(201).json({ note });
  } finally {
    client.release();
  }
});

// Update note
router.patch('/:id', async (req, res) => {
  const { title, content, notebook_id, pinned, tag_ids, reminder_at, reminder_done, ai_summary } = req.body;

  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT * FROM notes WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Note not found' });

    // Save version before update
    await client.query(
      `INSERT INTO note_versions (note_id, content, title) VALUES ($1,$2,$3)`,
      [req.params.id, existing.rows[0].content, existing.rows[0].title]
    );
    // Keep only 50 versions
    await client.query(
      `DELETE FROM note_versions WHERE note_id=$1 AND id NOT IN (SELECT id FROM note_versions WHERE note_id=$1 ORDER BY created_at DESC LIMIT 50)`,
      [req.params.id]
    );

    let content_text, word_count;
    if (content !== undefined) {
      content_text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      word_count = content_text.split(/\s+/).filter(Boolean).length;
    }

    const { rows } = await client.query(
      `UPDATE notes SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        content_text = COALESCE($3, content_text),
        word_count = COALESCE($4, word_count),
        notebook_id = COALESCE($5, notebook_id),
        pinned = COALESCE($6, pinned),
        reminder_at = COALESCE($7, reminder_at),
        reminder_done = COALESCE($8, reminder_done),
        ai_summary = COALESCE($9, ai_summary),
        updated_at = NOW()
      WHERE id=$10 AND user_id=$11 RETURNING *`,
      [title, content, content_text, word_count, notebook_id, pinned, reminder_at, reminder_done, ai_summary, req.params.id, req.user.id]
    );

    if (tag_ids !== undefined) {
      await client.query('DELETE FROM note_tags WHERE note_id=$1', [req.params.id]);
      if (tag_ids.length) {
        const tagValues = tag_ids.map((tid, i) => `($1,$${i+2})`).join(',');
        await client.query(`INSERT INTO note_tags (note_id, tag_id) VALUES ${tagValues} ON CONFLICT DO NOTHING`, [req.params.id, ...tag_ids]);
      }
    }

    res.json({ note: rows[0] });
  } finally {
    client.release();
  }
});

// Soft delete / restore
router.delete('/:id', async (req, res) => {
  await pool.query(
    `UPDATE notes SET is_deleted=true, deleted_at=NOW(), updated_at=NOW() WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.user.id]
  );
  res.json({ message: 'Moved to trash' });
});

router.post('/:id/restore', async (req, res) => {
  await pool.query(
    `UPDATE notes SET is_deleted=false, deleted_at=NULL, updated_at=NOW() WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.user.id]
  );
  res.json({ message: 'Restored' });
});

router.delete('/:id/permanent', async (req, res) => {
  await pool.query('DELETE FROM notes WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Permanently deleted' });
});

// Note versions
router.get('/:id/versions', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, title, created_at FROM note_versions WHERE note_id=$1 ORDER BY created_at DESC LIMIT 50`,
    [req.params.id]
  );
  res.json({ versions: rows });
});

router.get('/:id/versions/:vid', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM note_versions WHERE id=$1 AND note_id=$2`,
    [req.params.vid, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Version not found' });
  res.json({ version: rows[0] });
});

export default router;
