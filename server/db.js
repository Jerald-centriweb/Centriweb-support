import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  max: 10,
});

/**
 * Runs `fn` inside a transaction with `app.account_id` set as a session-local
 * config value. Every RLS policy in migrations/001_schema.sql keys off this
 * setting via current_setting('app.account_id', true) — so a request that
 * doesn't set it (or sets someone else's id) can never see another account's
 * rows, because the app connects as the unprivileged `portal_app` role which
 * does not bypass RLS.
 *
 * accountId may be null for guide reads that only require "some valid session"
 * (see the guides_read policy) — pass the real account id whenever available.
 */
export async function withAccount(accountId, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, true)', ['app.account_id', accountId || '']);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
