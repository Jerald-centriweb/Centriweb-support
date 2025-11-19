# Multi-Tenant Setup Guide

This document explains how the multi-tenant architecture works in CentriWeb Support OS.

## Architecture Overview

### Core Concepts

1. **Tenant** = Agency customer (pays monthly subscription)
2. **Sub-Account** = Agency's client (GHL location)
3. **User** = End user accessing the portal (from within GHL)

### How Tenant Detection Works

The system detects which tenant is accessing the portal in this order:

1. **Query Param** (Dev): `?tenant=acme-agency`
2. **Subdomain** (Production): `acme.supportos.io`
3. **Custom Domain** (Production): `support.acmeagency.com`
4. **Fallback**: Default tenant (`centriweb`)

## Setup Instructions

### 1. Supabase Setup

#### A. Create Supabase Project

1. Go to https://app.supabase.com
2. Create a new project
3. Wait for database provisioning (~2 minutes)

#### B. Run Migrations

1. Open SQL Editor in Supabase dashboard
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Run the migration
4. Verify tables created: `tenants`, `sub_accounts`, `content_items`, `analytics_events`, `health_scores`

#### C. Get API Keys

1. Go to Project Settings > API
2. Copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_KEY`

3. Create `.env` file in project root:
```bash
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

### 2. Local Development

#### A. Install Dependencies

```bash
npm install
```

#### B. Run Development Server

```bash
npm run dev
```

The app will run on `http://localhost:5173`

#### C. Test Tenant Detection

**Default Tenant (localhost)**:
- Navigate to: `http://localhost:5173`
- Uses default `centriweb` tenant config

**Query Param (dev mode)**:
- Navigate to: `http://localhost:5173?tenant=acme-agency`
- Loads `acme-agency` tenant from Supabase

### 3. Adding New Tenants

#### Via Supabase Dashboard

1. Go to Table Editor > `tenants`
2. Insert new row:
   - `slug`: `acme-agency` (URL-friendly, lowercase)
   - `domain`: `support.acmeagency.com` (optional, for custom domains)
   - `plan`: `starter` | `pro` | `enterprise`
   - `branding`: JSON object:
     ```json
     {
       "logo": "https://example.com/logo.png",
       "primaryColor": "#3b82f6",
       "companyName": "Acme Agency",
       "supportEmail": "support@acmeagency.com"
     }
     ```
   - `features`: JSON object (inherits from plan, can override):
     ```json
     {
       "badges": true,
       "gamification": true,
       "whisperVoice": false
     }
     ```
   - `ai_settings`, `support_settings`, `content_settings`, `analytics_settings`: See schema for structure

#### Via API (Future)

Once `/api/tenants/create` endpoint is built, tenants can be created via:
- Stripe webhook after payment
- Admin dashboard
- Onboarding flow

### 4. Feature Flags

Features are controlled at the tenant level via `TenantConfig.features`.

#### Feature Categories

**CORE** (always enabled):
- `guides`: Knowledge base browser
- `aiChat`: AI assistant
- `analytics`: Event tracking
- `voiceInput`: Voice input (Web Speech API)

**EXPERIMENTAL** (plan-gated):
- `badges`: Achievement/badge system
- `gamification`: Points, leaderboards, etc.
- `interactiveWalkthroughs`: Step-by-step overlays
- `whisperVoice`: Whisper API instead of Web Speech
- `customBranding`: Advanced logo/color customization
- `ghlApiIntegration`: Instance-aware features
- `coBrowsing`: Co-browsing support
- `multiLanguage`: Multi-language support

#### Using Feature Gates in Code

```tsx
import { FeatureGate } from './components/FeatureGate';

// Conditional rendering
<FeatureGate feature="badges">
  <BadgeSystem />
</FeatureGate>

// With fallback
<FeatureGate feature="whisperVoice" fallback={<WebSpeechInput />}>
  <WhisperInput />
</FeatureGate>

// In hook
import { useFeature } from './contexts/TenantContext';

const isEnabled = useFeature('gamification');
if (isEnabled) {
  // Logic only for tenants with gamification enabled
}
```

### 5. Content Management

#### Base Knowledge Base (Grey-Label)

Content with `tenant_id = NULL` is shared across all tenants.

Insert base content:
```sql
INSERT INTO content_items (
  tenant_id,
  type,
  category,
  title,
  slug,
  content,
  tags,
  published
) VALUES (
  NULL, -- base content
  'guide',
  'getting-started',
  'Platform Overview',
  'platform-overview',
  '# Welcome to GoHighLevel...',
  ARRAY['basics', 'intro'],
  true
);
```

