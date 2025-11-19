import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Guide } from '../../types';
import { Clock, ThumbsUp, ThumbsDown, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { RelatedGuides } from './RelatedGuides';
import { useStore } from '../../store/useStore';
import { analytics, TimeTracker } from '../../lib/analytics';

export const GuideViewer: React.FC<{ guide: Guide; category?: string }> = ({ guide, category = 'general' }) => {
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const { markGuideAsViewed } = useStore();
  const navigate = useNavigate();
  const timeTrackerRef = useRef<TimeTracker | null>(null);

  // Mark guide as viewed when component mounts + track analytics
  useEffect(() => {
    markGuideAsViewed(guide.id);

    // Analytics: Track guide view
    analytics.trackGuideView(guide.id, category, guide.title);

    // Start time tracking for completion
    timeTrackerRef.current = new TimeTracker(guide.id);

    // Cleanup: Track completion on unmount if enough time spent
    return () => {
      if (timeTrackerRef.current) {
        timeTrackerRef.current.trackCompletion();
      }
    };
  }, [guide.id, guide.title, category, markGuideAsViewed]);

  const handleFeedback = (val: 'yes' | 'no') => {
    setFeedback(val);

    // Analytics: Track guide feedback (helpful or not)
    if (val === 'yes') {
      analytics.trackAIChatHelpful(guide.id, true, 'Guide was helpful');
    } else {
      analytics.trackAIChatHelpful(guide.id, false, 'Guide was not helpful');
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {guide.tags.map(tag => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-full bg-centri-100 dark:bg-centri-900/30 border border-centri-300 dark:border-centri-700/30 text-centri-700 dark:text-centri-300 text-xs font-medium uppercase tracking-wide"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">{guide.title}</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">{guide.summary}</p>

        <div className="flex items-center gap-6 mt-6 text-sm text-slate-500 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{guide.timeToRead} read</span>
          </div>
          <div>Last updated: Today</div>
        </div>
      </div>

      {/* Video Embed (Optional) */}
      {guide.videoUrl && (
        <div className="mb-8 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shadow-lg aspect-video relative group">
          {/* Placeholder for actual video embed implementation */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-200/50 dark:bg-slate-800/50 group-hover:bg-slate-200/40 dark:group-hover:bg-slate-800/40 transition-colors">
            <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <span className="w-12 h-12 rounded-full bg-centri-600 flex items-center justify-center text-white">
                ▶
              </span>{' '}
              Watch Video Tutorial
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <article className="prose prose-slate dark:prose-invert max-w-none mb-12">
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => (
              <h1
                className="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-4"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4 border-l-4 border-centri-500 pl-3"
                {...props}
              />
            ),
            ul: ({ node, ...props }) => (
              <ul className="space-y-2 my-4 text-slate-700 dark:text-slate-300" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="flex items-start gap-2" {...props}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-centri-500 flex-shrink-0" />
                <span>{props.children}</span>
              </li>
            ),
            p: ({ node, ...props }) => (
              <p className="text-slate-700 dark:text-slate-300 leading-7 mb-4" {...props} />
            ),
            strong: ({ node, ...props }) => (
              <strong className="text-slate-900 dark:text-white font-semibold" {...props} />
            ),
            code: ({ node, ...props }) => (
              <code className="bg-slate-100 dark:bg-slate-800 text-centri-600 dark:text-centri-400 px-1.5 py-0.5 rounded text-sm" {...props} />
            ),
          }}
        >
          {guide.content}
        </ReactMarkdown>
      </article>

      {/* Related Guides */}
      <RelatedGuides relatedGuideIds={guide.relatedGuideIds} currentGuideId={guide.id} />

      {/* Feedback Section */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 my-12">
        <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-slate-900 dark:text-white font-semibold mb-1">
              Was this guide helpful?
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your feedback helps us improve our support.
            </p>
          </div>

          {!feedback ? (
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => handleFeedback('yes')}>
                <ThumbsUp className="w-4 h-4 mr-2" /> Yes
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleFeedback('no')}>
                <ThumbsDown className="w-4 h-4 mr-2" /> No
              </Button>
            </div>
          ) : (
            <div className="flex items-center text-green-600 dark:text-green-400 animate-fade-in bg-green-100 dark:bg-green-400/10 px-4 py-2 rounded-lg border border-green-300 dark:border-green-400/20">
              <CheckCircle className="w-4 h-4 mr-2" /> Thank you for your feedback!
            </div>
          )}
        </div>
      </Card>

      {/* Next Steps */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Still stuck?</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center justify-between p-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-centri-500/50 transition-all group text-left shadow-sm"
          >
            <div>
              <p className="font-medium text-slate-900 dark:text-white group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors">
                Ask the AI Assistant
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-500">
                Get instant answers specific to your problem.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-centri-500 transition-colors" />
          </button>
          <button
            onClick={() => navigate('/support')}
            className="flex items-center justify-between p-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-centri-500/50 transition-all group text-left shadow-sm"
          >
            <div>
              <p className="font-medium text-slate-900 dark:text-white group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors">
                Contact Support
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-500">
                Open a ticket with our team.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-centri-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
