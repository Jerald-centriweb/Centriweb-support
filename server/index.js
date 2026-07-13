// Loaded via `node --env-file=server/.env server/index.js` (see package.json
// "server" script and the PM2 ecosystem file) — Node's native --env-file flag
// guarantees env vars are set before ANY module (including db.js, whose
// top-level `new pg.Pool()` reads them at import time) is evaluated, which a
// `import 'dotenv/config'` here could not: ESM import statements are hoisted
// above other top-level code, so dotenv would run after db.js already read
// undefined values.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { withAccount } from './db.js';
import { loginWithPassword, signAccountToken, requireAuth } from './auth.js';
import { answerQuestion } from './chat.js';
import { notifyJerald } from './notify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ---------------------------------------------------------------------------
// Embeddability: GHL loads this in an iframe on app.centriweb.com. We do NOT
// send X-Frame-Options (which would block framing outright) and instead set a
// CSP frame-ancestors allowlist — the modern, browser-supported way to permit
// exactly one embedding parent and nothing else. No auth cookies are used
// (pure bearer-token JWT held by the SPA), so SameSite/third-party-cookie
// restrictions in an iframe don't come into play at all.
// ---------------------------------------------------------------------------
const FRAME_ANCESTORS = process.env.CORS_ORIGIN || 'https://app.centriweb.com';
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', `frame-ancestors ${FRAME_ANCESTORS} https://*.centriweb.com`);
  res.setHeader('Access-Control-Allow-Origin', FRAME_ANCESTORS);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const account = await loginWithPassword(email, password);
  if (!account) return res.status(401).json({ error: 'invalid credentials' });
  res.json({ token: signAccountToken(account), account: { slug: account.slug, company_name: account.company_name } });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const rows = await withAccount(req.account.id, (c) =>
    c.query('SELECT id, slug, company_name, contact_email FROM accounts WHERE id = $1', [req.account.id])
  );
  res.json(rows.rows[0] || null);
});

// ---------------------------------------------------------------------------
// Guides (shared content — still requires a valid session per RLS policy)
// ---------------------------------------------------------------------------
app.get('/api/guides', requireAuth, async (req, res) => {
  const result = await withAccount(req.account.id, (c) =>
    c.query('SELECT slug, category, title, summary, minutes, order_index FROM guides ORDER BY order_index')
  );
  res.json(result.rows);
});

app.get('/api/guides/:slug', requireAuth, async (req, res) => {
  const result = await withAccount(req.account.id, (c) =>
    c.query('SELECT slug, category, title, summary, minutes, content_format, content FROM guides WHERE slug = $1', [
      req.params.slug,
    ])
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'not found' });
  res.json(result.rows[0]);
});

// ---------------------------------------------------------------------------
// Tickets — the critical isolation surface. Every query runs through
// withAccount(req.account.id, ...) which sets app.account_id for RLS; there is
// no code path here that lets one account read or write another's tickets.
// ---------------------------------------------------------------------------
app.get('/api/tickets', requireAuth, async (req, res) => {
  const result = await withAccount(req.account.id, (c) =>
    c.query('SELECT id, subject, body, status, created_at FROM tickets WHERE account_id = $1 ORDER BY created_at DESC', [
      req.account.id,
    ])
  );
  res.json(result.rows);
});

app.post('/api/tickets', requireAuth, async (req, res) => {
  const { subject, body, source } = req.body || {};
  if (!subject || !body) return res.status(400).json({ error: 'subject and body required' });

  const inserted = await withAccount(req.account.id, (c) =>
    c.query(
      'INSERT INTO tickets (account_id, subject, body, source) VALUES ($1,$2,$3,$4) RETURNING id, subject, body, status, created_at',
      [req.account.id, subject, body, source || 'portal']
    )
  );
  const ticket = inserted.rows[0];

  const accountRow = await withAccount(req.account.id, (c) =>
    c.query('SELECT company_name, slug FROM accounts WHERE id = $1', [req.account.id])
  );
  const account = accountRow.rows[0];

  try {
    await notifyJerald(account, ticket);
    await withAccount(req.account.id, (c) =>
      c.query('UPDATE tickets SET notified_inbox = true WHERE id = $1', [ticket.id])
    );
  } catch (err) {
    console.error('[tickets] inbox notify failed (ticket still saved):', err.message);
  }

  res.status(201).json(ticket);
});

// ---------------------------------------------------------------------------
// Chat — grounded only in guides + Agency Brain; refuses to fabricate and
// offers a ticket instead when nothing is found.
// ---------------------------------------------------------------------------
app.post('/api/chat', requireAuth, async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  const answer = await answerQuestion(req.account.id, message);

  await withAccount(req.account.id, async (c) => {
    await c.query('INSERT INTO chat_messages (account_id, role, content, grounded) VALUES ($1,$2,$3,$4)', [
      req.account.id,
      'user',
      message,
      true,
    ]);
    await c.query('INSERT INTO chat_messages (account_id, role, content, grounded) VALUES ($1,$2,$3,$4)', [
      req.account.id,
      'assistant',
      answer.reply,
      answer.grounded,
    ]);
  });

  res.json(answer);
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---------------------------------------------------------------------------
// Static SPA (Vite build output)
// ---------------------------------------------------------------------------
const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.use('/shots', express.static(path.join(__dirname, '..', 'public', 'shots')));
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = process.env.PORT || 4300;
app.listen(port, '127.0.0.1', () => {
  console.log(`[support-portal] listening on 127.0.0.1:${port}`);
});
