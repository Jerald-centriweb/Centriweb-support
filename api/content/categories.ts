import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * GET /api/content/categories?tenantId=xxx
 * Returns list of categories/areas with their guides grouped
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tenantId } = req.query;

    if (!tenantId || typeof tenantId !== 'string') {
      return res.status(400).json({ error: 'tenantId parameter is required' });
    }

    // Fetch all guides for tenant (with inheritance)
    const guidesResponse = await fetch(
      `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/content/guides?tenantId=${tenantId}`
    );

    if (!guidesResponse.ok) {
      throw new Error('Failed to fetch guides');
    }

    const guides = await guidesResponse.json();

    // Group guides by category
    const categoriesMap = new Map();

    guides.forEach((guide: any) => {
      const category = guide.category || 'general';

      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, {
          id: category,
          title: formatCategoryTitle(category),
          description: getCategoryDescription(category),
          guides: [],
        });
      }

      categoriesMap.get(category).guides.push(guide);
    });

    // Convert to array and sort
    const categories = Array.from(categoriesMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    return res.status(200).json(categories);
  } catch (error) {
    console.error('[API] Error in categories endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper functions
function formatCategoryTitle(category: string): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    getting_started: 'Essential guides to get up and running quickly',
    automation: 'Workflows, triggers, and automation best practices',
    crm: 'Contact management, pipelines, and lead tracking',
    funnels: 'Landing pages, forms, and conversion optimization',
    calendars: 'Appointment scheduling and calendar management',
    workflows: 'Advanced workflow automation and logic',
    integrations: 'Third-party integrations and API connections',
    reporting: 'Analytics, dashboards, and data insights',
    billing: 'Payments, invoicing, and subscription management',
    settings: 'Account configuration and user management',
    troubleshooting: 'Common issues and how to fix them',
    advanced: 'Advanced features for power users',
  };

  return descriptions[category] || 'Helpful guides and tutorials';
}
