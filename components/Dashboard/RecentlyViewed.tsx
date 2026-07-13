import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useContent } from '../../hooks/useContent';
import { SpotlightCard } from '../ui/SpotlightCard';

const SECTION_LABELS: Record<string, string> = {
  start_here: 'Start here',
  day_to_day: 'Day-to-day',
  troubleshooting: 'Troubleshooting',
};

export const RecentlyViewed: React.FC = () => {
  const { viewedGuides } = useStore();
  const { guides, isLoading } = useContent();

  if (isLoading) return null;

  const history = viewedGuides.map((id) => guides.find((g) => g.id === id)).filter(Boolean) as typeof guides;

  const isFallback = history.length === 0;
  const display = isFallback ? guides.filter((g) => g.section === 'start_here').slice(0, 3) : history.slice(0, 3);

  if (display.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-4 px-1">
        {isFallback ? <Sparkles className="w-4 h-4 text-centri-500" /> : <Clock className="w-4 h-4 text-slate-500" />}
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
          {isFallback ? 'Suggested for you' : 'Jump back in'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {display.map((guide) => (
          <SpotlightCard key={guide.id} className="group h-full">
            <Link to={`/guides/${guide.section}/${guide.id}`} className="block p-5 h-full flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-centri-600 dark:text-centri-400 uppercase tracking-widest bg-centri-50 dark:bg-centri-900/20 px-2 py-1 rounded">
                  {SECTION_LABELS[guide.section] || guide.section}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-centri-500 group-hover:-rotate-45 transition-all" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors mb-1">
                {guide.title}
              </h4>
              {guide.summary && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-auto line-clamp-2 font-light">{guide.summary}</p>
              )}
            </Link>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
};
