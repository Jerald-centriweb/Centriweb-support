#!/usr/bin/env node
// Run with: node --env-file=server/.env server/provision-account.mjs [options]
//
// The ONLY way a client account is ever created. There is no client-facing
// signup form and no auto-provisioning from an unrecognised location id —
// accounts are provisioned by us, keyed by the sub-account's real GHL
// location id, at onboarding time. This script inserts/updates the account
// row and prints the exact custom-menu-link URL to paste into that
// sub-account's GHL custom value (or the custom value itself, if the menu
// link is already configured to read `{{custom_values.support_portal_url}}`).
//
// Usage:
//   node server/provision-account.mjs \
//     --slug=acme-builders \
//     --company="Acme Builders Pty Ltd" \
//     --location=<GHL location id> \
//     [--clickup-list="Acme Builders"] \
//     [--rotate]   # bump token_version to invalidate any previously issued link
import fs from 'fs';
import pg from 'pg';

// auth.js reads JWT_SECRET at module load. The server process gets it from
// `node --env-file=server/.env` (see ecosystem.config.cjs), but this script is
// run by hand from the shell, where that flag is absent — so the secret must be
// loaded into the environment BEFORE auth.js is imported, or signing throws
// "secretOrPrivateKey must have a value". Hence the dynamic import below.
function loadServerEnv() {
  const envPath = new URL('./.env', import.meta.url);
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadServerEnv();
const { signEmbedToken } = await import('./auth.js');

// Provisioning writes to `accounts` (create/update a client), which the
// RLS-restricted runtime role `portal_app` is deliberately NOT allowed to do
// (it only has a self-read policy — see migrations/001/002). This is an admin
// operation run by us on the VPS, not an HTTP-exposed path, so it connects as
// the Postgres superuser instead, reading the password straight out of
// .secrets/portal_pg.env rather than server/.env.
function readSecret(path, name) {
  const text = fs.readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim();
  }
  throw new Error(`${name} not found in ${path}`);
}

const pool = new pg.Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT) || 5502,
  database: process.env.PGDATABASE || 'portal',
  user: 'postgres',
  password: readSecret(new URL('../.secrets/portal_pg.env', import.meta.url), 'PGPASSWORD'),
});

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--([a-z-]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.slug || !args.company || !args.location) {
    console.error(
      'Usage: node server/provision-account.mjs --slug=<slug> --company="<name>" --location=<ghl_location_id> [--clickup-list="<name>"] [--rotate]'
    );
    process.exit(1);
  }

  const existing = await pool.query('SELECT id, token_version FROM accounts WHERE slug = $1', [args.slug]);

  let account;
  if (existing.rows[0]) {
    const tokenVersion = args.rotate ? existing.rows[0].token_version + 1 : existing.rows[0].token_version;
    const result = await pool.query(
      `UPDATE accounts SET company_name = $1, ghl_location_id = $2, clickup_list_name = COALESCE($3, clickup_list_name),
         token_version = $4, active = true
       WHERE slug = $5 RETURNING id, slug, token_version`,
      [args.company, args.location, args['clickup-list'] || null, tokenVersion, args.slug]
    );
    account = result.rows[0];
    console.log(`Updated existing account "${args.slug}"${args.rotate ? ' (token rotated - old link is now dead)' : ''}.`);
  } else {
    const result = await pool.query(
      `INSERT INTO accounts (slug, company_name, ghl_location_id, clickup_list_name, is_internal, token_version)
       VALUES ($1,$2,$3,$4,false,1) RETURNING id, slug, token_version`,
      [args.slug, args.company, args.location, args['clickup-list'] || null]
    );
    account = result.rows[0];
    console.log(`Created account "${args.slug}".`);
  }

  const token = signEmbedToken(account);
  const base = process.env.PORTAL_PUBLIC_URL || 'https://portal.centriweb.info';
  console.log('\nPaste this as the sub-account custom value (e.g. support_portal_url):\n');
  console.log(`${base}/?token=${token}\n`);
  console.log('This link does not expire in practice (400 days) but can be revoked instantly by re-running');
  console.log('this script with --rotate, without touching the GHL custom value at all.');

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
