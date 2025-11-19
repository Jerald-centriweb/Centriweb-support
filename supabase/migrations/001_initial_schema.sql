-- CentriWeb Support OS - Initial Schema
-- Multi-tenant support portal for GoHighLevel agencies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for secure tokens
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TENANTS TABLE
-- Each row = one agency customer who pays us monthly
-- ============================================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL, -- URL-friendly (e.g., 'acme-agency')
  domain TEXT, -- Custom domain (e.g., 'support.acmeagency.com')

  -- Subscription
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,

  -- Configuration (stored as JSONB for flexibility)
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  support_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  analytics_settings JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_tenants_status ON tenants(status);

-- ============================================================================
-- SUB_ACCOUNTS TABLE
-- Each row = one of the agency's GHL client locations
-- ============================================================================
CREATE TABLE sub_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- GHL Integration
  ghl_location_id TEXT, -- GoHighLevel location/sub-account ID
  ghl_company_id TEXT, -- GoHighLevel company ID

  -- Identity
  name TEXT NOT NULL,
  domain TEXT, -- If client has custom domain

  -- Settings (can override tenant defaults)
  custom_branding JSONB,
  custom_settings JSONB,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique GHL location per tenant
  UNIQUE(tenant_id, ghl_location_id)
);

CREATE INDEX idx_sub_accounts_tenant ON sub_accounts(tenant_id);
CREATE INDEX idx_sub_accounts_ghl_location ON sub_accounts(ghl_location_id);

-- ============================================================================
-- CONTENT_ITEMS TABLE
-- Knowledge base articles, guides, SOPs, videos, etc.
-- Supports inheritance: base KB (tenant_id=NULL) + tenant overrides
-- ============================================================================
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = base/grey-label content

  -- Content Type
  type TEXT NOT NULL CHECK (type IN ('guide', 'sop', 'video', 'faq', 'article')),
  category TEXT NOT NULL, -- e.g., 'getting-started', 'automation', 'workflows'

  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL-friendly
  summary TEXT,
  content TEXT NOT NULL, -- Markdown or HTML

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  author TEXT,
  time_to_read TEXT, -- e.g., '5 min'
  video_url TEXT, -- Loom, YouTube, etc.

  -- Override System
  is_override BOOLEAN DEFAULT FALSE, -- True if overrides base content
  overrides_id UUID REFERENCES content_items(id) ON DELETE SET NULL, -- Which base item this replaces

  -- Additional Data
  metadata JSONB DEFAULT '{}'::jsonb, -- Flexible storage for custom fields

  -- Publishing
  published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique slugs within tenant scope
  UNIQUE(tenant_id, category, slug)
);

CREATE INDEX idx_content_items_tenant ON content_items(tenant_id);
CREATE INDEX idx_content_items_type ON content_items(type);
CREATE INDEX idx_content_items_category ON content_items(category);
CREATE INDEX idx_content_items_published ON content_items(published);
CREATE INDEX idx_content_items_tags ON content_items USING GIN(tags);

-- ============================================================================
-- ANALYTICS_EVENTS TABLE
-- Track all user interactions for health scoring and insights
-- This is our COMPETITIVE ADVANTAGE - nobody else tracks this
-- ============================================================================
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE SET NULL,

  -- User
  user_id TEXT, -- GHL user ID or anonymous session ID
  user_email TEXT,
  user_name TEXT,

  -- Event
  event_type TEXT NOT NULL, -- 'guide_view', 'search', 'ai_chat', 'ticket_submit', etc.
  event_data JSONB DEFAULT '{}'::jsonb, -- Flexible event-specific data

  -- Context
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_tenant ON analytics_events(tenant_id);
CREATE INDEX idx_analytics_events_sub_account ON analytics_events(sub_account_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);

-- Partitioning by month for performance (optional, can add later)
-- CREATE INDEX idx_analytics_events_created_month ON analytics_events((date_trunc('month', created_at)));

-- ============================================================================
-- HEALTH_SCORES TABLE
-- Computed health scores per sub-account (updated periodically)
-- ============================================================================
CREATE TABLE health_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

  -- Score
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),

  -- Breakdown Metrics
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb, -- engagement, confusion_signals, support_load, etc.

  -- Signals (for transparency)
  positive_signals TEXT[] DEFAULT ARRAY[]::TEXT[],
  negative_signals TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Calculation
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Ensure one score per sub-account per period
  UNIQUE(sub_account_id, period_start, period_end)
);

