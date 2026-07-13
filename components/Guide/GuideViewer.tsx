import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Guide } from '../../types';
import { Clock, ThumbsUp, ThumbsDown, ArrowRight, CheckCircle, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { GuideNavigation } from './GuideNavigation';
import { TableOfContents } from './TableOfContents';
import { useStore } from '../../store/useStore';
import { toEmbedUrl } from '../../services/contentService';

const SECTION_LABELS: Record<string, string> = {
  start_here: 'Start here',
  day_to_day: 'Day-to-day',
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

  const embedUrl = guide.videoUrl ? toEmbedUrl(guide.videoUrl) : null;

  return (
    <div className="flex-1 flex gap-8 min-w-0">
      <div className="max-w-3xl min-w-0 flex-1 animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-centri-100 dark:bg-centri-900/30 border border-centri-300 dark:border-centri-700/30 text-centri-700 dark:text-centri-300 text-xs font-medium uppercase tracking-wide">
              {SECTION_LABELS[guide.section] || guide.section}
            </span>
            {guide.contentType !== 'article' && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700/30 text-purple-700 dark:text-purple-300 text-xs font-medium uppercase tracking-wide flex items-center gap-1">
                <PlayCircle className="w-3 h-3" /> Video
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">{guide.title}</h1>
          {guide.summary && <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">{guide.summary}</p>}

          <div className="flex items-center gap-6 mt-6 text-sm text-slate-500 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-8">
            {guide.minutes ? (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{guide.minutes} min {guide.contentType === 'video' ? 'watch' : 'read'}</span>
              </div>
            ) : null}
          </div>
        </div>

        {guide.videoUrl && (
          <div className="mb-8 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shadow-lg aspect-video">
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
                href={guide.videoUrl}
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
              <ReactMarkdown>{guide.content}</ReactMarkdown>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: guide.content }} />
            )}
          </div>
        )}

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 my-12">
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
              <div className="flex items-center text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-400/10 px-4 py-2 rounded-lg border border-green-300 dark:border-green-400/20">
                <CheckCircle className="w-4 h-4 mr-2" /> Thanks for letting us know.
              </div>
            )}
          </div>
        </Card>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Still stuck?</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center justify-between p-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-centri-500/50 transition-all group text-left shadow-sm"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors">
                  Ask a question
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-500">Get an instant answer specific to your problem.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-centri-500 transition-colors" />
            </button>
            <button
              onClick={() => navigate('/support')}
              className="flex items-center justify-between p-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-centri-500/50 transition-all group text-left shadow-sm"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors">
                  Raise a ticket
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-500">Reach the CentriWeb team directly.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-centri-500 transition-colors" />
            </button>
          </div>
        </div>

        <GuideNavigation guidesInSection={guidesInSection} currentSlug={guide.id} />
      </div>

      <TableOfContents contentRef={contentRef} />
    </div>
  );
};
