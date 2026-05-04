// src/db/migrate.js
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const schema = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  plan VARCHAR(50) DEFAULT 'free',
  theme VARCHAR(20) DEFAULT 'light',
  font_family VARCHAR(100) DEFAULT 'Inter',
  editor_width VARCHAR(20) DEFAULT 'medium',
  openai_api_key TEXT,
  anthropic_api_key TEXT,
  ai_provider VARCHAR(50) DEFAULT 'openai',
  sidebar_collapsed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  icon VARCHAR(10) DEFAULT '📁',
  color VARCHAR(20) DEFAULT '#10b981',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  color VARCHAR(20) DEFAULT '#10b981',
  icon VARCHAR(10) DEFAULT '📓',
  is_default BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#10b981',
  parent_id UUID REFERENCES tags(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notebook_id UUID REFERENCES notebooks(id) ON DELETE SET NULL,
  title VARCHAR(500) DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  content_text TEXT DEFAULT '',
  pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  word_count INTEGER DEFAULT 0,
  ai_summary TEXT,
  source_url TEXT,
  thumbnail_url TEXT,
  reminder_at TIMESTAMPTZ,
  reminder_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);
CREATE TABLE IF NOT EXISTS note_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  content TEXT,
  title VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo',
  priority VARCHAR(20) DEFAULT 'none',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  position INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(200),
  size_bytes INTEGER,
  url TEXT,
  thumbnail_url TEXT,
  ocr_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT DEFAULT '',
  category VARCHAR(100) DEFAULT 'general',
  is_system BOOLEAN DEFAULT false,
  icon VARCHAR(10) DEFAULT '📝',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key VARCHAR(200) NOT NULL,
  value TEXT,
  PRIMARY KEY (user_id, key)
);
CREATE INDEX IF NOT EXISTS notes_search_idx ON notes USING gin(
  to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(content_text,''))
);
CREATE INDEX IF NOT EXISTS notes_user_idx ON notes(user_id, is_deleted, created_at DESC);
CREATE INDEX IF NOT EXISTS tasks_user_idx ON tasks(user_id, status, due_date);
`;

async function seedTemplates(client) {
  const existing = await client.query('SELECT id FROM templates WHERE is_system = true LIMIT 1');
  if (existing.rows.length > 0) return;
  const templates = [
    { title: 'Meeting Notes', category: 'work', icon: '📅', description: 'Structured meeting notes', content: '<h2>Meeting Notes</h2><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><h3>Agenda</h3><ul><li></li></ul><h3>Discussion</h3><p></p><h3>Action Items</h3><ul><li></li></ul>' },
    { title: 'Weekly Review', category: 'personal', icon: '📊', description: 'Weekly reflection and planning', content: '<h2>Weekly Review</h2><p><strong>Week of:</strong> </p><h3>Accomplishments</h3><ul><li></li></ul><h3>Challenges</h3><ul><li></li></ul><h3>Next Week</h3><ul><li></li></ul>' },
    { title: 'Project Plan', category: 'work', icon: '🗂️', description: 'Project planning', content: '<h2>Project Plan</h2><p><strong>Project:</strong> </p><p><strong>Deadline:</strong> </p><h3>Objectives</h3><ul><li></li></ul><h3>Milestones</h3><ul><li></li></ul>' },
    { title: 'Daily Journal', category: 'personal', icon: '📔', description: 'Daily journaling', content: '<h2>Daily Journal</h2><p><strong>Date:</strong> </p><h3>Morning Intentions</h3><p></p><h3>Highlights</h3><ul><li></li></ul><h3>Gratitude</h3><ul><li></li></ul>' },
    { title: 'Research Notes', category: 'study', icon: '🔬', description: 'Research and study notes', content: '<h2>Research Notes</h2><p><strong>Topic:</strong> </p><h3>Key Findings</h3><ul><li></li></ul><h3>Questions</h3><ul><li></li></ul><h3>Summary</h3><p></p>' },
    { title: 'Travel Itinerary', category: 'personal', icon: '✈️', description: 'Trip planning', content: '<h2>Travel Itinerary</h2><p><strong>Destination:</strong> </p><p><strong>Dates:</strong> </p><h3>Day 1</h3><ul><li></li></ul><h3>Packing List</h3><ul><li></li></ul>' },
    { title: 'Bug Report', category: 'dev', icon: '🐛', description: 'Software bug report', content: '<h2>Bug Report</h2><p><strong>Title:</strong> </p><h3>Steps to Reproduce</h3><ol><li></li></ol><h3>Expected</h3><p></p><h3>Actual</h3><p></p>' },
    { title: 'Book Notes', category: 'study', icon: '📚', description: 'Reading notes', content: '<h2>Book Notes</h2><p><strong>Title:</strong> </p><p><strong>Author:</strong> </p><h3>Key Ideas</h3><ul><li></li></ul><h3>Quotes</h3><blockquote></blockquote><h3>Summary</h3><p></p>' },
  ];
  for (const t of templates) {
    await client.query(
      'INSERT INTO templates (title, category, icon, description, content, is_system) VALUES ($1,$2,$3,$4,$5,true) ON CONFLICT DO NOTHING',
      [t.title, t.category, t.icon, t.description, t.content]
    );
  }
  console.log('✅ System templates seeded');
}

// ── Exported: called automatically by index.js on every startup ───────────────
export async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const client = await pool.connect();
  try {
    console.log('🔄 Running migrations...');
    await client.query(schema);
    await seedTemplates(client);
    console.log('✅ Migrations complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// ── Standalone: called by `npm run db:migrate` (local use) ────────────────────
const isMain = process.argv[1] && process.argv[1].endsWith('migrate.js');
if (isMain) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}