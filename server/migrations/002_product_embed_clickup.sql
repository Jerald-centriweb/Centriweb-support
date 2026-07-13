-- PreBuild Support Portal v3 — product-first content model + verified GHL-embed
-- identity + ClickUp task routing.
--
-- Context: v2 (001_schema.sql) treated the portal as single-product with a flat
-- guide category and password-login-only identity. Three changes landed at once:
--  1. Content is now PRODUCT-first (PreBuild today, more products later), with
--     guides grouped into a fixed onboarding path (section) and first-class
--     video support.
--  2. Client identity comes ONLY from the embed (a signed JWT baked into a GHL
--     custom value per sub-account) — there is no client signup/login. Accounts
--     are provisioned by us (server/provision-account.mjs), keyed by the
--     sub-account's GHL location id, never by a client-submitted form.
--  3. Tickets fan out to ClickUp (in addition to Postgres + the OS inbox), so
--     Jerald never has to check a queue that isn't ClickUp.

-- ============================================================================
-- PRODUCTS — top-level of the SOP model. One row today (prebuild); more later.
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- "PreBuild" is the client-visible product name (the sales/internal name
-- "Signed-Jobs System" must never appear on this side of the surface).
INSERT INTO products (slug, name, description, order_index)
VALUES ('prebuild', 'PreBuild', 'Guides and support for your PreBuild dashboard.', 1)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ACCOUNTS — add GHL-embed identity + ClickUp routing + revocable embed tokens.
-- Client accounts never have a usable password; only internal accounts do.
-- contact_email/password_hash become optional because client accounts are
-- provisioned from sub-account identity, not a signup form.
-- ============================================================================
ALTER TABLE accounts ALTER COLUMN contact_email DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS ghl_location_id TEXT UNIQUE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS clickup_list_name TEXT; -- matched against a ClickUp FOLDER first, see server/clickup.js
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS ghl_api_key TEXT; -- optional, per-account PIT for the secondary GHL-side verification; null = skipped
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- token_version lets us instantly revoke a leaked/rotated embed token without
-- touching the client's GHL custom value at all — bump it and every existing
-- embed JWT for that account stops working on its next request.

-- ============================================================================
-- GUIDES — product-first, section-first (onboarding path), video-first-class.
-- ============================================================================
ALTER TABLE guides ADD COLUMN IF NOT EXISTS product_slug TEXT NOT NULL DEFAULT 'prebuild' REFERENCES products(slug);
ALTER TABLE guides ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'day_to_day'
  CHECK (section IN ('start_here','day_to_day','troubleshooting'));
ALTER TABLE guides ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'article'
  CHECK (content_type IN ('article','video','mixed'));
ALTER TABLE guides ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS notion_page_id TEXT UNIQUE; -- idempotency key for the Notion importer
ALTER TABLE guides ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'live'
  CHECK (status IN ('draft','live','archived'));
-- Existing rows default to 'live' (already reviewed, migrated content). A
-- content sync seeding NEW guides (e.g. from Notion) should insert them as
-- 'draft' until reviewed — the client-facing endpoints only ever serve
-- status = 'live', so an inaccurate draft is never shown to a builder.

-- Backfill the 10 existing guides into the onboarding-path sections using their
-- current categories (this is a one-time reclassification of known rows).
UPDATE guides SET section = 'start_here'
  WHERE slug IN ('start-here', 'getting-leads-in', 'what-happens-automatically');
UPDATE guides SET section = 'troubleshooting'
  WHERE slug IN ('getting-help-fast');
UPDATE guides SET section = 'day_to_day'
  WHERE slug IN ('when-a-lead-replies','your-pipeline','adding-a-contact-to-a-job',
                 'your-notifications','sending-an-invoice','getting-documents-signed');

-- ============================================================================
-- TICKETS — record which sub-account raised it (denormalised, survives account
-- edits) and the ClickUp task outcome (success or a visible failure reason).
-- ============================================================================
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS product_slug TEXT NOT NULL DEFAULT 'prebuild';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ghl_location_id TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS clickup_task_id TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS clickup_task_url TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS clickup_error TEXT; -- non-null = ClickUp push failed; ticket still saved

-- ============================================================================
-- RLS — guides/products are the public knowledge base (same content whichever
-- account, or no account at all — this is what makes a help.centriweb.info
-- redirect possible later). Isolation only ever applied to tickets/chat.
-- ============================================================================
DROP POLICY IF EXISTS guides_read ON guides;
CREATE POLICY guides_read ON guides FOR SELECT USING (true);

CREATE POLICY products_read ON products FOR SELECT USING (true);

GRANT SELECT ON products TO portal_app;

-- ============================================================================
-- Internal admin lookup (mirrors account_login_lookup but only ever returns
-- accounts explicitly flagged is_internal — a client account can never gain a
-- password login even if one were accidentally set).
-- ============================================================================
CREATE OR REPLACE FUNCTION account_login_lookup(p_email text)
RETURNS TABLE(id uuid, slug text, company_name text, password_hash text)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT id, slug, company_name, password_hash
  FROM accounts
  WHERE contact_email = p_email AND is_internal = true AND password_hash IS NOT NULL;
$$;
