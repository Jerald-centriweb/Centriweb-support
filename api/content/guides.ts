import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * GET /api/content/guides?tenantId=xxx&category=xxx
 * Returns guides with content inheritance:
 * 1. Base grey-label content (tenant_id = NULL)
 * 2. Tenant-specific overrides (tenant_id = xxx, is_override = true)
 * 3. Tenant custom content (tenant_id = xxx, is_override = false)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tenantId, category } = req.query;

    if (!tenantId || typeof tenantId !== 'string') {
      return res.status(400).json({ error: 'tenantId parameter is required' });
    }

    // Build query for base content + tenant content
    let query = supabase
      .from('content_items')
      .select('*')
      .eq('type', 'guide')
      .in('tenant_id', [null, tenantId]); // Get base content OR tenant content

    // Optional category filter
    if (category && typeof category === 'string') {
      query = query.eq('category', category);
    }

    const { data: allContent, error } = await query;

    if (error) {
      console.error('[API] Error fetching content:', error);
      return res.status(500).json({ error: 'Failed to fetch content' });
    }

    if (!allContent || allContent.length === 0) {
      return res.status(200).json([]);
    }

    // Content inheritance algorithm:
    // 1. Start with all base content (tenant_id = null)
    // 2. Apply tenant overrides (is_override = true, overrides_id points to base)
    // 3. Add tenant custom content (is_override = false, no overrides_id)

    const baseContent = allContent.filter((item) => item.tenant_id === null);
    const tenantContent = allContent.filter((item) => item.tenant_id === tenantId);

    // Create map of base content by ID
    const contentMap = new Map();
    baseContent.forEach((item) => {
      contentMap.set(item.id, item);
    });

    // Apply tenant overrides and add custom content
    tenantContent.forEach((item) => {
      if (item.is_override && item.overrides_id) {
        // This is an override - replace the base content
        contentMap.set(item.overrides_id, {
          ...item,
          id: item.overrides_id, // Keep the base ID for reference
          overridden: true,
        });
      } else {
        // This is custom tenant content - add it
        contentMap.set(item.id, item);
      }
    });

    // Convert map back to array and sort by category and order
    const finalContent = Array.from(contentMap.values())
      .sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return (a.display_order || 0) - (b.display_order || 0);
      });

    // Transform to match frontend Guide type
    const guides = finalContent.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary || '',
      content: item.content || '',
      tags: item.tags || [],
      timeToRead: item.time_to_read || '5 min',
      videoUrl: item.video_url,
      relatedGuideIds: item.related_guide_ids || [],
      category: item.category,
      overridden: item.overridden || false,
    }));

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    return res.status(200).json(guides);
  } catch (error) {
    console.error('[API] Error in guides endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
