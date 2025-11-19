/**
 * Health Scoring System
 *
 * This is the SECRET SAUCE that competitors don't have.
 * Analyzes analytics events to compute a health score per sub-account (client).
 *
 * Backend Developer: This will be called periodically (e.g., daily cron job)
 * to compute health scores for all sub-accounts.
 */

interface AnalyticsEvent {
  event_type: string;
  event_data: Record<string, any>;
  created_at: string;
}

export interface HealthScore {
  subAccountId: string;
  score: number; // 0-100
  metrics: {
    engagement: number; // How active they are
    confusionSignals: number; // How often they're stuck
    supportLoad: number; // How many tickets/AI chats
    learningProgress: number; // How many guides completed
  };
  positiveSignals: string[];
  negativeSignals: string[];
  recommendation: string;
  lastCalculated: string;
}

/**
 * Calculate health score for a sub-account based on recent events
 */
export function calculateHealthScore(
  events: AnalyticsEvent[],
  periodDays: number = 30
): HealthScore {
  // Start with neutral score
  let score = 50;

  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];

  // Count event types
  const eventCounts = {
    guideViews: events.filter(e => e.event_type === 'guide_view').length,
    guideCompletes: events.filter(e => e.event_type === 'guide_complete').length,
    searches: events.filter(e => e.event_type === 'search').length,
    aiChats: events.filter(e => e.event_type === 'ai_chat_start').length,
    aiHelpful: events.filter(e => e.event_type === 'ai_chat_helpful').length,
    aiNotHelpful: events.filter(e => e.event_type === 'ai_chat_not_helpful').length,
    tickets: events.filter(e => e.event_type === 'ticket_submit').length,
    criticalTickets: events.filter(
      e => e.event_type === 'ticket_submit' && e.event_data.priority === 'critical'
    ).length,
  };

  // Calculate metrics
  const metrics = {
    engagement: 0,
    confusionSignals: 0,
    supportLoad: 0,
    learningProgress: 0,
  };

  // ===========================================================================
  // POSITIVE SIGNALS (increase score)
  // ===========================================================================

  // 1. Active learning (viewing and completing guides)
  if (eventCounts.guideViews >= 10) {
    score += 15;
    positiveSignals.push('Active learner (10+ guide views)');
    metrics.learningProgress = Math.min(100, (eventCounts.guideViews / 50) * 100);
  }

  if (eventCounts.guideCompletes >= 5) {
    score += 10;
    positiveSignals.push('Completing guides (5+ completions)');
  }

  // 2. Healthy AI usage (getting answers, not spamming)
  if (eventCounts.aiChats > 3 && eventCounts.aiChats < 30) {
    score += 10;
    positiveSignals.push('Healthy AI assistant usage');
  }

  // 3. AI is helpful (user clicks "helpful" feedback)
  const aiHelpfulnessRatio = eventCounts.aiChats > 0
    ? eventCounts.aiHelpful / eventCounts.aiChats
    : 0;

  if (aiHelpfulnessRatio > 0.6) {
    score += 10;
    positiveSignals.push('AI assistant is effective (60%+ helpful)');
  }

  // 4. Low support ticket volume
  if (eventCounts.tickets < 3) {
    score += 10;
    positiveSignals.push('Low support ticket volume');
    metrics.supportLoad = Math.max(0, 100 - (eventCounts.tickets * 10));
  }

  // 5. Consistent engagement (active multiple days)
  const uniqueDays = new Set(
    events.map(e => new Date(e.created_at).toDateString())
  ).size;

  if (uniqueDays >= 7) {
    score += 10;
    positiveSignals.push('Consistent weekly engagement');
    metrics.engagement = Math.min(100, (uniqueDays / periodDays) * 100);
  }

  // ===========================================================================
  // NEGATIVE SIGNALS (decrease score)
  // ===========================================================================

  // 1. Excessive searching (can't find answers)
  if (eventCounts.searches > 20) {
    score -= 10;
    negativeSignals.push('Excessive searching (20+ searches)');
    metrics.confusionSignals += 30;
  }

  // 2. Repeat searches (same query multiple times = confusion)
  const repeatSearches = detectRepeatSearches(events);
  if (repeatSearches > 3) {
    score -= 15;
    negativeSignals.push(`Repeat searches detected (${repeatSearches}x)`);
    metrics.confusionSignals += 40;
  }

  // 3. AI not helpful (user clicks "not helpful")
  if (eventCounts.aiNotHelpful > 5) {
    score -= 15;
    negativeSignals.push('AI assistant not helping (5+ negative feedback)');
    metrics.confusionSignals += 20;
  }

  // 4. High support ticket volume
  if (eventCounts.tickets > 5) {
    score -= 20;
    negativeSignals.push(`High support ticket volume (${eventCounts.tickets} tickets)`);
    metrics.supportLoad = Math.min(100, (eventCounts.tickets / 10) * 100);
  }

  // 5. Critical system down tickets
  if (eventCounts.criticalTickets > 0) {
    score -= 30;
    negativeSignals.push(`CRITICAL: System down (${eventCounts.criticalTickets} critical tickets)`);
  }

  // 6. Low engagement (barely using portal)
  if (eventCounts.guideViews < 3 && periodDays >= 7) {
    score -= 10;
    negativeSignals.push('Low engagement (fewer than 3 guide views)');
    metrics.engagement = 20;
  }

  // 7. AI spam (excessive chat usage without reading guides)
  if (eventCounts.aiChats > 30 && eventCounts.guideViews < 5) {
    score -= 10;
    negativeSignals.push('Excessive AI chat without reading guides');
  }

  // ===========================================================================
  // FINAL SCORE CALCULATION
  // ===========================================================================

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Generate recommendation based on score and signals
  const recommendation = generateRecommendation(score, positiveSignals, negativeSignals);

  return {
    subAccountId: '', // Will be set by caller
    score,
    metrics,
    positiveSignals,
    negativeSignals,
    recommendation,
    lastCalculated: new Date().toISOString(),
  };
}

