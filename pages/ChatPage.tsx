import React, { useEffect } from 'react';
import { ChatInterface } from '../components/Chat/ChatInterface';
import { PageTransition } from '../components/ui/PageTransition';
import { analytics } from '../lib/analytics';

export const ChatPage = () => {
  // Track page view
  useEffect(() => {
    analytics.trackPageView('chat', 'AI Assistant');
  }, []);

  return (
    <PageTransition className="h-[calc(100vh-4rem)] max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 overflow-hidden">
      <div className="hidden lg:block w-80 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 h-full overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">CentriWeb AI</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
          Your personal assistant for GoHighLevel automation, CRM management, and account setup.
        </p>

        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Capabilities</h3>
          <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-centri-500 dark:text-centri-400 mt-0.5">✓</span> Explain complex features
            </li>
            <li className="flex items-start gap-2">
              <span className="text-centri-500 dark:text-centri-400 mt-0.5">✓</span> Recommend specific guides
            </li>
            <li className="flex items-start gap-2">
              <span className="text-centri-500 dark:text-centri-400 mt-0.5">✓</span> Troubleshoot common errors
            </li>
            <li className="flex items-start gap-2">
              <span className="text-centri-500 dark:text-centri-400 mt-0.5">✓</span> Draft email templates (coming soon)
            </li>
          </ul>
        </div>
      </div>

      <div className="flex-1 h-full border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-black/50">
        <ChatInterface className="h-full" />
      </div>
    </PageTransition>
  );
};
