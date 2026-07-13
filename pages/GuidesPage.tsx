import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams, Link } from 'react-router-dom';
import { Rocket, BookOpen, Video, Wrench, ChevronRight, Clock, PlayCircle, Loader2 } from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { GuideViewer } from '../components/Guide/GuideViewer';
import { useStore } from '../store/useStore';
import { useContent } from '../hooks/useContent';
import { fetchGuideBySlug } from '../services/contentService';
import { Guide } from '../types';

const SECTION_META: Record<string, { label: string; description: string; icon: any }> = {
  start_here: { label: 'Start here', description: 'The path every new client follows in their first week.', icon: Rocket },
  day_to_day: { label: 'Day-to-day guides', description: 'Running your pipeline once you are set up.', icon: BookOpen },
  troubleshooting: { label: 'Troubleshooting', description: 'Fix the most common problems yourself, fast.', icon: Wrench },
  videos: { label: 'Videos', description: 'Prefer to watch? Every video guide in one place.', icon: Video },
};

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-center py-20 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
    <BookOpen className="w-8 h-8 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
    <p className="text-slate-600 dark:text-slate-400 font-medium">Nothing published in {label} yet.</p>
    <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
      Check back soon, or{' '}
      <Link to="/chat" className="text-centri-600 dark:text-centri-400 hover:underline">
        ask a question
      </Link>{' '}
      instead.
    </p>
  </div>
);

const SectionList: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const { guides, isLoading, error } = useContent();
  const { selectedProduct } = useStore();
  const meta = SECTION_META[section || ''] || SECTION_META.day_to_day;
  const Icon = meta.icon;

  const filtered = guides.filter((g) => {
    if (selectedProduct && g.productSlug !== selectedProduct) return false;
    if (section === 'videos') return g.contentType === 'video' || g.contentType === 'mixed';
    return g.section === section;
  });

  return (
    <PageTransition className="max-w-4xl mx-auto">
      <div className="mb-10 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-centri-100 dark:bg-centri-900/20 text-centri-600 dark:text-centri-400 flex-shrink-0">
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{meta.label}</h1>
          <p className="text-slate-600 dark:text-slate-400">{meta.description}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-centri-500" />
        </div>
      ) : error ? (
        <p className="text-center text-red-500 py-16">{error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState label={meta.label.toLowerCase()} />
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => (
            <Link
              key={g.id}
              to={`/guides/${g.section}/${g.id}`}
              className="flex items-center gap-4 p-5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-centri-500/50 hover:shadow-md transition-all group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-centri-500">
                {g.contentType !== 'article' ? <PlayCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors truncate">
                  {g.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-500 truncate">{g.summary}</p>
              </div>
              {g.minutes ? (
                <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-600 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" /> {g.minutes} min
                </div>
              ) : null}
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-centri-500 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </PageTransition>
  );
};

const GuideDetail: React.FC = () => {
  const { slug } = useParams<{ section: string; slug: string }>();
  const { guides } = useContent();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetchGuideBySlug(slug || '').then((g) => {
      if (cancelled) return;
      if (!g) setNotFound(true);
      else setGuide(g);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <PageTransition className="max-w-4xl mx-auto flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-centri-500" />
      </PageTransition>
    );
  }

  if (notFound || !guide) {
    return (
      <PageTransition className="max-w-4xl mx-auto py-20 text-center text-slate-500 dark:text-slate-500">
        Guide not found.
      </PageTransition>
    );
  }

  const guidesInSection = guides.filter((g) => g.section === guide.section && g.productSlug === guide.productSlug);

  return (
    <PageTransition className="max-w-6xl mx-auto">
      <GuideViewer guide={guide} guidesInSection={guidesInSection} />
    </PageTransition>
  );
};

export const GuidesPage: React.FC = () => (
  <Routes>
    <Route index element={<Navigate to="start_here" replace />} />
    <Route path=":section" element={<SectionList />} />
    <Route path=":section/:slug" element={<GuideDetail />} />
    <Route path="*" element={<Navigate to="start_here" replace />} />
  </Routes>
);