#### Tenant-Specific Content

**Add custom content**:
```sql
INSERT INTO content_items (
  tenant_id,
  type,
  category,
  title,
  slug,
  content,
  published
) VALUES (
  'acme-tenant-uuid',
  'sop',
  'workflows',
  'Acme Lead Capture SOP',
  'acme-lead-capture',
  '# Our Custom Lead Capture Process...',
  true
);
```

**Override base content**:
```sql
-- Find base content ID first
SELECT id FROM content_items WHERE slug = 'platform-overview' AND tenant_id IS NULL;

-- Create override
INSERT INTO content_items (
  tenant_id,
  type,
  category,
  title,
  slug,
  content,
  is_override,
  overrides_id,
  published
) VALUES (
  'acme-tenant-uuid',
  'guide',
  'getting-started',
  'Acme Platform Overview',
  'platform-overview', -- same slug
  '# Welcome to Acme''s Custom GHL Setup...',
  true,
  'base-content-uuid', -- ID of base content
  true
);
```

### 6. Analytics Events

Track user interactions for health scoring:

```typescript
import { analytics } from './lib/analytics';

// Track guide view
analytics.trackGuideView('platform-overview', 'getting-started');

// Track search
analytics.trackSearch('how to create pipeline', 5);

// Track AI chat
analytics.trackAIChat(10, true); // 10 messages, was helpful

// Track ticket submit
analytics.trackTicketSubmit('billing', 'high');
```

Events are automatically scoped to:
- `tenant_id`
- `sub_account_id` (GHL location)
- `user_id` (GHL user or anonymous session)

### 7. Deployment

#### Vercel Deployment

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
4. Deploy

#### Custom Domain Setup (Per Tenant)

1. Tenant adds DNS record:
   ```
   CNAME support -> cname.vercel-dns.com
   ```

2. Add domain in Vercel:
   - Go to Project Settings > Domains
   - Add: `support.acmeagency.com`

3. Update tenant in Supabase:
   ```sql
   UPDATE tenants
   SET domain = 'support.acmeagency.com'
   WHERE slug = 'acme-agency';
   ```

Now `support.acmeagency.com` will automatically load Acme's config!

### 8. GHL Integration

#### Embedding in GoHighLevel

1. In GHL, go to Settings > Custom Menu Links
2. Add new link:
   - **Name**: Support Portal
   - **URL**: `https://supportos.io?tenant=acme-agency&location_id={{location.id}}&user_id={{user.id}}`
   - **Icon**: Select appropriate icon
   - **Open in**: iFrame or New Tab

The URL params allow:
- `tenant=acme-agency` → Load correct tenant
- `location_id={{location.id}}` → Track which sub-account
- `user_id={{user.id}}` → Track which user

#### Context Detection

The app auto-detects GHL context:
- Tenant from URL
- Sub-account from `location_id` param
- User from `user_id` param or anonymous session

## Troubleshooting

### Tenant Not Found

**Error**: `404: Tenant not found`

**Solutions**:
1. Check tenant slug spelling (case-sensitive, must be lowercase)
2. Verify tenant exists in Supabase `tenants` table
3. Check tenant status is `active`, not `cancelled` or `suspended`

### Feature Not Showing

**Issue**: Feature like badges not appearing

**Check**:
1. Tenant's plan supports feature: `SELECT plan, features FROM tenants WHERE slug = 'your-tenant'`
2. Feature is enabled in `features` JSONB: `features->>'badges' = 'true'`
3. Component is wrapped in `<FeatureGate feature="badges">`

### API Routes Not Working

**Issue**: `/api/tenants/...` returns 404

**Vercel-specific**:
- Ensure `/api` directory exists at project root (not in `/src`)
- Check `vercel.json` configuration (if any)
- Verify environment variables are set in Vercel dashboard

**Local dev**:
- Vite doesn't support API routes by default
- Use Vercel CLI for local testing: `vercel dev`
- Or proxy API requests to Supabase edge functions

## Next Steps

1. **Phase 2**: Implement analytics tracking (see `ANALYTICS_SETUP.md`)
2. **Phase 3**: Load guides from Supabase (see `CONTENT_SETUP.md`)
3. **Phase 4**: Add voice input (see `VOICE_SETUP.md`)
4. **Phase 5**: Build admin dashboard

## Support

For issues or questions:
- Check Supabase logs: Database > Logs
- Check Vercel logs: Deployment > Logs
- Console logs show tenant detection: `[TenantLoader]` prefix
