import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * POST /api/analytics/events
 * Track analytics event
 *
 * Backend Developer: This endpoint receives all analytics events and stores them in Supabase.
 * These events are the foundation for health scoring and usage analytics.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;

    // Validate required fields
    if (!event.tenantId || !event.eventType) {
      return res.status(400).json({ error: 'Missing required fields: tenantId, eventType' });
    }

    // Get client IP and user agent from headers if not provided
    const ipAddress = event.ipAddress || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const userAgent = event.userAgent || req.headers['user-agent'] || 'unknown';

    // Insert event into analytics_events table
    const { data, error } = await supabase.from('analytics_events').insert({
      tenant_id: event.tenantId,
      sub_account_id: event.subAccountId,
      user_id: event.userId,
      event_type: event.eventType,
      event_data: event.eventData || {},
      page_url: event.pageUrl,
      referrer: event.referrer,
      user_agent: userAgent,
      ip_address: ipAddress,
      created_at: event.timestamp || new Date().toISOString(),
    });

    if (error) {
      console.error('[API] Error inserting analytics event:', error);
      return res.status(500).json({ error: 'Failed to insert event' });
    }

    // Success - return 201 Created (no sensitive data in response)
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('[API] Error in analytics events handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
