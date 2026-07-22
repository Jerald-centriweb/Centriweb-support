import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { LifeBuoy, FileText, Zap, CheckCircle2, MessageSquare, Clock, AlertCircle, Inbox } from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { analytics } from '../lib/analytics';
import { apiFetch, getToken } from '../services/authService';

/**
 * Real ticket submission — POSTs to /api/tickets, which persists the ticket
 * (isolated to the logged-in account via RLS) and pushes a notification into
 * the centri-agents OS inbox so it reaches Jerald. This replaces the previous
 * version of this page, which embedded a GoHighLevel form iframe
 * (link.centriweb.com) directly in client-facing UI — not allowed per the
 * "never expose GHL" rule, and also a dead end that never touched our own
 * ticket system at all.
 *
 * Ticket history (added): the page used to be submit-only, so a builder had
 * no way to ever see a reply Jerald sent from the OS Support panel — the
 * reply landed in the same `tickets` row (staff_reply/staff_reply_at/
 * replied_by, see server/index.js's GET /api/tickets) but nothing in this app
 * ever displayed it. This fetches the account's own past tickets (same
 * bearer-token auth as every other call here) and shows status + reply.
 */

type TicketStatus = 'open' | 'in_progress' | 'answered' | 'closed';

interface Ticket {
  id: string;
  subject: string;
  body: string;
  status: TicketStatus;
  created_at: string;
  staff_reply: string | null;
  staff_reply_at: string | null;
  replied_by: string | null;
}

const STATUS_STYLE: Record<TicketStatus, string> = {
  open: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  in_progress: 'bg-centri-500/10 text-centri-600 dark:text-centri-400',
  answered: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  closed: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  answered: 'Answered',
  closed: 'Closed',
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const TicketRow: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  const tone = STATUS_STYLE[ticket.status] || STATUS_STYLE.closed;
  const label = STATUS_LABEL[ticket.status] || ticket.status;
  // Guard rail: a ticket marked "answered" should always carry staff_reply
  // once server/index.js's GET /api/tickets selects it, but this front end
  // must never silently show an empty box if that invariant is ever broken -
  // an honest fallback line beats a blank space that looks like data loss.
  const answeredWithNoReplyText = ticket.status === 'answered' && !ticket.staff_reply;

  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-slate-900 dark:text-white">{ticket.subject}</h3>
        <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tone}`}>{label}</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap mb-3">{ticket.body}</p>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-3">
        <Clock className="w-3.5 h-3.5" /> Raised {formatWhen(ticket.created_at)}
      </div>

      {ticket.staff_reply && (
        <div className="rounded-lg bg-emerald-500/5 ring-1 ring-emerald-500/20 p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Reply from the PreBuild team{ticket.staff_reply_at ? ` · ${formatWhen(ticket.staff_reply_at)}` : ''}
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{ticket.staff_reply}</p>
        </div>
      )}

      {answeredWithNoReplyText && (
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800/60 p-4 text-sm text-slate-500 dark:text-slate-400">
          This ticket is marked answered but the reply text is not showing yet. Refresh in a moment, or raise a new ticket if it does not
          appear.
        </div>
      )}

      {!ticket.staff_reply && !answeredWithNoReplyText && ticket.status !== 'closed' && (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">Waiting on a reply from our team.</p>
      )}
    </div>
  );
};

export const SupportPage = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  // Guides are public, but tickets are account-scoped and stay behind
  // requireAuth server-side. Someone who opened the portal directly rather
  // than through the Help link in their dashboard has no account to file
  // against, so say so plainly instead of showing a form that would 401.
  const signedOut = !getToken();

  const loadTickets = useCallback(async () => {
    if (signedOut) {
      setTicketsLoading(false);
      return;
    }
    try {
      const res = await apiFetch('/api/tickets');
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
      setTicketsError(null);
    } catch {
      setTicketsError('Could not load your past tickets right now.');
    } finally {
      setTicketsLoading(false);
    }
  }, [signedOut]);

  useEffect(() => {
    analytics.trackPageView('support', 'Submit Ticket');
    loadTickets();
  }, [loadTickets]);

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
      loadTickets();
    } catch (err) {
      setError('Could not submit your ticket right now. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition className="max-w-6xl mx-auto space-y-10">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">Submit a ticket</h1>
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
              ) : signedOut ? (
                <div className="text-center py-10 space-y-3">
                  <LifeBuoy className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Open the Help link in your dashboard to raise a ticket</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                    Every guide here is yours to read. Tickets are tied to your account, so we need to know
                    who you are before you send one — the Help link inside your dashboard does that for you.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject</label>
                    <input
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-centri-500 focus:ring-2 focus:ring-centri-500/40 transition-all"
                      placeholder="What do you need help with?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Details</label>
                    <textarea
                      required
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={10}
                      className="w-full rounded-lg border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-centri-500 focus:ring-2 focus:ring-centri-500/40 transition-all resize-none"
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
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white mb-1">Your tickets</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-5">Everything you've raised with us, and any reply we've sent back.</p>

        {ticketsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : ticketsError ? (
          <div className="flex items-center gap-3 py-5 px-5 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{ticketsError}</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
            <Inbox className="w-8 h-8 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">You haven't raised any tickets yet.</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Anything you submit above will show up here, along with our reply.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => (
              <TicketRow key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};
