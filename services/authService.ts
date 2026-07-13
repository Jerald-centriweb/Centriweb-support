/**
 * Identity for the portal has exactly two paths:
 *  1. EMBED — the only client path. The GHL custom-menu-link carries
 *     ?token=<jwt> (signed by us at onboarding time, see
 *     server/provision-account.mjs) so the iframe opens straight into the
 *     right account. We capture it once and keep it in localStorage; there
 *     is no client-facing login form anywhere in this app.
 *  2. INTERNAL — a separate admin-only login (see internalLogin below),
 *     reachable only at #/internal-login, for Jerald/us to preview the
 *     portal without an embed link. Never surfaced in client navigation.
 *
 * There is no server-side session/cookie — every API call attaches
 * `Authorization: Bearer <token>` explicitly, which also sidesteps iframe
 * third-party-cookie restrictions entirely.
 */

const TOKEN_KEY = 'pb_portal_token';

export function captureEmbedTokenFromUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    params.delete('token');
    const rest = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash);
    return true;
  }
  return false;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Internal admin login only — never called from client-facing UI. */
export async function internalLogin(email: string, password: string): Promise<boolean> {
  const res = await fetch('/api/internal/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  setToken(data.token);
  return true;
}

/** Fetch wrapper that attaches the bearer token to every portal API call. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(path, { ...init, headers });
}
