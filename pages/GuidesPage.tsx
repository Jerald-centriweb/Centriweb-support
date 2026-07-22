import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, BookOpen, Video, Wrench, Receipt, ChevronRight, Clock, PlayCircle, AlertCircle } from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { Skeleton } from '../components/ui/Skeleton';
import { GuideViewer } from '../components/Guide/GuideViewer';
import { useStore } from '../store/useStore';
import { useContent } from '../hooks/useContent';
import { fetchGuideBySlug, hasWorkingVideo, getVideoThumbnail } from '../services/contentService';
import { Guide } from '../types';

// Restrained list-stagger for guide grids/rows — a small y-offset and a
// short delay between items, not a bouncy reveal. Framer's MotionConfig
// (see App.tsx) already turns this off for prefers-reduced-motion users.
const gridContainer = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const gridItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

const InlineError: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-3 py-8 px-5 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 text-red-700 dark:text-red-300">
    <AlertCircle className="w-5 h-5 flex-shrink-0" />
    <p className="text-sm">{message}</p>
  </div>
);

const SECTION_META: Record<string, { label: string; description: string; icon: any }> = {
  start_here: { label: 'Start here', description: 'The path every new client follows in their first week.', icon: Rocket },
  day_to_day: { label: 'Day-to-day guides', description: 'Running your pipeline once you are set up.', icon: BookOpen },
  money_and_documents: { label: 'Money and documents', description: 'Invoices, payments, and getting things signed.', icon: Receipt },
  troubleshooting: { label: 'Troubleshooting', description: 'Fix the most common problems yourself, fast.', icon: Wrench },
  videos: { label: 'Videos', description: 'Prefer to watch? Every walkthrough in one place.', icon: Video },
};

// Fixed display order for grouping the Videos view — matches the onboarding
// path elsewhere in the app rather than trusting Notion's free-text
// "Category" spelling/ordering.
const SECTION_ORDER: Guide['section'][] = ['start_here', 'day_to_day', 'money_and_documents', 'troubleshooting'];

const EmptyState: React.FC<{ label: string; title?: string }> = ({ label, title }) => (
  <div className="text-center py-20 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
    <BookOpen className="w-8 h-8 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
    <p className="text-slate-600 dark:text-slate-400 font-medium">{title || `Nothing published in ${label} yet.`}</p>
    <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
      Check back soon, or{' '}
      <Link to="/chat" className="text-centri-600 dark:text-centri-400 hover:underline">
        ask a question
      </Link>{' '}
      instead.
    </p>
  </div>
);

/** A single walkthrough card for the Videos view — thumbnail when one is
 * cheaply available (YouTube/Drive), a clean icon placeholder otherwise or if
 * the thumbnail 404s (an unshared Drive file's public thumbnail endpoint
 * fails the same way its embed does; onError just falls back silently). */
