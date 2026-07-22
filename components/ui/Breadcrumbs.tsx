import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const LABELS: Record<string, string> = {
  guides: 'Guides',
  start_here: 'Start here',
  day_to_day: 'Day-to-day guides',
  videos: 'Videos',
  troubleshooting: 'Troubleshooting',
  chat: 'Ask a question',
  support: 'Raise a ticket',
};

function labelFor(segment: string): string {
  return LABELS[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const Breadcrumbs: React.FC<{ path: string }> = ({ path }) => {
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0) {
    return <span className="text-slate-900 dark:text-white font-semibold text-sm">Home</span>;
  }

  const lastLabel = labelFor(segments[segments.length - 1]);

  return (
    <>
      {/* Full trail from sm upward. Each link/span carries its own min-w-0 —
          without it, a flex item's default min-width:auto refuses to shrink
          below its own content size, so "truncate" never actually engages
          and the parent's overflow-hidden just hard-clips mid-word instead. */}
      <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-sm min-w-0 overflow-hidden">
        <Link to="/" className="text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white flex-shrink-0">
          Home
        </Link>
        {segments.map((seg, idx) => {
          const to = '/' + segments.slice(0, idx + 1).join('/');
          const isLast = idx === segments.length - 1;
          return (
            <React.Fragment key={to}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-700 flex-shrink-0" />
              {isLast ? (
                <span className="text-slate-900 dark:text-white font-medium truncate min-w-0">{labelFor(seg)}</span>
              ) : (
                <Link to={to} className="text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white truncate min-w-0">
                  {labelFor(seg)}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Collapsed to Home -> current page below sm. A full trail, plus the
          header's own hamburger button and theme toggle, reliably ran out of
          room on a 375px phone; the full path is still one tap away via the
          sidebar/mobile nav, so nothing is actually lost by collapsing it. */}
      <nav aria-label="Breadcrumb" className="flex sm:hidden items-center gap-2 text-sm min-w-0 overflow-hidden">
        <Link to="/" className="text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white flex-shrink-0">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-700 flex-shrink-0" />
        <span className="text-slate-900 dark:text-white font-medium truncate min-w-0">{lastLabel}</span>
      </nav>
    </>
  );
};
