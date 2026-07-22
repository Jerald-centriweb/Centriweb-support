import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import { SpotlightCard } from '../ui/SpotlightCard';
import { Skeleton } from '../ui/Skeleton';
import { useStore } from '../../store/useStore';
import { useContent } from '../../hooks/useContent';

/**
 * Real "Start here" progress — computed from the actual start_here guides
 * for the selected product against viewedGuides (tracked locally, no
 * fabricated task list). This is the onboarding path itself, not a demo of
 * gamification unrelated to the real content.
 */
export const OnboardingWidget: React.FC = () => {
  const navigate = useNavigate();
  const { viewedGuides } = useStore();
  const { guides, isLoading } = useContent();

  // Loading gets a skeleton in the widget's real shape rather than nothing —
  // returning null while data loads, then popping the whole card in once it
  // arrives, is exactly the layout jump the rest of the app is being fixed
  // to avoid.
  if (isLoading) {
    return (
      <div className="mb-10 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-dark-card p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
        <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3 w-full">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-2 w-full max-w-md rounded-full" />
        </div>
        <Skeleton className="w-full md:w-[260px] h-28 rounded-xl flex-shrink-0" />
      </div>
    );
  }

  const startHere = guides.filter((g) => g.section === 'start_here');
  if (startHere.length === 0) return null;

  const completedCount = startHere.filter((g) => viewedGuides.includes(g.id)).length;
  const total = startHere.length;
  const progress = (completedCount / total) * 100;
  const nextGuide = startHere.find((g) => !viewedGuides.includes(g.id));
  const guideNoun = total === 1 ? 'guide' : 'guides';

  return (
    <div className="mb-10">
      <SpotlightCard className="relative overflow-hidden border-centri-500/20 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-centri-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-xl">
              {progress === 100 ? (
                <Trophy className="w-10 h-10 text-yellow-400" />
              ) : (
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round(progress)}%</span>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                {progress === 100 ? "You're set up" : 'Your first week'}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-xl">
                {progress === 100
                  ? 'You have been through every Start Here guide. Day-to-day guides are there whenever you need them.'
                  : `${total} short ${guideNoun}, in order. Do the ones marked "you" and the rest looks after itself.`}
              </p>
            </div>
            <div className="flex items-center gap-4 max-w-md">
              <ProgressBar value={progress} />
              <span className="text-xs text-slate-500 dark:text-slate-500 whitespace-nowrap">
                {completedCount} / {total}
              </span>
            </div>
          </div>

          <div className="w-full md:w-auto min-w-[260px]">
            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-white/10 p-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                {nextGuide ? 'Up next' : 'Completed'}
              </div>
              {nextGuide ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-centri-500 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white">{nextGuide.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-1">{nextGuide.summary}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full justify-between group"
                    onClick={() => navigate(`/guides/${nextGuide.section}/${nextGuide.id}`)}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">All done, nice work.</p>
              )}
            </div>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
};
