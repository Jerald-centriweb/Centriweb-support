// Notion -> Postgres guides sync (2026-07-13).
//
// Notion is the single source of truth for every client-facing guide. This
// script mirrors the "Support Guides — PreBuild Portal" Notion database into
// the portal's `guides` table. Pure code, no LLM call — deterministic data
// movement, matching the infra-sentinel convention (see
// /opt/agency-brain/scripts/maintenance/infra-sentinel.sh) for pure-code
// crons that alert into the centri-agents OS inbox on a real problem.
//
// THE ONE RULE THAT MATTERS MOST: a failed or empty/partial Notion fetch must
// never touch the `guides` table. Every write happens only after the ENTIRE
// fetch (database query + every page's block tree + every image download)
// has succeeded. Any exception anywhere in that phase aborts before a single
// SQL statement runs, and pushes a visible alert into the OS inbox. The portal
// keeps serving whatever it was already serving.
//
// Visibility mapping (Notion Status -> guides.status, the column
// server/index.js already filters `/api/guides` on):
//   Notion Status = Published, page not archived/trashed  -> 'live'
//   Notion Status = Draft                                 -> 'draft'
//   page archived/trashed in Notion, or missing from the
//   query results entirely (deleted)                      -> 'archived'
// Rows are NEVER hard-deleted by this script — status is the only thing that
// changes, so nothing Jerald removes from Notion is ever actually lost.
//
// Idempotency: matched on Notion's page id (guides.notion_page_id), never on
// title or slug. A page whose Notion last_edited_time hasn't moved since the
// last successful sync is skipped entirely (no DB write, no image
// re-download). Two consecutive runs against unchanged Notion content produce
// zero UPDATEs.
//
// Images: Notion's own image URLs are signed S3 links that expire in about an
// hour. Every image block is downloaded once into public/shots/ (the same
// directory server/migrate-content.mjs already seeded and server/index.js
// already serves at /shots/*) and the guide content is rewritten to point at
// our own /shots/<file> path — never at the Notion URL.
//
// Run modes:
//   node server/notion-sync.mjs                 real run against the Notion API
//   node server/notion-sync.mjs --dry-run        fetch + compute, no DB writes
//   node server/notion-sync.mjs --snapshot=FILE  use a pre-fetched JSON snapshot
//                                                 instead of calling the Notion
//                                                 API (see snapshot-from-mcp.mjs)
// Scheduling: /etc/cron.d/support-portal-notion-sync (every 12 minutes) plus a
// manual trigger endpoint (server/notion-sync-server.mjs, its own PM2 process)
// for "push a change immediately".

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = path.join(__dirname, '..', 'public', 'shots');

const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '';
const NOTION_VERSION = process.env.NOTION_VERSION || '2022-06-28';
const AGENT_INBOX_URL = process.env.AGENT_INBOX_URL || 'http://127.0.0.1:8484/inbox';
const AGENT_TOKEN = process.env.AGENT_TOKEN || '';

// Alert dedup state — this cron runs every 12 minutes (see
// /etc/cron.d/support-portal-notion-sync), so a standing, unchanged problem
// (most commonly "NOTION_API_KEY is not configured") would otherwise post an
// identical line into the OS inbox 5 times an hour, forever, burying whatever
// real alert Jerald actually needs to see under a wall of duplicates. Keyed
// on a hash of the exact alert text: a genuinely NEW/different alert always
// has a different hash and therefore always fires immediately, regardless of
// cooldown — only an EXACT repeat within the window is suppressed.
const ALERT_STATE_PATH = path.join(__dirname, '..', 'logs', 'notion-sync-alert-state.json');
const ALERT_COOLDOWN_MS = Number(process.env.NOTION_SYNC_ALERT_COOLDOWN_MS) || 12 * 60 * 60 * 1000; // 12h default

const SECTION_MAP = {
  'Start here': 'start_here',
  'Day to day': 'day_to_day',
  'Money and documents': 'money_and_documents',
  'Troubleshooting': 'troubleshooting',
};

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  max: 3,
});