CREATE INDEX idx_health_scores_tenant ON health_scores(tenant_id);
CREATE INDEX idx_health_scores_sub_account ON health_scores(sub_account_id);
CREATE INDEX idx_health_scores_calculated ON health_scores(calculated_at DESC);
CREATE INDEX idx_health_scores_score ON health_scores(score);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- Automatically update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_accounts_updated_at
  BEFORE UPDATE ON sub_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Ensure tenants can only access their own data
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;

-- Public read access to base content (tenant_id IS NULL)
CREATE POLICY "Public base content is viewable by all"
  ON content_items FOR SELECT
  USING (tenant_id IS NULL AND published = TRUE);

-- Tenants can view their own content
CREATE POLICY "Tenants can view their own content"
  ON content_items FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Similar policies for other tables (will refine based on auth setup)
-- For now, we'll handle access control in API routes

-- ============================================================================
-- SEED DATA
-- Insert default tenant for development
-- ============================================================================
INSERT INTO tenants (
  id,
  slug,
  domain,
  plan,
  status,
  branding,
  features,
  ai_settings,
  support_settings,
  content_settings,
  analytics_settings
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, -- Fixed UUID for dev
  'centriweb',
  'localhost',
  'enterprise',
  'active',
  '{"logo": "", "primaryColor": "#3b82f6", "companyName": "CentriWeb", "supportEmail": "support@centriweb.com"}'::jsonb,
  '{"guides": true, "aiChat": true, "analytics": true, "voiceInput": true, "badges": true, "gamification": true, "interactiveWalkthroughs": true, "whisperVoice": true, "customBranding": true, "ghlApiIntegration": true}'::jsonb,
  '{"tone": "professional", "ragEnabled": true, "voiceInputEnabled": true}'::jsonb,
  '{"ticketForm": {"embedCode": "https://link.centriweb.com/widget/form/YeI4hfsgWG9C6IosdXTn"}, "responseTime": "2-4 hours", "businessHours": "Mon-Fri 9am-5pm EST"}'::jsonb,
  '{"inheritBaseKB": true, "customKBEnabled": true, "allowOverrides": true}'::jsonb,
  '{"dashboardEnabled": true, "healthScoringEnabled": true, "exportEnabled": true, "retentionDays": 365}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- VIEWS FOR EASIER QUERYING
-- ============================================================================

-- View: All content for a tenant (base + overrides)
CREATE OR REPLACE VIEW tenant_content AS
SELECT
  c.*,
  t.slug AS tenant_slug,
  COALESCE(c.tenant_id, 'base') AS content_source
FROM content_items c
LEFT JOIN tenants t ON c.tenant_id = t.id
WHERE c.published = TRUE;

-- View: Analytics summary per sub-account
CREATE OR REPLACE VIEW sub_account_analytics_summary AS
SELECT
  sub_account_id,
  COUNT(*) AS total_events,
  COUNT(DISTINCT DATE(created_at)) AS active_days,
  COUNT(CASE WHEN event_type = 'guide_view' THEN 1 END) AS guide_views,
  COUNT(CASE WHEN event_type = 'search' THEN 1 END) AS searches,
  COUNT(CASE WHEN event_type = 'ai_chat' THEN 1 END) AS ai_chats,
  COUNT(CASE WHEN event_type = 'ticket_submit' THEN 1 END) AS tickets_submitted,
  MAX(created_at) AS last_activity
FROM analytics_events
GROUP BY sub_account_id;

COMMENT ON TABLE tenants IS 'Agency customers who subscribe to CentriWeb Support OS';
COMMENT ON TABLE sub_accounts IS 'Agency client locations (GHL sub-accounts) served by the portal';
COMMENT ON TABLE content_items IS 'Knowledge base content with inheritance and override support';
COMMENT ON TABLE analytics_events IS 'All user interactions for health scoring and analytics (competitive advantage)';
COMMENT ON TABLE health_scores IS 'Computed health scores per sub-account based on analytics events';
