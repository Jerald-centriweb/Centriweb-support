/**
 * Analytics Tracking System
 *
 * This is our COMPETITIVE ADVANTAGE - track everything users do for:
 * - Health scoring
 * - Usage analytics
 * - Identifying confused users
 * - Measuring support load reduction
 */

import { getTenantContext } from './tenant-loader';

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

interface AnalyticsEvent {
  tenantId: string;
  subAccountId: string | null;
  userId: string | null;
  eventType: AnalyticsEventType;
  eventData: Record<string, any>;
  pageUrl: string;
  referrer: string;
  userAgent: string;
  timestamp: string;
}

/**
 * Core analytics tracking function
 */
async function trackEvent(
  eventType: AnalyticsEventType,
  eventData: Record<string, any> = {}
): Promise<void> {
  try {
    const context = getTenantContext();

    const event: AnalyticsEvent = {
      tenantId: context.tenantId,
      subAccountId: context.subAccountId,
      userId: context.userId,
      eventType,
      eventData,
      pageUrl: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Send to API
    // Backend developer: Wire this up to POST /api/analytics/events
    const response = await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error('[Analytics] Failed to track event:', response.statusText);
    }
  } catch (error) {
    // Fail silently - don't break user experience if analytics fails
    console.error('[Analytics] Error tracking event:', error);
  }
}

/**
 * Analytics API
 * Convenience methods for tracking specific events
 */
export const analytics = {
  /**
   * Track guide view
   */
  trackGuideView: (guideId: string, category: string, title: string) => {
    return trackEvent('guide_view', {
      guideId,
      category,
      title,
    });
  },

  /**
   * Track guide completion (user scrolled to bottom or spent significant time)
   */
  trackGuideComplete: (guideId: string, timeSpent: number) => {
    return trackEvent('guide_complete', {
      guideId,
      timeSpentSeconds: timeSpent,
    });
  },

  /**
   * Track search query
   */
  trackSearch: (query: string, resultsCount: number, selectedResult?: string) => {
    return trackEvent('search', {
      query,
      resultsCount,
      selectedResult,
    });
  },

  /**
   * Track AI chat session start
   */
  trackAIChatStart: () => {
    return trackEvent('ai_chat_start', {});
  },

  /**
   * Track AI chat message
   */
  trackAIChatMessage: (messageText: string, isUser: boolean) => {
    return trackEvent('ai_chat_message', {
      messageLength: messageText.length,
      isUser,
    });
  },

  /**
   * Track AI chat helpfulness feedback
   */
  trackAIChatHelpful: (conversationId: string, wasHelpful: boolean, feedback?: string) => {
    const eventType = wasHelpful ? 'ai_chat_helpful' : 'ai_chat_not_helpful';
    return trackEvent(eventType, {
      conversationId,
      feedback,
    });
  },

  /**
   * Track support ticket submission
   */
  trackTicketSubmit: (category: string, priority: string, subject: string) => {
    return trackEvent('ticket_submit', {
      category,
      priority,
      subject,
    });
  },

  /**
   * Track video playback
   */
  trackVideoPlay: (videoUrl: string, guideId?: string) => {
    return trackEvent('video_play', {
      videoUrl,
      guideId,
    });
  },

  /**
   * Track video completion
   */
  trackVideoComplete: (videoUrl: string, duration: number) => {
    return trackEvent('video_complete', {
      videoUrl,
      durationSeconds: duration,
    });
  },

  /**
   * Track external link clicks
   */
  trackLinkClick: (url: string, text: string) => {
    return trackEvent('link_click', {
      url,
      text,
    });
  },

  /**
   * Track category browse
   */
  trackCategoryView: (categoryId: string, categoryName: string) => {
    return trackEvent('category_view', {
      categoryId,
      categoryName,
    });
  },

  /**
   * Track voice input usage
   */
  trackVoiceInput: (provider: 'web-speech' | 'whisper', duration: number) => {
    return trackEvent('voice_input_used', {
      provider,
      durationSeconds: duration,
    });
  },

  /**
   * Track theme toggle
   */
  trackThemeToggle: (newTheme: 'light' | 'dark') => {
    return trackEvent('theme_toggle', {
      newTheme,
    });
  },

  /**
   * Track page view
   */
  trackPageView: (page: string) => {
    return trackEvent('page_view', {
      page,
    });
  },
};

/**
 * Auto-track page views on route change
 */
export function useAnalyticsPageView() {
  // This will be called from a React component with useEffect
  const context = getTenantContext();

  return (pathname: string) => {
    analytics.trackPageView(pathname);
  };
}

/**
 * Track time spent on page/guide
 */
export class TimeTracker {
  private startTime: number;
  private guideId?: string;

  constructor(guideId?: string) {
    this.startTime = Date.now();
    this.guideId = guideId;
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsed(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Mark guide as complete if enough time spent
   */
  trackCompletion(): void {
    const elapsed = this.getElapsed();

    // Only track completion if spent at least 30 seconds
    if (this.guideId && elapsed >= 30) {
      analytics.trackGuideComplete(this.guideId, elapsed);
    }
  }
}

/**
 * Detect repeat searches (user couldn't find what they need)
 * This is a NEGATIVE signal for health scoring
 */
export class SearchPatternDetector {
  private searches: Array<{ query: string; timestamp: number }> = [];

  addSearch(query: string): void {
    this.searches.push({
      query: query.toLowerCase().trim(),
      timestamp: Date.now(),
    });

    // Keep only last 10 searches
    if (this.searches.length > 10) {
      this.searches.shift();
    }
  }

  /**
   * Check if user is repeating searches (confusion signal)
   */
  hasRepeatedSearches(): boolean {
    if (this.searches.length < 3) return false;

    const recent = this.searches.slice(-5);
    const queries = recent.map(s => s.query);
    const unique = new Set(queries);

    // If 3+ of last 5 searches are similar, it's a repeat pattern
    return unique.size <= 2;
  }

  /**
   * Check if user is searching rapidly (frustration signal)
   */
  isSearchingRapidly(): boolean {
    if (this.searches.length < 3) return false;

    const last3 = this.searches.slice(-3);
    const timeSpan = last3[2].timestamp - last3[0].timestamp;

    // 3 searches in under 30 seconds = rapid searching
    return timeSpan < 30000;
  }
}

// Export singleton instance for use across app
export const searchPatternDetector = new SearchPatternDetector();