// ---------------------------------------------------------------------------
// Alert dedup state — a tiny JSON map of { [sha256(text)]: lastSentAtMs }.
// Pruned of entries older than 30 days on every save so it can never grow
// unbounded across the sync's lifetime.
// ---------------------------------------------------------------------------
function loadAlertState() {
  try {
    return JSON.parse(fs.readFileSync(ALERT_STATE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveAlertState(state) {
  const PRUNE_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const pruned = Object.fromEntries(Object.entries(state).filter(([, ts]) => now - ts < PRUNE_MS));
  try {
    fs.mkdirSync(path.dirname(ALERT_STATE_PATH), { recursive: true });
    fs.writeFileSync(ALERT_STATE_PATH, JSON.stringify(pruned));
  } catch (err) {
    // Never let a dedup-state write failure block the alert itself — worst
    // case we just fail open (re-alert next run) instead of losing the alert.
    console.error('[notion-sync] could not persist alert-dedup state:', err.message);
  }
}

// ---------------------------------------------------------------------------
// OS inbox alert — same inbox/token server/notify.js already posts to
// (centri-agents, 127.0.0.1:8484). Reimplemented inline (not imported from
// notify.js) so this sync layer has zero coupling to files another session is
// concurrently editing.
//
// Content-hash + cooldown dedup (2026-07): this cron runs every 12 minutes,
// so an unchanged standing problem (most commonly "NOTION_API_KEY is not
// configured") used to re-post an identical line into the OS inbox every
// single run, forever — five times an hour, burying whatever else was in
// there. Now: an alert whose exact text already fired within the last
// ALERT_COOLDOWN_MS is suppressed (still logged locally, just not re-posted);
// a genuinely NEW or CHANGED alert (different hash — e.g. the key gets
// configured and a different problem shows up, or the broken-video list
// changes) always posts immediately regardless of cooldown.
// ---------------------------------------------------------------------------
export async function alertInbox(text) {
  console.error('[notion-sync] ALERT:', text);

  const hash = crypto.createHash('sha256').update(text).digest('hex');
  const state = loadAlertState();
  const now = Date.now();
  const lastSent = state[hash];
  if (lastSent && now - lastSent < ALERT_COOLDOWN_MS) {
    const mins = Math.round((now - lastSent) / 60000);
    console.error(`[notion-sync] inbox alert suppressed — identical alert already sent ${mins}m ago (cooldown ${Math.round(ALERT_COOLDOWN_MS / 3600000)}h)`);
    return false;
  }

  if (!AGENT_INBOX_URL || !AGENT_TOKEN) {
    console.error('[notion-sync] cannot reach OS inbox (missing AGENT_INBOX_URL/AGENT_TOKEN) — alert only logged locally');
    return false;
  }
  try {
    const res = await fetch(AGENT_INBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-agent-token': AGENT_TOKEN },
      body: JSON.stringify({ text: `[Notion sync] ${text}` }),
    });
    if (!res.ok) {
      console.error('[notion-sync] inbox alert failed:', res.status, await res.text().catch(() => ''));
      return false;
    }
    // Only record "sent" on an actual successful post — if the inbox is
    // unreachable we want to keep retrying every run, not silently give up
    // for the whole cooldown window.
    state[hash] = now;
    saveAlertState(state);
    return true;
  } catch (err) {
    console.error('[notion-sync] inbox alert threw:', err.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Notion REST client
// ---------------------------------------------------------------------------
async function notionFetch(pathSuffix, opts = {}) {
  const res = await fetch(`https://api.notion.com/v1${pathSuffix}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const bodyText = await res.text();
  let body;
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    body = { raw: bodyText };
  }
  if (!res.ok) {
    const msg = body?.message || bodyText || res.statusText;
    throw new Error(`Notion API ${res.status} on ${pathSuffix}: ${msg}`);
  }
  return body;
}

async function queryAllPages() {
  let results = [];
  let cursor;
  do {
    const body = await notionFetch(`/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      body: JSON.stringify(cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 }),
    });
    results = results.concat(body.results || []);
    cursor = body.has_more ? body.next_cursor : undefined;
  } while (cursor);
  return results;
}

async function fetchBlockChildren(blockId) {
  let results = [];
  let cursor;
  do {
    const qs = new URLSearchParams({ page_size: '100' });
    if (cursor) qs.set('start_cursor', cursor);
    const body = await notionFetch(`/blocks/${blockId}/children?${qs}`);
    results = results.concat(body.results || []);
    cursor = body.has_more ? body.next_cursor : undefined;
  } while (cursor);
  return results;
}

// ---------------------------------------------------------------------------
// Property extraction
// ---------------------------------------------------------------------------
function getProp(page, name) {
  // Verification-only shortcut: a snapshot page built from MCP tool output
  // (see the note above remapImagesInMarkdown) already carries plain JS
  // values ({"Title":"...", "Order":99, "Verified":false, ...}) rather than
  // the real Notion REST API's typed property envelopes. The production path
  // (queryAllPages(), real REST response) never sets this flag.
  if (page._flatProperties) return page.properties?.[name];
  const p = page.properties?.[name];
  if (!p) return undefined;
  switch (p.type) {
    case 'title':
      return (p.title || []).map((t) => t.plain_text).join('');
    case 'select':
      return p.select?.name;
    case 'number':
      return p.number;
    case 'url':
      return p.url || '';
    case 'checkbox':
      return !!p.checkbox;
    default:
      return undefined;
  }
}

function slugify(title) {
  const s = String(title || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return s || 'guide';
}

async function uniqueSlug(client, base, notionPageId) {
  const { rows } = await client.query(
    'SELECT slug FROM guides WHERE slug = $1 AND (notion_page_id IS DISTINCT FROM $2)',
    [base, notionPageId]
  );
  if (!rows.length) return base;
  const suffix = crypto.createHash('sha1').update(notionPageId).digest('hex').slice(0, 6);
  return `${base}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Rich text + block -> Markdown rendering (safe subset: the portal's
// GuideViewer renders with plain react-markdown, no remark-gfm/rehype-raw
// plugins installed, so GFM tables and raw HTML would show as literal text.
// Tables are flattened into a labelled list instead of pipe syntax.)
// ---------------------------------------------------------------------------
function richTextToMd(rt) {
  if (!rt || !rt.length) return '';
  return rt
    .map((t) => {
      let s = t.plain_text || '';
      const ann = t.annotations || {};
      if (ann.code) s = '`' + s + '`';
      if (ann.bold) s = `**${s}**`;
      if (ann.italic) s = `*${s}*`;
      if (ann.strikethrough) s = `~~${s}~~`;
      if (t.href) s = `[${s}](${t.href})`;
      return s;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Video resolution — Jerald authors SOPs in Notion, videos live on Google
// Drive. He will not always use the "Video" property; a Drive/YouTube/Loom
// link pasted as a bare link, a bookmark, or an embed block inside the page
// BODY must work too. VIDEO_HOST_RE is the single recognizer both this file
// (body detection) and the front end's toEmbedUrl (services/contentService.ts)
// key off, kept in sync deliberately rather than shared as one module because
// this file runs under Node/no bundler and the front end runs under Vite.
// ---------------------------------------------------------------------------
const VIDEO_HOST_RE = /(?:drive\.google\.com|youtube\.com|youtu\.be|loom\.com|vimeo\.com)/i;

function extractDriveFileId(url) {
  const byPath = String(url || '').match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (byPath) return byPath[1];
  const byQuery = String(url || '').match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return byQuery ? byQuery[1] : null;
}

// Google's own sign-in wall cannot be seen from inside the client's browser
// (the iframe is cross-origin — JS can't inspect why it failed to load), so
// this is the only place that can ever catch "Jerald pasted a Drive link but
// forgot to share it" before a builder does. Checked EVERY run, not gated
// behind the content-unchanged short-circuit, because sharing can change on
// the Drive side with zero Notion edit to trigger a re-check.
//   ok: true       -> reachable, embeds fine.
//   ok: false       -> conclusively broken (sign-in wall or gone) — reason set.
//   ok: null        -> inconclusive (network hiccup) — caller should keep
//                       whatever status it already had rather than guess.
async function checkDriveVideoSharing(fileId) {
  try {
    const res = await fetch(`https://drive.google.com/file/d/${fileId}/preview`, { redirect: 'follow' });
    if (res.status === 200) return { ok: true };
    if (res.status === 401) {
      return { ok: false, reason: `Drive shows a Google sign-in wall for file ${fileId} — it is not shared "Anyone with the link can view".` };
    }
    if (res.status === 404) {
      return { ok: false, reason: `Drive returned 404 for file ${fileId} — check the file still exists and the id in the link is correct.` };
    }
    return { ok: false, reason: `Drive returned an unexpected status (${res.status}) for file ${fileId} while checking sharing.` };
  } catch (err) {
    return { ok: null, reason: `network error while checking Drive sharing for ${fileId}: ${err.message}` };
  }
}

function extractUrlFromBlock(type, b) {
  if (type === 'video' || type === 'embed' || type === 'bookmark' || type === 'link_preview') {
    return b.url || (b.type === 'external' ? b.external?.url : b.file?.url) || null;
  }
  return null;
}

function firstVideoHref(richText) {
  if (!Array.isArray(richText)) return null;
  for (const t of richText) {
    if (t.href && VIDEO_HOST_RE.test(t.href)) return t.href;
  }
  return null;
}

// First recognised video URL found anywhere in raw synced markdown (used only
// by the snapshot/verification path below, where content arrives as already-
// rendered markdown rather than a live Notion block tree — see
// remapImagesInMarkdown). Markdown link targets are checked before bare URLs
// so `[Watch the walkthrough](https://drive.google.com/...)` matches its
// actual target rather than any incidental URL earlier in the prose.
function findVideoUrlInMarkdown(markdown) {
  const linkRe = /\]\((https?:\/\/[^\s)]+)\)/g;
  let m;
  while ((m = linkRe.exec(markdown))) {
    if (VIDEO_HOST_RE.test(m[1])) return m[1];
  }
  const bareRe = /(https?:\/\/[^\s)]+)/g;
  while ((m = bareRe.exec(markdown))) {
    if (VIDEO_HOST_RE.test(m[1])) return m[1];
  }
  return null;
}

