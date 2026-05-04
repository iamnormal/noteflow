# 🟢 NoteFlow — Evernote Clone

A full-stack, self-hostable personal knowledge management app.
Rich text editor · Tasks · Tags · Notebooks · AI assistant · Dark mode · Templates

---

## ✨ Features

| Feature | Details |
|---|---|
| **Rich Editor** | TipTap editor: headings, lists, tasks, tables, code blocks, images, highlights, links |
| **Notes** | Create, edit, pin, tag, move between notebooks. Version history (50 versions). |
| **Notebooks** | Unlimited notebooks with custom icon & color. |
| **Tags** | Unlimited tags with colors. Filter notes by tag. |
| **Tasks** | Full task manager: priorities, due dates, subtasks, bulk actions, status filters |
| **Search** | Full-text search across all notes. Instant results. |
| **AI Features** | Summarize notes, AI Edit selected text (improve, shorten, translate, etc.), AI Chat with your notes |
| **Dark Mode** | Full dark/light theme toggle, persisted per account |
| **Templates** | 8 system templates + create your own |
| **Settings** | Account, appearance, AI keys, notebooks, tags, templates, security — all in-app |
| **Trash** | Soft delete + restore. Permanent delete. |
| **File Uploads** | Attach files to notes. Images shown inline. |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (`node -v`)
- A PostgreSQL database (free on [neon.tech](https://neon.tech))

### Step 1 — Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/noteflow.git
cd noteflow
npm run install:all
```

### Step 2 — Configure Backend
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=generate-a-64-char-random-string-here
FRONTEND_URL=http://localhost:5173
```

To generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 3 — Run Database Migrations
```bash
npm run db:migrate
```

### Step 4 — Start Development Server
```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Health:** http://localhost:5000/api/health

---

## 🌐 Free Cloud Deployment

Deploy the whole stack for free in ~15 minutes.

### Database — Neon.tech (Free PostgreSQL)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project → copy the **Connection String**
3. It looks like: `postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

### Backend — Railway.app (Free tier)

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your `noteflow` repo → select the `/backend` folder
3. Set these Environment Variables in Railway dashboard:
   ```
   DATABASE_URL=<your neon connection string>
   JWT_SECRET=<your generated secret>
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-app.vercel.app
   PORT=5000
   ```
4. Railway will give you a URL like `https://noteflow-api.up.railway.app`

### Frontend — Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
2. Set **Root Directory** to `frontend`
3. Set Environment Variables:
   ```
   VITE_API_URL=https://your-railway-url.up.railway.app
   ```
4. Deploy → Vercel gives you `https://noteflow.vercel.app`
5. Go back to Railway → update `FRONTEND_URL` to your Vercel URL

### Final Step — Run Migrations on Production
In Railway dashboard → your backend service → Shell tab:
```bash
node src/db/migrate.js
```

Done! Your app is live. 🎉

---

## 🐳 Docker (Self-Host on Your Server)

```bash
cp .env.example .env
# Edit .env with your values

npm run docker:up
# App at http://localhost:3000
# API at http://localhost:5000

# View logs
npm run docker:logs

# Stop
npm run docker:down
```

---

## 🤖 AI Setup

You can add API keys two ways:

**Option A — In-App (Recommended)**
1. Open NoteFlow → Settings (bottom of sidebar) → AI & API Keys
2. Paste your OpenAI or Anthropic key
3. Choose your preferred provider
4. Save → AI features activate immediately

**Option B — Environment Variables**
```env
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

AI Features available:
- **AI Summary** — One-click note summarization (toolbar button)
- **AI Edit** — Select any text → bubble menu → AI Edit → choose action
- **AI Chat** — Sidebar chat panel, asks questions about your notes
- **Tag Suggestions** — AI suggests relevant tags for a note

---

## 📁 Project Structure

```
noteflow/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.js          # DB connection pool
│   │   │   └── migrate.js       # Schema + seed
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.js          # Register, login, profile
│   │   │   ├── notes.js         # Notes CRUD + versions + trash
│   │   │   ├── notebooks.js     # Notebooks CRUD
│   │   │   ├── tags.js          # Tags CRUD
│   │   │   ├── tasks.js         # Tasks + subtasks + bulk
│   │   │   ├── ai.js            # AI edit, summarize, chat
│   │   │   ├── templates.js     # Templates CRUD
│   │   │   ├── attachments.js   # File uploads
│   │   │   └── search.js        # Full-text search
│   │   └── index.js             # Express server
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts        # Axios API client + all endpoints
│   │   ├── components/
│   │   │   ├── ai/
│   │   │   │   ├── AIChatPanel.tsx    # Sidebar AI chat
│   │   │   │   └── AIEditMenu.tsx    # Bubble menu AI edit
│   │   │   ├── editor/
│   │   │   │   └── NoteEditor.tsx    # TipTap rich editor
│   │   │   ├── notes/
│   │   │   │   └── NotesList.tsx     # Note list panel
│   │   │   ├── settings/
│   │   │   │   ├── SettingsModal.tsx # Full settings
│   │   │   │   ├── TagsManager.tsx   # Manage tags
│   │   │   │   ├── NotebooksManager.tsx
│   │   │   │   └── TemplatesManager.tsx
│   │   │   ├── sidebar/
│   │   │   │   ├── Sidebar.tsx       # Main navigation
│   │   │   │   ├── NewNotebookModal.tsx
│   │   │   │   └── NewTagModal.tsx
│   │   │   ├── tasks/
│   │   │   │   └── TasksView.tsx     # Task manager
│   │   │   └── ui/
│   │   │       ├── Modal.tsx         # Reusable modal
│   │   │       └── SearchModal.tsx   # Global search (Ctrl+K)
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx     # Login/Register
│   │   │   └── AppLayout.tsx    # Main 3-panel layout
│   │   ├── store/
│   │   │   └── index.ts         # Zustand global state
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css            # Tailwind + custom styles
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
├── package.json                  # Root: npm run dev starts both
└── README.md
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + K` | Open global search |
| `Esc` | Close modal / search |
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + U` | Underline |
| `Ctrl/Cmd + Z` | Undo |
| `/` in editor | Slash command menu (headings, lists, etc.) |

---

## 🔧 API Reference

Base URL: `http://localhost:5000/api`

All routes except auth require: `Authorization: Bearer <token>`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Get current user |
| PATCH | `/auth/me` | Update profile/settings |
| POST | `/auth/change-password` | Change password |
| GET | `/notes` | List notes (filters: notebook_id, tag_id, search, deleted) |
| POST | `/notes` | Create note |
| GET | `/notes/:id` | Get note with tags & attachments |
| PATCH | `/notes/:id` | Update note |
| DELETE | `/notes/:id` | Soft delete (trash) |
| POST | `/notes/:id/restore` | Restore from trash |
| DELETE | `/notes/:id/permanent` | Permanent delete |
| GET | `/notes/:id/versions` | List versions |
| GET | `/notebooks` | List notebooks |
| POST | `/notebooks` | Create notebook |
| PATCH | `/notebooks/:id` | Update notebook |
| DELETE | `/notebooks/:id` | Delete notebook |
| GET | `/tags` | List tags |
| POST | `/tags` | Create tag |
| PATCH | `/tags/:id` | Update tag |
| DELETE | `/tags/:id` | Delete tag |
| GET | `/tasks` | List tasks |
| POST | `/tasks` | Create task |
| PATCH | `/tasks/:id` | Update task |
| PATCH | `/tasks/bulk` | Bulk update tasks |
| DELETE | `/tasks/:id` | Delete task |
| POST | `/ai/edit` | AI text edit |
| POST | `/ai/summarize` | Summarize note |
| POST | `/ai/chat` | Chat with notes |
| GET | `/search?q=term` | Full-text search |
| POST | `/attachments/upload` | Upload files |
| GET | `/templates` | List templates |

---

## 🛡️ Security Notes

- Passwords hashed with bcrypt (cost 12)
- JWT tokens expire in 7 days
- API keys stored encrypted in DB per user
- CORS restricted to your frontend URL
- Helmet.js security headers enabled
- Rate limiting on auth endpoints

---

Built with ❤️ using React, TipTap, Node.js, Express, PostgreSQL, Tailwind CSS, Zustand, and Lucide icons.
