import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LifeBuoy, FileText, Zap, CheckCircle2 } from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { analytics } from '../lib/analytics';
import { apiFetch } from '../services/authService';

/**
 * Real ticket submission — POSTs to /api/tickets, which persists the ticket
 * (isolated to the logged-in account via RLS) and pushes a notification into
 * the centri-agents OS inbox so it reaches Jerald. This replaces the previous
 * version of this page, which embedded a GoHighLevel form iframe
 * (link.centriweb.com) directly in client-facing UI — not allowed per the
 * "never expose GHL" rule, and also a dead end that never touched our own
 * ticket system at all.
 */
export const SupportPage = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analytics.trackPageView('support', 'Submit Ticket');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({ subject, body, source: 'portal' }),
      });
      if (!res.ok) throw new Error(`Ticket submission failed (${res.status})`);
      setSubmitted(true);
      analytics.trackTicketSubmit('general', 'normal', subject);
    } catch (err) {
      setError('Could not submit your ticket right now. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Submit a Ticket</h1>
          <p className="text-slate-600 dark:text-slate-400">Our team usually responds within 2-4 hours during business days.</p>
        </div>

        <Card className="bg-gradient-to-br from-blue-500/10 to-slate-100 dark:from-blue-900/20 dark:to-slate-900/50 border-blue-200 dark:border-blue-800/30">
          <div className="p-5">
            <h3 className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold mb-3">
              <Zap className="w-4 h-4 text-yellow-500 dark:text-yellow-400" /> Before you submit...
            </h3>
            <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex gap-2">
                <span className="text-slate-400 dark:text-slate-500">1.</span> Check the <strong>Guides</strong> section for instant answers.
              </li>
              <li className="flex gap-2">
                <span className="text-slate-400 dark:text-slate-500">2.</span> Ask the <strong>AI Assistant</strong> to troubleshoot.
              </li>
              <li className="flex gap-2">
                <span className="text-slate-400 dark:text-slate-500">3.</span> Include as much detail as possible.
              </li>
            </ul>
          </div>
        </Card>

        <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-dark-border">
          <h4 className="text-slate-900 dark:text-white font-medium mb-2 flex items-center gap-2"><LifeBuoy className="w-4 h-4" /> Urgent?</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">If your dashboard is completely down, say so in the subject line and we'll treat it as a priority.</p>
        </div>
      </div>

      <div className="lg:col-span-2">
        <Card className="bg-white dark:bg-dark-card h-full">
          <div className="p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center py-16 gap-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Ticket sent</h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-sm">
                  We've logged your ticket and let our team know. You'll hear back within our usual response time.
                </p>
                <Button onClick={() => { setSubmitted(false); setSubject(''); setBody(''); }}>Submit another ticket</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                  <input
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-2 text-slate-900 dark:text-white"
                    placeholder="What do you need help with?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Details</label>
                  <textarea
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={10}
                    className="w-full rounded-lg border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-2 text-slate-900 dark:text-white"
                    placeholder="Tell us what you were trying to do and what happened instead."
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <FileText className="w-4 h-4" /> Tickets are private to your account only.
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Submit Ticket'}
                </Button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
};