function guessExt(url) {
  try {
    const clean = new URL(url).pathname;
    const m = clean.match(/\.([a-zA-Z0-9]{2,5})$/);
    if (m) return `.${m[1].toLowerCase()}`;
  } catch {
    /* fall through */
  }
  return '.png';
}

async function downloadImage(url, pageId, blockId) {
  const ext = guessExt(url);
  const filename = `notion-${pageId.replace(/-/g, '').slice(0, 12)}-${blockId.replace(/-/g, '').slice(0, 8)}${ext}`;
  const dest = path.join(SHOTS_DIR, filename);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image download failed (${res.status}) for block ${blockId}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  fs.writeFileSync(dest, buf);
  return `/shots/${filename}`;
}

async function tableToMd(block) {
  const rows = await fetchBlockChildren(block.id);
  const hasHeader = block.table?.has_column_header;
  const lines = [];
  rows.forEach((row, i) => {
    const cells = (row.table_row?.cells || []).map((c) => richTextToMd(c));
    if (hasHeader && i === 0) {
      lines.push(`**${cells.join(' — ')}**`);
    } else {
      lines.push(`- ${cells.join(' — ')}`);
    }
  });
  return lines.join('\n') + '\n\n';
}

async function blocksToMarkdown(blocks, pageId, ctx) {
  let md = '';
  let numberedIndex = 0;
  for (const block of blocks) {
    const type = block.type;
    if (type !== 'numbered_list_item') numberedIndex = 0;
    const b = block[type] || {};

    // Body-embedded video detection (only ever used as a fallback when the
    // Notion "Video" property is empty — see runSync). First match in
    // reading order wins. Single pass alongside the markdown walk so this
    // never re-fetches a block's children a second time just to look for a
    // video link.
    if (ctx && !ctx.videoUrl) {
      const blockUrl = extractUrlFromBlock(type, b);
      if (blockUrl && VIDEO_HOST_RE.test(blockUrl)) {
        ctx.videoUrl = blockUrl;
      } else {
        const href = firstVideoHref(b.rich_text);
        if (href) ctx.videoUrl = href;
      }
    }

    switch (type) {
      case 'paragraph':
        md += richTextToMd(b.rich_text) + '\n\n';
        break;
      case 'heading_1':
        md += `# ${richTextToMd(b.rich_text)}\n\n`;
        break;
      case 'heading_2':
        md += `## ${richTextToMd(b.rich_text)}\n\n`;
        break;
      case 'heading_3':
        md += `### ${richTextToMd(b.rich_text)}\n\n`;
        break;
      case 'bulleted_list_item':
        md += `- ${richTextToMd(b.rich_text)}\n`;
        break;
      case 'numbered_list_item':
        numberedIndex += 1;
        md += `${numberedIndex}. ${richTextToMd(b.rich_text)}\n`;
        break;
      case 'to_do':
        md += `- [${b.checked ? 'x' : ' '}] ${richTextToMd(b.rich_text)}\n`;
        break;
      case 'quote':
        md += `> ${richTextToMd(b.rich_text)}\n\n`;
        break;
      case 'callout':
        md += `> ${b.icon?.emoji ? b.icon.emoji + ' ' : ''}${richTextToMd(b.rich_text)}\n\n`;
        break;
      case 'divider':
        md += `---\n\n`;
        break;
      case 'code':
        md += '```' + (b.language || '') + '\n' + richTextToMd(b.rich_text) + '\n```\n\n';
        break;
      case 'image': {
        const url = b.type === 'external' ? b.external?.url : b.file?.url;
        const caption = richTextToMd(b.caption);
        if (url) {
          const localPath = await downloadImage(url, pageId, block.id);
          md += `![${caption || 'guide screenshot'}](${localPath})\n`;
          if (caption) md += `*${caption}*\n`;
          md += '\n';
        }
        break;
      }
      case 'table':
        md += await tableToMd(block);
        break;
      case 'table_row':
        // handled by the parent `table` case via fetchBlockChildren
        break;
      default:
        if (b.rich_text) md += richTextToMd(b.rich_text) + '\n\n';
        break;
    }
    // one level of nested children for block types that commonly carry them
    // (toggle, quote, callout) — skip table/table_row, already handled above.
    if (block.has_children && type !== 'table' && type !== 'table_row') {
      const children = await fetchBlockChildren(block.id);
      md += await blocksToMarkdown(children, pageId, ctx);
    }
  }
  return md;
}

