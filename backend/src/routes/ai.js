// src/routes/ai.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = express.Router();
router.use(authenticate);

async function getAIClient(user) {
  const provider = user.ai_provider || 'openai';
  const openaiKey = user.openai_api_key || process.env.OPENAI_API_KEY;
  const claudeKey = user.anthropic_api_key || process.env.ANTHROPIC_API_KEY;

  if (provider === 'anthropic' && claudeKey) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    return { type: 'anthropic', client: new Anthropic({ apiKey: claudeKey }) };
  }
  if (openaiKey) {
    const { default: OpenAI } = await import('openai');
    return { type: 'openai', client: new OpenAI({ apiKey: openaiKey }) };
  }
  return null;
}

async function callAI(aiClient, systemPrompt, userPrompt) {
  if (!aiClient) throw new Error('No AI provider configured. Add your API key in Settings.');

  if (aiClient.type === 'anthropic') {
    const msg = await aiClient.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }]
    });
    return msg.content[0].text;
  } else {
    const resp = await aiClient.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000
    });
    return resp.choices[0].message.content;
  }
}

// Edit text
router.post('/edit', async (req, res) => {
  const { text, action, language } = req.body;
  if (!text || !action) return res.status(400).json({ error: 'text and action required' });

  const actions = {
    improve: 'Improve the writing quality, clarity, and flow of the following text. Return only the improved text.',
    shorter: 'Make this text shorter and more concise while preserving all key information. Return only the shortened text.',
    longer: 'Expand this text with more detail and explanation. Return only the expanded text.',
    fix_grammar: 'Fix all grammar and spelling errors in this text. Return only the corrected text.',
    professional: 'Rewrite this text in a professional, formal tone. Return only the rewritten text.',
    casual: 'Rewrite this text in a casual, friendly tone. Return only the rewritten text.',
    summarize: 'Write a concise 3-sentence summary of this text. Return only the summary.',
    translate: `Translate this text to ${language || 'English'}. Return only the translation.`,
    continue: 'Continue writing this text naturally, adding 2-3 more sentences. Return only the continuation (not the original).',
  };

  const systemPrompt = actions[action] || actions.improve;

  try {
    const aiClient = await getAIClient(req.user);
    const result = await callAI(aiClient, systemPrompt, text);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Summarize note
router.post('/summarize', async (req, res) => {
  const { note_id } = req.body;
  if (!note_id) return res.status(400).json({ error: 'note_id required' });

  const { rows } = await pool.query('SELECT title, content_text FROM notes WHERE id=$1 AND user_id=$2', [note_id, req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'Note not found' });

  const note = rows[0];
  if (!note.content_text || note.content_text.length < 50) {
    return res.status(400).json({ error: 'Note is too short to summarize' });
  }

  try {
    const aiClient = await getAIClient(req.user);
    const summary = await callAI(
      aiClient,
      'Write a concise 2-3 sentence summary of the following note. Be specific and capture the key points.',
      `Title: ${note.title}\n\nContent: ${note.content_text.slice(0, 4000)}`
    );

    await pool.query('UPDATE notes SET ai_summary=$1, updated_at=NOW() WHERE id=$2', [summary, note_id]);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat with notes
router.post('/chat', async (req, res) => {
  const { message, note_ids = [], history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  let context = '';
  if (note_ids.length) {
    const { rows } = await pool.query(
      `SELECT title, content_text FROM notes WHERE id=ANY($1) AND user_id=$2`,
      [note_ids, req.user.id]
    );
    context = rows.map(n => `## ${n.title}\n${n.content_text}`).join('\n\n---\n\n');
  }

  const systemPrompt = context
    ? `You are a helpful assistant for a note-taking app. Answer questions based on the user's notes provided below. Be concise and cite which note the information comes from.\n\nNOTES:\n${context.slice(0, 8000)}`
    : `You are a helpful assistant for a note-taking app called NoteFlow. Help the user with their notes, writing, and organization.`;

  try {
    const aiClient = await getAIClient(req.user);
    const messages = history.map(h => ({ role: h.role, content: h.content }));
    messages.push({ role: 'user', content: message });

    let result;
    if (aiClient?.type === 'anthropic') {
      const msg = await aiClient.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages
      });
      result = msg.content[0].text;
    } else if (aiClient?.type === 'openai') {
      const resp = await aiClient.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 1500
      });
      result = resp.choices[0].message.content;
    } else {
      throw new Error('No AI provider configured. Add your API key in Settings.');
    }

    res.json({ reply: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate tags suggestion
router.post('/suggest-tags', async (req, res) => {
  const { note_id } = req.body;
  const { rows } = await pool.query('SELECT title, content_text FROM notes WHERE id=$1 AND user_id=$2', [note_id, req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'Note not found' });

  try {
    const aiClient = await getAIClient(req.user);
    const result = await callAI(
      aiClient,
      'Suggest 3-5 relevant tags for this note. Return only a JSON array of tag strings, e.g. ["work","project","meeting"]',
      `${rows[0].title}\n${rows[0].content_text?.slice(0, 1000)}`
    );
    const tags = JSON.parse(result.replace(/```json|```/g, '').trim());
    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
