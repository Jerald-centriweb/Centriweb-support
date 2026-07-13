/**
 * Analytics — kept as a lightweight, dependency-free stub with the same call
 * surface the pages/components already use (trackPageView, trackGuideView,
 * trackAIChatStart, etc.), rather than posting to /api/analytics/events.
 *
 * That endpoint was a Vercel-style serverless stub (api/analytics/events.ts)
 * that was never wired into the real server (server/index.js) — every call
 * was silently 404ing and getting swallowed by the try/catch below, so this
 * was already producing zero real analytics. Rather than build a genuine
 * analytics backend (not something anyone has asked for), this keeps every
 * call site compiling and harmless — a console.debug in dev, nothing in
 * production — until real analytics is actually wanted.
 */
export type AnalyticsEventType =
  | 'guide_view'
  | 'guide_complete'
  | 'search'
  | 'ai_chat_start'
  | 'ai_chat_message'
  | 'ai_chat_helpful'
  | 'ai_chat_not_helpful'
  | 'ticket_submit'
  | 'video_play'
  | 'video_complete'
  | 'link_click'
  | 'category_view'
  | 'voice_input_used'
  | 'theme_toggle'
  | 'page_view';

function trackEvent(eventType: AnalyticsEventType, eventData: Record<string, any> = {}): void {
  if (import.meta.env?.DEV) {
    console.debug('[analytics]', eventType, eventData);
  }
}

export const analytics = {
  trackPageView: (page: string, title: string) => trackEvent('page_view', { page, title }),
  trackGuideView: (guideId: string, category: string, title: string) => trackEvent('guide_view', { guideId, category, title }),
  trackGuideComplete: (guideId: string, timeSpent: number) => trackEvent('guide_complete', { guideId, timeSpentSeconds: timeSpent }),
  trackSearch: (query: string, resultsCount: number, selectedResult?: string) => trackEvent('search', { query, resultsCount, selectedResult }),
  trackAIChatStart: () => trackEvent('ai_chat_start', {}),
  trackAIChatMessage: (messageText: string, isUser: boolean) => trackEvent('ai_chat_message', { messageLength: messageText.length, isUser }),
  trackAIChatHelpful: (conversationId: string, wasHelpful: boolean, feedback?: string) =>
    trackEvent(wasHelpful ? 'ai_chat_helpful' : 'ai_chat_not_helpful', { conversationId, feedback }),
  trackTicketSubmit: (category: string, priority: string, subject: string) => trackEvent('ticket_submit', { category, priority, subject }),
  trackEvent: (name: string, data: Record<string, any> = {}) => trackEvent(name as AnalyticsEventType, data),
};