// Returns { markdown, bodyVideoUrl } — bodyVideoUrl is the first recognised
// video link found anywhere in the page body (embed/bookmark/video block, or
// a bare/linked URL), null if none. Callers only ever use bodyVideoUrl when
// the Notion "Video" property itself is empty (see runSync's video
// resolution order: property first, body second).
async function renderPageContent(pageId) {
  const blocks = await fetchBlockChildren(pageId);
  const ctx = { videoUrl: null };
  const md = await blocksToMarkdown(blocks, pageId, ctx);
  return { markdown: md.trim() + '\n', bodyVideoUrl: ctx.videoUrl };
}

// ---------------------------------------------------------------------------
// Verification-only adapter (see snapshot-from-mcp.mjs): when a snapshot page
// carries pre-rendered markdown (`_rawMarkdown`, produced via the Notion MCP
// `fetch` tool rather than the raw block-children REST endpoint) instead of
// calling the real Notion block API, this finds Notion's own signed S3 image
// URLs inside that markdown and runs them through the exact same
// downloadImage() the production path uses, so the image-download/rewrite
// behaviour under test is byte-for-byte the same code either way. The only
// thing swapped for verification is how the block tree was obtained — not
// what happens to the images or the database once we have it.
// ---------------------------------------------------------------------------
function extractNotionContent(rawMarkdown) {
  const start = rawMarkdown.indexOf('<content>');
  const end = rawMarkdown.lastIndexOf('</content>');
  if (start === -1 || end === -1) return rawMarkdown;
  return rawMarkdown.slice(start + '<content>'.length, end).trim();
}

