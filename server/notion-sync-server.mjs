// Tiny standalone trigger endpoint for the Notion -> guides sync.
//
// Deliberately its OWN process/port (127.0.0.1:4301), not a route bolted onto
// server/index.js: another session is concurrently mid-edit on index.js for
// auth/embed/ClickUp, and this sync layer's job is to stay out of that file
// entirely. Cron (see /etc/cron.d/support-portal-notion-sync) runs
// notion-sync.mjs directly and doesn't need this process at all — this is
// purely for "push a change immediately" (POST /trigger) instead of waiting
// for the next 12-minute tick.
//
// Auth: reuses AGENT_TOKEN (already a shared internal secret in server/.env,
// same one server/notify.js's inbox calls use) as a bearer/header check —
// deliberately not inventing a second secret for one internal endpoint.
import http from 'http';
import { runSync } from './notion-sync.mjs';

const PORT = process.env.NOTION_SYNC_PORT || 4301;
const AGENT_TOKEN = process.env.AGENT_TOKEN || '';

let running = false;

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, running }));
  }

  if (req.method !== 'POST' || req.url !== '/trigger') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'not found' }));
  }

  if (!AGENT_TOKEN || req.headers['x-agent-token'] !== AGENT_TOKEN) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'unauthorized' }));
  }

  if (running) {
    res.writeHead(409, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'a sync is already running' }));
  }

  running = true;
  try {
    const summary = await runSync({});
    res.writeHead(summary.ok ? 200 : 502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(summary));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: err.message }));
  } finally {
    running = false;
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[notion-sync-server] listening on 127.0.0.1:${PORT} — POST /trigger to push a sync immediately`);
});
