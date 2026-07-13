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

  return (
    <nav className="flex items-center gap-2 text-sm min-w-0 overflow-hidden">
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
              <span className="text-slate-900 dark:text-white font-medium truncate">{labelFor(seg)}</span>
            ) : (
              <Link to={to} className="text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white truncate">
                {labelFor(seg)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