// Returns { markdown, bodyVideoUrl } — same shape as renderPageContent(), so
// the two content sources are interchangeable at the call site in runSync().
// bodyVideoUrl here is found via a plain regex over the rendered markdown
// (findVideoUrlInMarkdown) rather than walking a live block tree, since this
// path never touches the real Notion block API — see the note above this
// function's original definition for why that's the deliberate, sole
// difference between the two paths.
export async function remapImagesInMarkdown(rawMarkdown, pageId) {
  const markdown = extractNotionContent(rawMarkdown || '');
  const imgRegex = /!\[([^\]]*)\]\((https:\/\/prod-files-secure\.s3[^)]+)\)/g;
  const matches = [...markdown.matchAll(imgRegex)];
  let result = markdown;
  for (const m of matches) {
    const [full, alt, url] = m;
    const blockId = crypto.createHash('sha1').update(url).digest('hex').slice(0, 8);
    const localPath = await downloadImage(url, pageId, blockId);
    result = result.split(full).join(`![${alt}](${localPath})`);
  }
  const finalMd = result.trim() + '\n';
  return { markdown: finalMd, bodyVideoUrl: findVideoUrlInMarkdown(finalMd) };
}

// ---------------------------------------------------------------------------
// Core sync
// ---------------------------------------------------------------------------
function computeHash(fields) {
  return crypto.createHash('sha256').update(JSON.stringify(fields)).digest('hex');
}

