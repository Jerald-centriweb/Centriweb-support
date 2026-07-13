import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '../../services/authService';

/**
 * Greets by the account's real company name (from /api/auth/me — the
 * account this embed token belongs to), not a generic reseller "agency"
 * name. There is exactly one builder behind any given load of this page.
 */
export const DashboardHeader: React.FC = () => {
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.company_name) setCompanyName(data.company_name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12) greeting = 'Good afternoon';
  if (hour >= 17) greeting = 'Good evening';

  return (
    <div className="flex flex-col gap-1">
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-2"
      >
        <span className="h-px w-8 bg-centri-500/50" />
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-centri-500 dark:text-centri-400">
          PreBuild Help Centre
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, filter: 'blur(5px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight"
      >
        {greeting}{companyName ? `, ${companyName}` : ''}.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.25 }}
        className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-md"
      >
        Guides, video walkthroughs, and support for your PreBuild dashboard.
      </motion.p>
    </div>
  );
};