/**
 * Detect repeat searches (same query within short time)
 */
function detectRepeatSearches(events: AnalyticsEvent[]): number {
  const searches = events.filter(e => e.event_type === 'search');

  let repeatCount = 0;
  const queryMap = new Map<string, number>();

  for (const search of searches) {
    const query = search.event_data.query?.toLowerCase().trim();
    if (!query) continue;

    const count = queryMap.get(query) || 0;
    queryMap.set(query, count + 1);

    if (count > 0) {
      repeatCount++;
    }
  }

  return repeatCount;
}

/**
 * Generate actionable recommendation based on health score
 */
function generateRecommendation(
  score: number,
  positiveSignals: string[],
  negativeSignals: string[]
): string {
  if (score >= 80) {
    return '✅ Healthy - Client is actively learning and self-sufficient. Keep monitoring.';
  }

  if (score >= 60) {
    return '⚠️ Needs Attention - Some confusion signals. Consider proactive outreach.';
  }

  if (score >= 40) {
    return '🔴 At Risk - Multiple issues detected. Schedule check-in call ASAP.';
  }

  if (score >= 20) {
    return '🚨 CRITICAL - Client is struggling significantly. Immediate intervention required.';
  }

  return '💀 EMERGENCY - System may be down or client completely stuck. Contact NOW.';
}

/**
 * Calculate aggregate health score for entire tenant (agency-wide view)
 */
export function calculateTenantHealthScore(
  subAccountScores: HealthScore[]
): {
  averageScore: number;
  healthyCount: number;
  atRiskCount: number;
  criticalCount: number;
  totalSubAccounts: number;
} {
  const total = subAccountScores.length;

  if (total === 0) {
    return {
      averageScore: 0,
      healthyCount: 0,
      atRiskCount: 0,
      criticalCount: 0,
      totalSubAccounts: 0,
    };
  }

  const averageScore = subAccountScores.reduce((sum, s) => sum + s.score, 0) / total;

  const healthyCount = subAccountScores.filter(s => s.score >= 60).length;
  const atRiskCount = subAccountScores.filter(s => s.score >= 40 && s.score < 60).length;
  const criticalCount = subAccountScores.filter(s => s.score < 40).length;

  return {
    averageScore: Math.round(averageScore),
    healthyCount,
    atRiskCount,
    criticalCount,
    totalSubAccounts: total,
  };
}

/**
 * Get top confusion topics (what are users struggling with?)
 * Backend Developer: This analyzes search queries and "not helpful" AI feedback
 */
export function getConfusionTopics(events: AnalyticsEvent[]): Array<{ topic: string; count: number }> {
  const topicCounts = new Map<string, number>();

  // Analyze search queries
  events
    .filter(e => e.event_type === 'search')
    .forEach(e => {
      const query = e.event_data.query?.toLowerCase() || '';
      // Simple keyword extraction (could be improved with NLP)
      const keywords = query.split(/\s+/).filter(word => word.length > 3);
      keywords.forEach(keyword => {
        topicCounts.set(keyword, (topicCounts.get(keyword) || 0) + 1);
      });
    });

  // Analyze "not helpful" AI feedback
  events
    .filter(e => e.event_type === 'ai_chat_not_helpful')
    .forEach(e => {
      const feedback = e.event_data.feedback?.toLowerCase() || '';
      const keywords = feedback.split(/\s+/).filter(word => word.length > 3);
      keywords.forEach(keyword => {
        topicCounts.set(keyword, (topicCounts.get(keyword) || 0) + 2); // Weight AI feedback higher
      });
    });

  // Convert to array and sort by count
  return Array.from(topicCounts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 confusion topics
}

/**
 * Estimate support tickets prevented by self-service
 * Backend Developer: This compares guide views + AI chats vs ticket submissions
 */
export function estimateTicketsPrevented(events: AnalyticsEvent[]): number {
  const selfServiceEvents = events.filter(
    e => e.event_type === 'guide_view' ||
         e.event_type === 'guide_complete' ||
         e.event_type === 'ai_chat_helpful'
  ).length;

  const tickets = events.filter(e => e.event_type === 'ticket_submit').length;

  // Industry average: 1 ticket prevented per 5 self-service interactions
  const prevented = Math.floor(selfServiceEvents / 5);

  return prevented;
}
