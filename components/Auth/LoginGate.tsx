import React, { useEffect, useState } from 'react';
import { captureEmbedTokenFromUrl, getToken, login, apiFetch } from '../../services/authService';

/**
 * Establishes identity before rendering the portal:
 *  - If a GHL embed token (?token=...) is present in the URL, capture it.
 *  - If we already hold a valid token, verify it against /api/auth/me and
 *    render straight through.
 *  - Otherwise show a login form (email + password) that only ever proves
 *    identity for ONE account — this is the "not a shared password" boundary
 *    the per-account isolation model depends on.
 */
export const LoginGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
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
    setAuthed(res.ok);
    setChecking(false);
  };

  useEffect(() => {
    verify();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const ok = await login(email, password);
    setSubmitting(false);
    if (ok) {
      setAuthed(true);
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

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg px-4">
        <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-8 shadow-xl space-y-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sign in to your dashboard</h1>
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

  return <>{children}</>;
};
