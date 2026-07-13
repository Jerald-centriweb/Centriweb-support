import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Guide } from '../../types';

interface GuideNavigationProps {
  guidesInSection: Guide[];
  currentSlug: string;
}

/** Previous/next within the same onboarding-path section — keeps the "Start
 * here" path feeling like an ordered walkthrough rather than a random list. */
export const GuideNavigation: React.FC<GuideNavigationProps> = ({ guidesInSection, currentSlug }) => {
  const idx = guidesInSection.findIndex((g) => g.id === currentSlug);
  if (idx === -1) return null;
  const prev = idx > 0 ? guidesInSection[idx - 1] : null;
  const next = idx < guidesInSection.length - 1 ? guidesInSection[idx + 1] : null;
  if (!prev && !next) return null;

  return (
    <div className="mt-16 pt-8 border-t border-slate-200 dark:border-white/5 grid grid-cols-2 gap-4">
      {prev ? (
        <Link
          to={`/guides/${prev.section}/${prev.id}`}
          className="group flex flex-col items-start gap-2 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-centri-600 dark:group-hover:text-centri-400">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Previous
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          to={`/guides/${next.section}/${next.id}`}
          className="group flex flex-col items-end gap-2 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-right"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-centri-600 dark:group-hover:text-centri-400">
            Next
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
};
