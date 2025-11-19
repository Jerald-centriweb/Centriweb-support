import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { GUIDE_DATA } from '../../data/guides';
import { cn } from '../../lib/utils';

interface RelatedGuidesProps {
  relatedGuideIds?: string[];
  currentGuideId: string;
  className?: string;
}

export const RelatedGuides: React.FC<RelatedGuidesProps> = ({
  relatedGuideIds,
  currentGuideId,
  className
}) => {
  if (!relatedGuideIds || relatedGuideIds.length === 0) return null;

  // Find the related guides
  const relatedGuides = relatedGuideIds
    .map(id => {
      for (const area of GUIDE_DATA) {
        const guide = area.guides.find(g => g.id === id);
        if (guide) {
          return { guide, area };
        }
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 3); // Show max 3 related guides

  if (relatedGuides.length === 0) return null;

  return (
    <div className={cn("border-t border-slate-200 dark:border-slate-800 pt-8 mt-12", className)}>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-centri-500" />
        Related Guides
      </h3>

      <div className="grid md:grid-cols-3 gap-4">
        {relatedGuides.map(({ guide, area }) => (
          <Link
            key={guide.id}
            to={`/guides/${area.id}/${guide.id}`}
            className="group flex flex-col p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-centri-500/50 dark:hover:border-centri-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-centri-600 dark:text-centri-400 uppercase tracking-wide">
                {area.title}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-centri-500 group-hover:translate-x-1 transition-all" />
            </div>

            <h4 className="font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors line-clamp-2">
              {guide.title}
            </h4>

            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 flex-1">
              {guide.summary}
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {guide.timeToRead}
              </span>
              {guide.tags.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {guide.tags[0]}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