const VideoCard: React.FC<{ guide: Guide }> = ({ guide }) => {
  const thumb = guide.videoUrl ? getVideoThumbnail(guide.videoUrl) : null;
  const [thumbFailed, setThumbFailed] = useState(false);

  return (
    <Link
      to={`/guides/${guide.section}/${guide.id}`}
      className="group flex flex-col rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden hover:border-centri-500/50 hover:shadow-md transition-all"
    >
      <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
        {thumb && !thumbFailed ? (
          <img
            src={thumb}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            // Google's drive.google.com/thumbnail endpoint appears to swap in
            // a blank placeholder image (same 200 status, same dimensions —
            // so onError never fires) when it doesn't like the referrer of a
            // cross-origin <img> request. Suppressing the referrer entirely
            // gets the real thumbnail back.
            referrerPolicy="no-referrer"
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <PlayCircle className="w-10 h-10 text-slate-400 dark:text-slate-600" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
          <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <PlayCircle className="w-7 h-7 text-centri-600" />
          </div>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors line-clamp-2">
          {guide.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 line-clamp-2 flex-1">{guide.summary}</p>
        {guide.minutes ? (
          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-600 mt-3">
            <Clock className="w-3.5 h-3.5" /> {guide.minutes} min watch
          </div>
        ) : null}
      </div>
    </Link>
  );
};

const VideoGridSkeleton: React.FC = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-slate-200 dark:border-dark-border overflow-hidden">
        <Skeleton className="aspect-video rounded-none" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

/** Every guide with a working video, grouped by onboarding-path section
 * (fixed order, not Notion's free-text category spelling). A video that
 * failed its server-side Drive-sharing check never appears here — see
 * hasWorkingVideo — so a builder never lands on a card that leads to a
 * broken embed. */
const VideosView: React.FC = () => {
  const { guides, isLoading, error } = useContent();
  const { selectedProduct } = useStore();
  const meta = SECTION_META.videos;
  const Icon = meta.icon;

  const videoGuides = guides.filter((g) => (!selectedProduct || g.productSlug === selectedProduct) && hasWorkingVideo(g));

  const grouped = SECTION_ORDER.map((section) => ({
    section,
    label: SECTION_META[section]?.label || section,
    items: videoGuides.filter((g) => g.section === section),
  })).filter((group) => group.items.length > 0);

  return (
    <PageTransition className="max-w-5xl mx-auto">
      <div className="mb-10 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-centri-100 dark:bg-centri-900/20 text-centri-600 dark:text-centri-400 flex-shrink-0">
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mb-1">{meta.label}</h1>
          <p className="text-slate-600 dark:text-slate-400">{meta.description}</p>
        </div>
      </div>

      {isLoading ? (
        <VideoGridSkeleton />
      ) : error ? (
        <InlineError message={error} />
      ) : videoGuides.length === 0 ? (
        <EmptyState label="videos" title="No videos published yet." />
      ) : (
        <div className="space-y-10">
          {grouped.map((group) => (
            <div key={group.section}>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-4">{group.label}</h2>
              <motion.div
                variants={gridContainer}
                initial="hidden"
                animate="show"
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {group.items.map((g) => (
                  <motion.div key={g.id} variants={gridItem}>
                    <VideoCard guide={g} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
};

const SectionListSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    ))}
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
    return g.section === section;
  });

  return (
    <PageTransition className="max-w-4xl mx-auto">
      <div className="mb-10 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-centri-100 dark:bg-centri-900/20 text-centri-600 dark:text-centri-400 flex-shrink-0">
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mb-1">{meta.label}</h1>
          <p className="text-slate-600 dark:text-slate-400">{meta.description}</p>
        </div>
      </div>

      {isLoading ? (
        <SectionListSkeleton />
      ) : error ? (
        <InlineError message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState label={meta.label.toLowerCase()} />
      ) : (
        <motion.div variants={gridContainer} initial="hidden" animate="show" className="space-y-3">
          {filtered.map((g) => (
            <motion.div key={g.id} variants={gridItem}>
              <Link
                to={`/guides/${g.section}/${g.id}`}
                className="flex items-center gap-4 p-5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-centri-400/60 dark:hover:border-centri-500/50 hover:-translate-y-0.5 hover:shadow-md transition-all group"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-centri-500">
                  {hasWorkingVideo(g) ? <PlayCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
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
            </motion.div>
          ))}
        </motion.div>
      )}
    </PageTransition>
  );
};

const GuideDetailSkeleton: React.FC = () => (
  // Mirrors GuideViewer's real shape (badges, title, meta row, video block,
  // body copy) so the page doesn't visibly jump into place once the guide
  // loads — the single biggest thing missing from the old spinner-only state.
  <div className="max-w-3xl mx-auto">
    <div className="flex gap-2 mb-4">
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <Skeleton className="h-9 w-2/3 mb-4" />
    <Skeleton className="h-5 w-full mb-2" />
    <Skeleton className="h-5 w-1/2 mb-8" />
    <Skeleton className="aspect-video w-full rounded-2xl mb-10" />
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  </div>
);

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
      <PageTransition className="max-w-5xl mx-auto">
        <GuideDetailSkeleton />
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
    // max-w-5xl (not max-w-6xl) is deliberate: it matches content column
    // (max-w-3xl = 48rem) + gap-8 (2rem) + TableOfContents (w-56 = 14rem)
    // exactly (64rem = max-w-5xl). A wider cap left empty space to the right
    // whenever the TOC hides below the xl breakpoint, which read as the
    // video (or guide body) not filling its container.
    <PageTransition className="max-w-5xl mx-auto">
      <GuideViewer guide={guide} guidesInSection={guidesInSection} />
    </PageTransition>
  );
};

export const GuidesPage: React.FC = () => (
  <Routes>
    <Route index element={<Navigate to="start_here" replace />} />
    <Route path="videos" element={<VideosView />} />
    <Route path=":section" element={<SectionList />} />
    <Route path=":section/:slug" element={<GuideDetail />} />
    <Route path="*" element={<Navigate to="start_here" replace />} />
  </Routes>
);