// Brand-new guides have no human-written summary (the Notion schema
// deliberately has no separate "Summary" property — Jerald's spec was Title/
// Product/Category/Order/Status/Video only), so derive a short one from the
// first real paragraph of content rather than repeating the title verbatim.
// Never applied to rows that already have a hand-written summary (the 10
// ported guides keep theirs from server/migrate-content.mjs untouched).
function deriveSummary(markdown, fallbackTitle) {
  const firstPara = (markdown || '')
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .find((s) => s && !s.startsWith('#') && !s.startsWith('!['));
  if (!firstPara) return fallbackTitle;
  const plain = firstPara.replace(/[*_`>#]/g, '').replace(/\s+/g, ' ').trim();
  return plain.length > 180 ? `${plain.slice(0, 177)}...` : plain;
}

export async function runSync({ dryRun = false, snapshotPages = null } = {}) {
  const startedAt = new Date();
  const summary = { ok: false, inserted: 0, updated: 0, unchanged: 0, archived: 0, errors: [], startedAt };

  if (!snapshotPages && !NOTION_API_KEY) {
    const msg = 'NOTION_API_KEY is not configured (see /opt/support-portal/.secrets/notion.env) — sync skipped, portal guides left untouched.';
    await alertInbox(msg);
    summary.errors.push(msg);
    return summary;
  }
  if (!snapshotPages && !NOTION_DATABASE_ID) {
    const msg = 'NOTION_DATABASE_ID is not configured — sync skipped, portal guides left untouched.';
    await alertInbox(msg);
    summary.errors.push(msg);
    return summary;
  }

  // ---- FETCH PHASE: any failure here must leave the DB completely alone ----
  let pages;
  try {
    pages = snapshotPages || (await queryAllPages());
  } catch (err) {
    const msg = `Notion fetch failed: ${err.message}. Portal guides left untouched (last good content still serving).`;
    await alertInbox(msg);
    summary.errors.push(msg);
    return summary;
  }

  if (!Array.isArray(pages) || pages.length === 0) {
    const msg = 'Notion query returned zero pages. Treating as a failed/empty fetch — refusing to touch the guides table. Check the database id and that the integration is shared with it.';
    await alertInbox(msg);
    summary.errors.push(msg);
    return summary;
  }

  // Render every page's properties + content BEFORE touching the DB, so a
  // failure partway through (e.g. an image download times out on page 7 of
  // 10) aborts the whole run with nothing written — no partial apply.
  const client = await pool.connect();
  const brokenVideoAlerts = [];
  try {
    const prepared = [];
    for (const page of pages) {
      const title = getProp(page, 'Title') || '(untitled)';
      const product = getProp(page, 'Product') || 'PreBuild';
      const category = getProp(page, 'Category') || 'Day to day';
      const order = getProp(page, 'Order') ?? 0;
      const notionStatus = getProp(page, 'Status') || 'Draft';
      const verified = getProp(page, 'Verified') || false;
      const lastEdited = page.last_edited_time;
      const isArchived = !!page.archived || !!page.in_trash;

      const { rows: existingRows } = await client.query(
        'SELECT slug, notion_last_edited_time, status, video_url, video_status, video_status_reason FROM guides WHERE notion_page_id = $1',
        [page.id]
      );
      const existing = existingRows[0];

      const targetStatus = isArchived ? 'archived' : notionStatus === 'Published' ? 'live' : 'draft';

      // Cheap short-circuit: if Notion hasn't touched this page since our last
      // successful sync of it, skip re-rendering content and re-downloading
      // images entirely. last_edited_time changes on ANY edit (properties or
      // body), so equality here is a safe "nothing changed" signal.
      const unchangedByTimestamp =
        existing && existing.notion_last_edited_time && new Date(existing.notion_last_edited_time).toISOString() === lastEdited;

      let content = null;
      let bodyVideoUrl = null;
      if (!unchangedByTimestamp) {
        const rendered =
          page._rawMarkdown !== undefined
            ? await remapImagesInMarkdown(page._rawMarkdown, page.id) // verification path, see snapshot-from-mcp.mjs
            : await renderPageContent(page.id); // production path — throws -> aborts whole run, no writes yet
        content = rendered.markdown;
        bodyVideoUrl = rendered.bodyVideoUrl;
      }

      // Video resolution order: the "Video" property always wins when set.
      // Otherwise fall back to whatever body-embedded link renderPageContent
      // found THIS run — but only when content was actually re-rendered this
      // run; on an unchanged-by-timestamp page the body was never re-walked,
      // so reuse whatever video_url is already on the row instead of
      // wrongly clearing a body-detected video every time Notion is quiet.
      const video = getProp(page, 'Video') || (!unchangedByTimestamp ? bodyVideoUrl : existing?.video_url || null);

      // Drive sharing check — every run, regardless of unchangedByTimestamp
      // (see checkDriveVideoSharing for why). Non-Drive hosts (YouTube/Loom/
      // Vimeo) aren't actively probed — assumed fine, matching pre-existing
      // behaviour before this check existed.
      let videoStatus = null;
      let videoStatusReason = null;
      let videoCheckedAt = null;
      if (video) {
        const driveId = extractDriveFileId(video);
        if (driveId) {
          const check = await checkDriveVideoSharing(driveId);
          videoCheckedAt = new Date();
          if (check.ok === true) {
            videoStatus = 'ok';
          } else if (check.ok === false) {
            videoStatus = 'unreachable';
            videoStatusReason = check.reason;
          } else {
            // Inconclusive (network hiccup) — carry the previous verdict
            // forward rather than guess broken or fine.
            videoStatus = existing?.video_status ?? null;
            videoStatusReason = existing?.video_status_reason ?? null;
          }
        } else {
          videoStatus = 'ok';
        }
      }

      const previousVideoStatus = existing?.video_status ?? null;
      if (videoStatus === 'unreachable' && previousVideoStatus !== 'unreachable') {
        brokenVideoAlerts.push(`"${title}" (${category}): ${videoStatusReason}`);
      }

      const section = SECTION_MAP[category] || 'day_to_day';
      const productSlug = product.toLowerCase().replace(/\s+/g, '-');

      prepared.push({
        pageId: page.id,
        title,
        category,
        section,
        productSlug,
        order,
        video,
        videoStatus,
        videoStatusReason,
        videoCheckedAt,
        verified,
        targetStatus,
        lastEdited,
        content, // null means "unchanged, reuse row as-is except status/order/etc which are still cheap to refresh"
        existing,
      });
    }

    if (dryRun) {
      summary.ok = true;
      summary.dryRun = true;
      summary.prepared = prepared.map((p) => ({ title: p.title, status: p.targetStatus, changed: p.content !== null, videoStatus: p.videoStatus }));
      return summary;
    }

    // ---- WRITE PHASE: fetch succeeded end to end, safe to touch the DB ----
    await client.query('BEGIN');

    const seenPageIds = [];
    for (const p of prepared) {
      seenPageIds.push(p.pageId);

      // For truly unchanged pages we still refresh the cheap fields (status,
      // order, category, video, verified, title) in case Jerald only touched
      // a property, not the body — but skip touching `content` at all so an
      // unrelated property tweak never re-runs the image pipeline.
      const contentClause = p.content !== null;

      const cheapHash = computeHash({
        title: p.title,
        category: p.category,
        order: p.order,
        video: p.video,
        videoStatus: p.videoStatus,
        videoStatusReason: p.videoStatusReason,
        verified: p.verified,
        status: p.targetStatus,
        productSlug: p.productSlug,
        section: p.section,
        // content hash folded in only when we actually rendered it; otherwise
        // carry the previous hash forward untouched (compared below).
      });

      if (p.existing) {
        // Row already linked to this Notion page (either from the original
        // 2026-07-13 seed link, or a prior sync run).
        const { rows: hashRows } = await client.query('SELECT notion_content_hash FROM guides WHERE notion_page_id = $1', [p.pageId]);
        const priorHash = hashRows[0]?.notion_content_hash;
        const finalHash = contentClause ? computeHash({ cheapHash, content: p.content }) : priorHash;

        if (finalHash === priorHash && p.existing.status === p.targetStatus) {
          summary.unchanged += 1;
          await client.query('UPDATE guides SET last_synced_at = now() WHERE notion_page_id = $1', [p.pageId]);
          continue;
        }

        const setClauses = [
          'title = $2',
          'category = $3',
          'section = $4',
          'product_slug = $5',
          'order_index = $6',
          'video_url = $7',
          'content_type = $8',
          'video_status = $9',
          'video_status_reason = $10',
          'video_checked_at = $11',
          'notion_verified = $12',
          'status = $13',
          'notion_last_edited_time = $14',
          'notion_content_hash = $15',
          'last_synced_at = now()',
          'updated_at = now()',
          p.existing.status === 'live' && p.targetStatus !== 'live' ? 'archived_at = now()' : null,
        ].filter(Boolean);

        const values = [
          p.pageId,
          p.title,
          p.category,
          p.section,
          p.productSlug,
          p.order,
          p.video,
          p.video ? 'video' : 'article',
          p.videoStatus,
          p.videoStatusReason,
          p.videoCheckedAt,
          p.verified,
          p.targetStatus,
          p.lastEdited,
          finalHash,
        ];
        if (contentClause) {
          setClauses.push(`content = $${values.length + 1}`, `content_format = 'md'`);
          values.push(p.content);
        }
        await client.query(`UPDATE guides SET ${setClauses.join(', ')} WHERE notion_page_id = $1`, values);
        summary.updated += 1;
      } else {
        // Brand new guide, never seen before.
        const base = slugify(p.title);
        const slug = await uniqueSlug(client, base, p.pageId);
        const finalHash = computeHash({ cheapHash, content: p.content || '' });
        await client.query(
          `INSERT INTO guides (
             slug, category, title, summary, minutes, order_index, content_format, content,
             product_slug, section, content_type, video_url, video_status, video_status_reason,
             video_checked_at, notion_page_id,
             notion_last_edited_time, notion_content_hash, notion_verified, status, last_synced_at
           ) VALUES ($1,$2,$3,$4,$5,$6,'md',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19, now())`,
          [
            slug,
            p.category,
            p.title,
            deriveSummary(p.content, p.title),
            Math.max(1, Math.round((p.content || '').split(/\s+/).length / 200)),
            p.order,
            p.content || '',
            p.productSlug,
            p.section,
            p.video ? 'video' : 'article',
            p.video,
            p.videoStatus,
            p.videoStatusReason,
            p.videoCheckedAt,
            p.pageId,
            p.lastEdited,
            finalHash,
            p.verified,
            p.targetStatus,
          ]
        );
        summary.inserted += 1;
      }
    }

    // ---- Deletion / archival: anything linked to Notion but absent from
    // this run's result set is gone from the database's query results —
    // deleted, or archived beyond what /query returns. Never delete the row;
    // only ever flip it to 'archived' so it stops being visible and nothing
    // is lost.
    //
    // BLAST-RADIUS GUARD. An EMPTY Notion response is already refused upstream,
    // but a PARTIAL one (truncated pagination, a 5xx mid-page, a permission
    // change hiding rows) would otherwise be read as "everything else was
    // deleted" and would archive the entire client-facing help centre in one
    // transaction. This actually happened once during testing. So: if a single
    // run would archive a large share of the live corpus, refuse, roll back,
    // and shout. A real bulk delete by Jerald is rare and can be re-run with
    // ALLOW_BULK_ARCHIVE=1; a corrupted sync is not allowed to be silent.
    const { rows: [{ linked_total }] } = await client.query(
      `SELECT count(*)::int AS linked_total FROM guides
        WHERE notion_page_id IS NOT NULL AND status <> 'archived'`
    );
    const { rows: doomed } = await client.query(
      `SELECT slug FROM guides
        WHERE notion_page_id IS NOT NULL
          AND notion_page_id <> ALL($1::text[])
          AND status <> 'archived'`,
      [seenPageIds]
    );

    const BULK_ARCHIVE_LIMIT = 0.34; // more than a third disappearing at once is not a normal edit
    const wouldArchiveShare = linked_total > 0 ? doomed.length / linked_total : 0;
    const bulkOverride = process.env.ALLOW_BULK_ARCHIVE === '1';

    if (doomed.length >= 3 && wouldArchiveShare > BULK_ARCHIVE_LIMIT && !bulkOverride) {
      await client.query('ROLLBACK');
      const msg =
        `Notion sync REFUSED to archive ${doomed.length} of ${linked_total} guides in one run ` +
        `(${Math.round(wouldArchiveShare * 100)}% of the live help centre). This usually means Notion ` +
        `returned a partial result, not that the guides were really deleted. Nothing was changed and ` +
        `the portal is still serving the previous content. If this WAS a genuine bulk delete, re-run ` +
        `with ALLOW_BULK_ARCHIVE=1. Guides that would have gone: ${doomed.map((d) => d.slug).join(', ')}`;
      await alertInbox(msg);
      summary.ok = false;
      summary.errors.push(msg);
      console.error(`[notion-sync] ${msg}`);
      return summary;
    }

    const { rows: archivedRows } = await client.query(
      `UPDATE guides SET status = 'archived', archived_at = now(), last_synced_at = now()
       WHERE notion_page_id IS NOT NULL
         AND notion_page_id <> ALL($1::text[])
         AND status <> 'archived'
       RETURNING slug`,
      [seenPageIds]
    );
    summary.archived = archivedRows.length;

    await client.query('COMMIT');
    summary.ok = true;
    summary.brokenVideos = brokenVideoAlerts.length;

    // Alert AFTER commit (never before — a rollback must never be followed by
    // an alert about data that was never actually saved). Only fires the
    // moment a video newly turns unreachable, not on every 12-minute tick
    // while it stays broken — see the previousVideoStatus comparison above.
    if (brokenVideoAlerts.length) {
      await alertInbox(
        `${brokenVideoAlerts.length} guide video${brokenVideoAlerts.length > 1 ? 's are' : ' is'} not viewable — Google is showing a sign-in wall (or the file is missing/moved). Clients still see the written steps; fix sharing (Drive: Share -> "Anyone with the link") or the link itself in Notion.\n\n${brokenVideoAlerts.join('\n')}`
      );
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    const msg = `Notion sync failed mid-write: ${err.message}. Transaction rolled back — portal guides unchanged.`;
    await alertInbox(msg);
    summary.errors.push(msg);
  } finally {
    client.release();
  }

  return summary;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const snapshotArg = args.find((a) => a.startsWith('--snapshot='));
  let snapshotPages = null;
  if (snapshotArg) {
    const file = snapshotArg.split('=')[1];
    snapshotPages = JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  runSync({ dryRun, snapshotPages })
    .then((summary) => {
      console.log('[notion-sync]', JSON.stringify(summary, null, 2));
      process.exitCode = summary.ok ? 0 : 1;
    })
    .then(() => pool.end())
    .catch((err) => {
      console.error('[notion-sync] unexpected crash:', err);
      process.exitCode = 1;
      pool.end();
    });
}
