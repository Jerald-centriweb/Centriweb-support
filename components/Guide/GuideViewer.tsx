import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Guide } from '../../types';
import { Clock, ThumbsUp, ThumbsDown, ArrowRight, CheckCircle, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { GuideNavigation } from './GuideNavigation';
import { TableOfContents } from './TableOfContents';
import { useStore } from '../../store/useStore';
import { toEmbedUrl, hasWorkingVideo } from '../../services/contentService';

const SECTION_LABELS: Record<string, string> = {
  start_here: 'Start here',
  day_to_day: 'Day-to-day',
  money_and_documents: 'Money and documents',
  troubleshooting: 'Troubleshooting',
};

export const GuideViewer: React.FC<{ guide: Guide; guidesInSection: Guide[] }> = ({ guide, guidesInSection }) => {
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const { markGuideAsViewed } = useStore();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markGuideAsViewed(guide.id);
  }, [guide.id, markGuideAsViewed]);

  // Heading ids are assigned by TableOfContents itself (it owns both writing
  // and reading them, plus a MutationObserver fallback) — see that file for
  // why splitting "assign" and "read" across two components was fragile.

  // A guide whose video failed its server-side Drive-sharing check (see
  // server/notion-sync.mjs) must still show its written steps rather than a
  // broken Google sign-in wall — so the video block, its badge, and the
  // "watch" label are all driven by hasWorkingVideo, not merely videoUrl
  // being set.
  const showVideo = hasWorkingVideo(guide);
  const embedUrl = showVideo ? toEmbedUrl(guide.videoUrl!) : null;

  // Notion-synced guides have no separate summary field, so the sync derives
  // one from the opening sentence of the body (see deriveSummary). On a list
  // card that is exactly right; on the guide itself it meant the reader was
  // shown the same sentence twice in a row — once truncated as the subtitle,
  // then again in full in the first callout. Only show the subtitle when it
  // is not just an echo of how the content already opens.
  const showSummary = (() => {
    if (!guide.summary) return false;
    const norm = (s: string) =>
      s.replace(/<[^>]*>/g, ' ').replace(/[*_`>#…]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const head = norm(guide.content || '').slice(0, 400);
    const sum = norm(guide.summary).replace(/\.\.\.$/, '');
    return !(sum.length > 24 && head.startsWith(sum.slice(0, Math.min(sum.length, 80))));
  })();

  return (
    // justify-center matters here: TableOfContents renders nothing (not even
    // an empty node worth balancing) below the xl breakpoint, so without
    // this a max-w-3xl content column would sit flush against the left edge
    // of this row while the rest of its width (up to the max-w-5xl page
    // cap — sized for content+gap+TOC together, see GuidesPage.tsx) sat
    // empty on the right. That reads as a broken/unfilled video container;
    // centering the column makes the same layout read as deliberate.
    <div className="flex-1 flex gap-8 min-w-0 justify-center">
      <div className="max-w-3xl min-w-0 flex-1 animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-centri-100 dark:bg-centri-900/30 border border-centri-300 dark:border-centri-700/30 text-centri-700 dark:text-centri-300 text-xs font-medium uppercase tracking-wide">
              {SECTION_LABELS[guide.section] || guide.section}
            </span>
            {showVideo && (
              <span className="px-2.5 py-0.5 rounded-full bg-centri-50 dark:bg-white/5 border border-centri-200 dark:border-white/10 text-centri-600 dark:text-slate-300 text-xs font-medium uppercase tracking-wide flex items-center gap-1">
                <PlayCircle className="w-3 h-3" /> Video
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white mb-4 tracking-tight leading-[1.15]">{guide.title}</h1>
          {showSummary && <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">{guide.summary}</p>}

          <div className="flex items-center gap-6 mt-6 text-sm text-slate-500 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-8">
            {guide.minutes ? (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{guide.minutes} min {showVideo ? 'watch' : 'read'}</span>
              </div>
            ) : null}
          </div>
        </div>

        {showVideo && (
          <div className="mb-10 rounded-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-white/10 bg-slate-100 dark:bg-slate-900 shadow-md aspect-video">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={guide.title}
              />
            ) : (
              <a
                href={guide.videoUrl!}
                target="_blank"
                rel="noreferrer"
                className="w-full h-full flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:text-centri-500"
              >
                <PlayCircle className="w-6 h-6" /> Watch video
              </a>
            )}
          </div>
        )}

        {guide.content && (
          <div ref={contentRef} className="guide-content mb-12">
            {guide.contentFormat === 'md' ? (
              // rehype-raw so the <details>/<summary> accordions and
              // colour-classed callouts that server/notion-sync.mjs emits
              // render as real elements rather than escaped text. Guide
              // content is first-party (Jerald's own Notion), and the sibling
              // branch below already renders stored HTML directly, so this
              // introduces no new trust boundary.
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{guide.content}</ReactMarkdown>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: guide.content }} />
            )}
          </div>
        )}

        <Card className="bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 my-12 shadow-none">
          <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-slate-900 dark:text-white font-semibold mb-1">Was this guide helpful?</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Your feedback helps us improve our guides.</p>
            </div>
            {!feedback ? (
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setFeedback('yes')}>
                  <ThumbsUp className="w-4 h-4 mr-2" /> Yes
                </Button>
                <Button variant="outline" size="sm" onClick={() => setFeedback('no')}>
                  <ThumbsDown className="w-4 h-4 mr-2" /> No
                </Button>
              </div>
            ) : (
              <div className="flex items-center text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-400/20">
                <CheckCircle className="w-4 h-4 mr-2" /> Thanks for letting us know.
              </div>
            )}
          </div>
        </Card>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Still stuck?</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-centri-400/60 dark:hover:border-centri-500/50 hover:-translate-y-0.5 transition-all group text-left shadow-sm"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors">
                  Ask a question
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-500">Get an instant answer specific to your problem.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-centri-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-3" />
            </button>
            <button
              onClick={() => navigate('/support')}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-centri-400/60 dark:hover:border-centri-500/50 hover:-translate-y-0.5 transition-all group text-left shadow-sm"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors">
                  Raise a ticket
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-500">Reach the CentriWeb team directly.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-centri-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-3" />
            </button>
          </div>
        </div>

        <GuideNavigation guidesInSection={guidesInSection} currentSlug={guide.id} />
      </div>

      <TableOfContents contentRef={contentRef} />
    </div>
  );
};
