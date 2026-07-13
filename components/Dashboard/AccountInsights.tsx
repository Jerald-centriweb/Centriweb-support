import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpotlightCard } from '../ui/SpotlightCard';
import { Building2, MessageSquare, LifeBuoy, ArrowRight } from 'lucide-react';
import { apiFetch } from '../../services/authService';

/**
 * Re-pointed from the demo's reseller-agency "Connections & Shortcuts" card
 * (which linked out to named third-party integration settings pages) to what
 * is actually true for a single builder using a single product: their own
 * account, and the two ways to get help.
 */
export const AccountInsights: React.FC = () => {
  const navigate = useNavigate();
  const [account, setAccount] = useState<{ company_name?: string; slug?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setAccount(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SpotlightCard className="h-full bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-white/5 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-centri-500 dark:text-centri-400" />
          <h3 className="font-bold text-slate-900 dark:text-white tracking-tight">Your account</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 ml-7">
          {account?.company_name || 'Loading…'} · PreBuild
        </p>
      </div>

      <div className="flex-1 p-6 space-y-3">
        <button
          onClick={() => navigate('/chat')}
          className="w-full group flex items-center gap-4 p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/5 text-left"
        >
          <div className="p-2 bg-white dark:bg-slate-800/50 rounded-lg group-hover:bg-centri-500/10 transition-colors flex-shrink-0 shadow-sm">
            <MessageSquare className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-centri-500 dark:group-hover:text-centri-400 transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              Ask a question
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-1">Answers from the real guides, no guessing</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-centri-500 flex-shrink-0" />
        </button>

        <button
          onClick={() => navigate('/support')}
          className="w-full group flex items-center gap-4 p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/5 text-left"
        >
          <div className="p-2 bg-white dark:bg-slate-800/50 rounded-lg group-hover:bg-centri-500/10 transition-colors flex-shrink-0 shadow-sm">
            <LifeBuoy className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-centri-500 dark:group-hover:text-centri-400 transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              Raise a ticket
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-1">Goes straight to the CentriWeb team, tagged as you</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-centri-500 flex-shrink-0" />
        </button>
      </div>
    </SpotlightCard>
  );
};
