import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool, { withAccount } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const EMBED_TOKEN_TTL = '400d'; // long-lived: baked once into a GHL custom value, not re-issued per session
const INTERNAL_TOKEN_TTL = '12h';

/**
 * Identity for the portal has exactly two paths, and they are kept deliberately
 * separate so neither can be confused for the other:
 *
 *  1. EMBED (the only client path). A builder never sees a login screen. When
 *     we onboard a client (server/provision-account.mjs) we mint a signed JWT
 *     bound to that account's row and hand Jerald the full custom-menu-link
 *     URL (?token=...) to paste into that sub-account's GHL custom value.
 *     The browser captures it once on first load (services/authService.ts)
 *     and attaches it as a bearer token on every request after that. Because
 *     the token is signed with JWT_SECRET, a client editing the URL query
 *     string cannot forge another account's identity — they would need our
 *     server's secret, not just another account's id. See MULTI_TENANT... no,
 *     see the identity note in server/index.js for the residual-risk write-up.
 *
 *  2. INTERNAL login (email + password) — for Jerald/us only, to preview the
 *     portal without an embed link. Enforced at the SQL layer, not just in
 *     application code: account_login_lookup() (migrations/002) only ever
 *     returns rows where is_internal = true, so a client account can never
 *     authenticate this way even if a password_hash were mistakenly set.
 */
export function signEmbedToken(account) {
  return jwt.sign(
    { account_id: account.id, slug: account.slug, via: 'embed', tv: account.token_version },
    JWT_SECRET,
    { expiresIn: EMBED_TOKEN_TTL }
  );
}

export function signInternalToken(account) {
  return jwt.sign(
    { account_id: account.id, slug: account.slug, via: 'internal' },
    JWT_SECRET,
    { expiresIn: INTERNAL_TOKEN_TTL }
  );
}

export async function loginWithPassword(email, password) {
  // account_login_lookup() is SECURITY DEFINER and filters to is_internal = true
  // at the SQL layer (migrations/002_product_embed_clickup.sql) — this is not
  // just an application-level check, so there is no code path anywhere that
  // lets a client account authenticate with a password.
  const { rows } = await pool.query('SELECT * FROM account_login_lookup($1)', [email]);
  const account = rows[0];
  if (!account) return null;
  const ok = await bcrypt.compare(password, account.password_hash);
  if (!ok) return null;
  return account;
}

/**
 * Express middleware: requires a valid bearer (or ?token=) JWT, attaches
 * req.account. For embed-sourced tokens, also re-checks the token version
 * against the live accounts row on every request — this is how we revoke a
 * leaked or superseded embed link instantly (bump accounts.token_version)
 * without needing to touch the GHL custom value at all.
 */
export function requireAuth(req, res, next) {
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const token = bearer || req.query.token;
  if (!token) return res.status(401).json({ error: 'missing token' });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }

  req.account = { id: payload.account_id, slug: payload.slug, via: payload.via };

  if (payload.via === 'embed') {
    // Must run through withAccount() — accounts_self RLS only allows a
    // connection to read the row matching its own app.account_id session
    // setting. A plain pool.query() here (tried once, caught by testing
    // before this ever reached a client) silently returns zero rows for
    // every account, which read as "revoked" for 100% of embed tokens.
    withAccount(payload.account_id, (c) => c.query('SELECT token_version, active FROM accounts WHERE id = $1', [payload.account_id]))
      .then(({ rows }) => {
        const acct = rows[0];
        if (!acct || !acct.active || acct.token_version !== payload.tv) {
          return res.status(401).json({ error: 'embed link revoked, contact CentriWeb for a new one' });
        }
        next();
      })
      .catch((err) => {
        console.error('[auth] token-version check failed:', err.message);
        res.status(500).json({ error: 'internal error' });
      });
    return;
  }

  next();
}
