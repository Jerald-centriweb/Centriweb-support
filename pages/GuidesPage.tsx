import React, { useEffect } from 'react';
import { Routes, Route, useParams, Link, Navigate } from 'react-router-dom';
import { GUIDE_DATA } from '../data/guides';
import { GuideViewer } from '../components/Guide/GuideViewer';
import { Card } from '../components/ui/Card';
import { Book, ChevronRight, Search } from 'lucide-react';
import * as Icons from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { PageTransition } from '../components/ui/PageTransition';
import { useContent } from '../hooks/useContent';
import { analytics } from '../lib/analytics';

// Component to render dynamic icon by name
const IconRenderer = ({ name, className }: { name: string; className?: string }) => {
  const Icon = (Icons as any)[name] || Book;
  return <Icon className={className} />;
};

const CategoryList = () => {
  const { setSearchOpen } = useStore();
  const { categories, isLoading, useFallback } = useContent();

  // Track page view
  useEffect(() => {
    analytics.trackPageView('guides', 'Help Center Guides');
  }, []);

  // Use dynamic content if available, otherwise fallback to static GUIDE_DATA
  const guideData = categories.length > 0 ? categories : GUIDE_DATA;

  if (isLoading) {
    return (
      <PageTransition className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-centri-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading guides...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Help Center Guides</h1>
           <p className="text-slate-600 dark:text-slate-400">Browse our library of step-by-step tutorials and documentation.</p>
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full md:w-auto flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Search guides...</span>
          <kbd className="hidden md:inline-block ml-4 text-xs bg-slate-200 dark:bg-slate-900 px-1.5 rounded border border-slate-300 dark:border-slate-700">⌘K</kbd>
        </button>
      </div>

      {useFallback && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          ℹ️ Using static content. Connect Supabase to enable dynamic tenant-specific content.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {guideData.map((area) => (
          <Card key={area.id} className="hover:border-centri-500/50 transition-colors group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg text-centri-500 dark:text-centri-400 group-hover:text-centri-600 dark:group-hover:text-centri-300 group-hover:bg-centri-50 dark:group-hover:bg-centri-900/20 transition-colors">
                  <IconRenderer name={area.iconName} className="w-8 h-8" />
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                  {area.guides.length} guides
                </span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{area.title}</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 h-10">{area.description}</p>

              <div className="space-y-1">
                {area.guides.slice(0, 3).map(guide => (
                  <Link
                    key={guide.id}
                    to={`/guides/${area.id}/${guide.id}`}
                    className="flex items-center text-sm text-slate-500 dark:text-slate-500 hover:text-centri-600 dark:hover:text-centri-400 py-1.5 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 mr-1 opacity-50" />
                    <span className="truncate">{guide.title}</span>
                  </Link>
                ))}
                {area.guides.length > 3 && (
                   <div className="text-xs text-slate-400 dark:text-slate-600 pl-5 pt-1">+{area.guides.length - 3} more</div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageTransition>
  );
};

const GuideDetailWrapper = () => {
  const { areaId, guideId } = useParams();
  const { categories, isLoading } = useContent();

  // Use dynamic content if available, otherwise fallback to static GUIDE_DATA
  const guideData = categories.length > 0 ? categories : GUIDE_DATA;

  const area = guideData.find(a => a.id === areaId);
  const guide = area?.guides.find(g => g.id === guideId);

  if (isLoading) {
    return (
      <PageTransition className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-centri-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading guide...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!area || !guide) return <div className="p-8 text-center text-slate-500 dark:text-slate-500">Guide not found.</div>;

  return (
    <PageTransition className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Guide Sidebar (Desktop) */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24">
          <Link to="/guides" className="flex items-center text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 text-sm">
            <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back to Library
          </Link>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
             <IconRenderer name={area.iconName} className="w-4 h-4 text-centri-500 dark:text-centri-400" />
             {area.title}
          </h3>
          <nav className="space-y-1 border-l border-slate-200 dark:border-slate-800 ml-2">
            {area.guides.map(g => (
              <Link
                key={g.id}
                to={`/guides/${area.id}/${g.id}`}
                className={cn(
                  "block pl-4 py-1.5 text-sm border-l transition-colors -ml-px",
                  g.id === guideId
                    ? "border-centri-500 text-centri-600 dark:text-centri-400 font-medium"
                    : "border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                {g.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <GuideViewer guide={guide} category={area.id} />
      </div>
    </PageTransition>
  );
};

export const GuidesPage = () => {
  return (
    <Routes>
      <Route index element={<CategoryList />} />
      <Route path=":areaId/:guideId" element={<GuideDetailWrapper />} />
      <Route path="*" element={<Navigate to="/guides" replace />} />
    </Routes>
  );
};
