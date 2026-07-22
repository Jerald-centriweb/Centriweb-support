import React, { useEffect, useState } from 'react';
import { captureEmbedTokenFromUrl, getToken, internalLogin, apiFetch, clearToken } from '../../services/authService';

/**
 * Establishes identity where identity is available, but never blocks on it.
 *
 *  - EMBED (the client path): captures ?token=... from the URL (baked into
 *    the GHL custom menu link at onboarding), verifies it against
 *    /api/auth/me, and renders straight through. No form, no typing, nothing
 *    to configure — the builder just clicks the menu item.
 *  - INTERNAL (#/internal-login, Jerald/us only): a small, clearly separate
 *    admin sign-in so we can preview the portal without an embed link. It is
 *    never linked from anywhere in the client-facing navigation.
 *  - ANONYMOUS: the portal renders anyway.
 *
 * Anonymous used to hit a hard "open this from your dashboard" stop. That gate
 * is gone: the guide content is the same for every client today, and
 * /api/guides, /api/guides/:slug and /api/products are all unauthenticated in
 * server/index.js already, so browsing needs no identity at all. Blocking on
 * it only meant a link shared outside GHL looked broken.
 *
 * Identity still matters for the ACCOUNT-SCOPED surfaces — tickets and chat —
 * which stay behind requireAuth server-side and are RLS-scoped per account.
 * Those surfaces check getToken() and explain themselves rather than failing;
 * nothing here weakens what the server enforces.
 *
 * When the client base grows and guides need to differ per client, this is
 * where that decision goes back in — but as content filtering driven by the
 * embed token, not as a wall in front of the whole portal.
 */
export const LoginGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [showInternalForm, setShowInternalForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const verify = async () => {
    setChecking(true);
    captureEmbedTokenFromUrl();
    if (!getToken()) {
      setAuthed(false);
      setChecking(false);
      return;
    }
    const res = await apiFetch('/api/auth/me');
    if (!res.ok) clearToken();
    setAuthed(res.ok);
    setChecking(false);
  };

  useEffect(() => {
    setShowInternalForm(window.location.hash.startsWith('#/internal-login'));
    verify();
  }, []);

  const handleInternalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const ok = await internalLogin(email, password);
    setSubmitting(false);
    if (ok) {
      window.location.hash = '#/';
      setAuthed(true);
      setShowInternalForm(false);
    } else {
      setError('Incorrect email or password.');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <div className="w-10 h-10 border-4 border-centri-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authed) return <>{children}</>;

  if (showInternalForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg px-4">
        <form
          onSubmit={handleInternalSubmit}
          className="w-full max-w-sm bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-8 shadow-xl space-y-4"
        >
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Internal sign in</h1>
          <p className="text-xs text-slate-500 dark:text-slate-500">CentriWeb staff only. Clients never see this screen.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-centri-600 hover:bg-centri-500 text-white rounded-lg py-2 font-medium disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  // No identity: render the portal anyway. Guides are public; the
  // account-scoped surfaces handle their own signed-out state.
  return <>{children}</>;
};
