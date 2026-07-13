import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = '12h';

/**
 * Two ways to establish identity, per the brief:
 *  1. Login (email + password) — for a client who opens the portal directly.
 *  2. Embed token — a short-lived JWT we mint and hand to Jerald to bake into
 *     the GHL custom-menu-link URL (?token=...), so the iframe carries identity
 *     without any shared password. Both paths converge on the same JWT shape.
 */
export function signAccountToken(account) {
  return jwt.sign({ account_id: account.id, slug: account.slug }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export async function loginWithPassword(email, password) {
  // Uses the account_login_lookup() SECURITY DEFINER function, not a plain
  // SELECT — the accounts_self RLS policy would otherwise block this (correctly:
  // portal_app can't read a row it doesn't already have the id for). See
  // migrations/001_schema.sql for why this is the one deliberate exception.
  const { rows } = await pool.query('SELECT * FROM account_login_lookup($1)', [email]);
  const account = rows[0];
  if (!account) return null;
  const ok = await bcrypt.compare(password, account.password_hash);
  if (!ok) return null;
  return account;
}

/** Express middleware: requires a valid bearer (or ?token=) JWT, attaches req.account. */
export function requireAuth(req, res, next) {
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const token = bearer || req.query.token;
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.account = { id: payload.account_id, slug: payload.slug };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}
