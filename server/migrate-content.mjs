// One-time content migration: ports the 10 guides from /opt/support-centre
// (source md/html in src/, guides.json manifest, shots/ screenshots, ordering,
// categories) into the portal Postgres `guides` table. Does not touch
// /opt/support-centre in any way (read-only).
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const SRC_DIR = '/opt/support-centre';
const SHOTS_SRC = path.join(SRC_DIR, 'shots');
const SHOTS_DEST = '/opt/support-portal/public/shots';

const manifest = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'guides.json'), 'utf8'));

// Copy every screenshot across so guide content that references /shots/<file>.png
// keeps working when served from the portal instead of the help centre.
fs.mkdirSync(SHOTS_DEST, { recursive: true });
for (const file of fs.readdirSync(SHOTS_SRC)) {
  fs.copyFileSync(path.join(SHOTS_SRC, file), path.join(SHOTS_DEST, file));
}
console.log(`[migrate-content] copied ${fs.readdirSync(SHOTS_DEST).length} screenshots to ${SHOTS_DEST}`);

function loadBody(slug) {
  const mdPath = path.join(SRC_DIR, 'src', `${slug}.md`);
  const htmlPath = path.join(SRC_DIR, 'src', `${slug}.html`);
  if (fs.existsSync(mdPath)) {
    return { format: 'md', content: fs.readFileSync(mdPath, 'utf8') };
  }
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    // Screenshots are referenced relative to the help centre root (shots/xyz.png);
    // rewrite to the portal's own static path.
    html = html.replace(/(["'(])shots\//g, '$1/shots/');
    return { format: 'html', content: html };
  }
  throw new Error(`No source found for guide "${slug}"`);
}

const client = new pg.Client({
  host: '127.0.0.1',
  port: 5502,
  user: 'postgres',
  password: process.env.PGPASSWORD,
  database: 'portal',
});

await client.connect();

let orderIndex = 0;
for (const g of manifest.guides) {
  const { format, content } = loadBody(g.slug);
  orderIndex += 1;
  await client.query(
    `INSERT INTO guides (slug, category, title, summary, minutes, order_index, content_format, content)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (slug) DO UPDATE SET
       category = EXCLUDED.category, title = EXCLUDED.title, summary = EXCLUDED.summary,
       minutes = EXCLUDED.minutes, order_index = EXCLUDED.order_index,
       content_format = EXCLUDED.content_format, content = EXCLUDED.content,
       updated_at = now()`,
    [g.slug, g.category, g.title, g.desc, g.minutes, orderIndex, format, content]
  );
  console.log(`[migrate-content] upserted guide: ${g.slug} (${format}, category="${g.category}")`);
}

const { rows } = await client.query('SELECT count(*)::int AS n FROM guides');
console.log(`[migrate-content] done — ${rows[0].n} guides now in portal DB`);
await client.end();
