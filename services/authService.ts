/**
 * Identity for the portal. Two ways in, both converging on the same JWT:
 *  1. Login form (email + password) for a client opening the portal directly.
 *  2. Embed token: Jerald's GHL custom-menu-link carries ?token=<jwt> so the
 *     iframe on app.centriweb.com opens straight into the right account with
 *     no shared password. We capture it once and keep it in localStorage.
 *
 * There is no server-side session/cookie — every API call attaches
 * `Authorization: Bearer <token>` explicitly, which also sidesteps iframe
 * third-party-cookie restrictions entirely.
 */

const TOKEN_KEY = 'pb_portal_token';

export function captureEmbedTokenFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    params.delete('token');
    const rest = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (rest ? `?${rest}` : ''));
  }
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

export async function login(email: string, password: string): Promise<boolean> {
  const res = await fetch('/api/auth/login', {
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
