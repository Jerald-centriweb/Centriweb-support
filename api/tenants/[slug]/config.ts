import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { TenantConfig, PLAN_FEATURES } from '../../../types/tenant';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * GET /api/tenants/[slug]/config
 * Returns full tenant configuration
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug } = req.query;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Tenant slug is required' });
    }

    // Query tenant from Supabase
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !tenant) {
      console.error('[API] Tenant not found:', slug, error);
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check if tenant is active
    if (tenant.status === 'cancelled' || tenant.status === 'suspended') {
      return res.status(403).json({
        error: 'Tenant account is inactive',
        status: tenant.status,
      });
    }

    // Merge plan-based features with custom overrides
    const planFeatures = PLAN_FEATURES[tenant.plan as keyof typeof PLAN_FEATURES];
    const features = {
      ...planFeatures,
      ...tenant.features,
    };

    // Construct full TenantConfig
    const config: TenantConfig = {
      id: tenant.id,
      slug: tenant.slug,
      domain: tenant.domain,
      plan: tenant.plan,
      status: tenant.status,
      trialEndsAt: tenant.trial_ends_at,
      branding: tenant.branding,
      features,
      aiSettings: tenant.ai_settings,
      supportSettings: tenant.support_settings,
      contentSettings: tenant.content_settings,
      analytics: tenant.analytics_settings,
      createdAt: tenant.created_at,
      updatedAt: tenant.updated_at,
    };

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    return res.status(200).json(config);
  } catch (error) {
    console.error('[API] Error fetching tenant config:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
