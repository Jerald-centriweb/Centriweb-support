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
import { loginWithPassword, signInternalToken, requireAuth } from './auth.js';
import { answerQuestion } from './chat.js';
import { notifyJerald } from './notify.js';
import { createTicketTask } from './clickup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ---------------------------------------------------------------------------
// Embeddability: the portal loads in an iframe inside each builder's own
// dashboard, via a custom menu link. We do NOT send X-Frame-Options (which
// would block framing outright) and instead set a CSP frame-ancestors
// allowlist — the modern, browser-supported way to permit exactly one
// embedding parent and nothing else. No auth cookies are used (pure
// bearer-token JWT held by the SPA), so SameSite/third-party-cookie
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
// Internal admin login — Jerald/us only. This is NOT how clients get in (see
// server/auth.js and server/provision-account.mjs); account_login_lookup()
// only ever returns rows flagged is_internal at the SQL layer, so this
// endpoint cannot authenticate a client account under any circumstances.
// ---------------------------------------------------------------------------
app.post('/api/internal/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const account = await loginWithPassword(email, password);
  if (!account) return res.status(401).json({ error: 'invalid credentials' });
  res.json({ token: signInternalToken(account), account: { slug: account.slug, company_name: account.company_name } });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const rows = await withAccount(req.account.id, (c) =>
    c.query('SELECT id, slug, company_name, contact_email FROM accounts WHERE id = $1', [req.account.id])
  );
  res.json(rows.rows[0] || null);
});

// ---------------------------------------------------------------------------
// Products — the top level of the SOP model (PreBuild today, more later).
// Public: this is the site map of the knowledge base, not account data.
// ---------------------------------------------------------------------------
app.get('/api/products', async (req, res) => {
  const result = await pool.query('SELECT slug, name, description FROM products ORDER BY order_index');
  res.json(result.rows);
});

// ---------------------------------------------------------------------------
// Guides — shared knowledge base content. Deliberately PUBLIC (no auth
// required): guides carry no client data, and keeping them open is what
// makes a future help.centriweb.info -> portal redirect possible without
// asking anonymous visitors to somehow "be" an account. Filter by product
// and/or section via query params; content_type distinguishes plain articles
// from video guides so the front end can surface "Videos" as its own view
// without a separate table.
// ---------------------------------------------------------------------------
// Only status = 'live' is ever served here — a content sync (e.g. Notion)
// seeds new guides as 'draft' until someone has actually checked them, and an
// inaccurate draft must never reach a client. Front end renders an honest
// "nothing published here yet" empty state rather than a blank/broken
// section when a filter matches zero live rows.
app.get('/api/guides', async (req, res) => {
  const { product, section } = req.query;
  const clauses = [`status = 'live'`];
  const params = [];
  if (product) {
    params.push(product);
    clauses.push(`product_slug = $${params.length}`);
  }
  if (section) {
    params.push(section);
    clauses.push(`section = $${params.length}`);
  }
  const result = await pool.query(
    `SELECT slug, product_slug, section, category, title, summary, minutes, content_type, video_url, order_index
     FROM guides WHERE ${clauses.join(' AND ')} ORDER BY section, order_index`,
    params
  );
  res.json(result.rows);
});

app.get('/api/guides/:slug', async (req, res) => {
  const result = await pool.query(
    `SELECT slug, product_slug, section, category, title, summary, minutes, content_format, content, content_type, video_url
     FROM guides WHERE slug = $1 AND status = 'live'`,
    [req.params.slug]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'not found' });
  res.json(result.rows[0]);
});

// ---------------------------------------------------------------------------
// Tickets — the critical isolation surface. Every query runs through
// withAccount(req.account.id, ...) which sets app.account_id for RLS; there is
// no code path here that lets one account read or write another's tickets.
// A ticket is created three places, none of which the client has to check
// individually:
//   1. Postgres (source of truth, RLS-isolated by account_id).
//   2. The centri-agents OS inbox (same inbox Jerald's Claude sessions read).
//   3. A ClickUp task on that builder's own board — where Jerald actually
//      works from day to day. If ClickUp fails the ticket still saves; the
//      failure is logged and pushed into the same inbox item, never swallowed.
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

  const accountRow = await withAccount(req.account.id, (c) =>
    c.query('SELECT company_name, slug, ghl_location_id, clickup_list_name FROM accounts WHERE id = $1', [req.account.id])
  );
  const account = accountRow.rows[0];

  const inserted = await withAccount(req.account.id, (c) =>
    c.query(
      `INSERT INTO tickets (account_id, subject, body, source, ghl_location_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, subject, body, status, created_at`,
      [req.account.id, subject, body, source || 'portal', account?.ghl_location_id || null]
    )
  );
  const ticket = inserted.rows[0];

  // 3. ClickUp task — matched to this builder's board by clickup_list_name
  // (falls back to company_name; see server/clickup.js for why folder-name
  // matching, not list-name matching, is what disambiguates clients).
  const clickup = await createTicketTask({
    accountLabel: `${account?.company_name || req.account.slug} (${req.account.slug})`,
    listQuery: account?.clickup_list_name || account?.company_name,
    subject,
    body,
    ticketId: ticket.id,
  });

  await withAccount(req.account.id, (c) =>
    c.query('UPDATE tickets SET clickup_task_id = $1, clickup_task_url = $2, clickup_error = $3 WHERE id = $4', [
      clickup.ok ? clickup.taskId : null,
      clickup.ok ? clickup.taskUrl : null,
      clickup.ok ? null : clickup.reason,
      ticket.id,
    ])
  );
  if (!clickup.ok) {
    console.error(`[tickets] ClickUp task creation failed for ticket ${ticket.id}:`, clickup.reason);
  }

  // 2. OS inbox — always attempted, and always says whether ClickUp worked so
  // the failure is visible in the one place Jerald already watches instead of
  // being silently swallowed.
  try {
    const clickupLine = clickup.ok
      ? `ClickUp task created on "${clickup.list}": ${clickup.taskUrl}`
      : `ClickUp task creation FAILED (${clickup.reason}) — ticket is still saved, needs manual follow-up`;
    await notifyJerald(account, ticket, clickupLine);
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

  const answer = await answerQuestion(message);

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
