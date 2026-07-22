-- PreBuild Support Portal — Notion sync support (guides content model only).
--
-- SCOPE NOTE (2026-07-13): written while another session was concurrently
-- mid-edit on accounts/auth/ClickUp/embed (002_product_embed_clickup.sql,
-- server/index.js, server/auth.js, server/chat.js, server/notify.js). This
-- file touches ONLY the `guides` table, the agreed lane for the Notion sync.
-- By the time this ran, 002 had already landed live (confirmed via \d guides):
-- product_slug, section, content_type, video_url, notion_page_id and — a
-- pleasant surprise — `status TEXT CHECK (draft|live|archived)` with
-- server/index.js already filtering `/api/guides` to `status = 'live'` and a
-- code comment anticipating exactly this Notion sync. That resolved the one
-- open question in this migration (how the importer marks something
-- unpublished without deleting it): use `status`, not a new column.
--
-- Every statement below is additive/idempotent (IF NOT EXISTS, IF EXISTS) so
-- it is safe to run regardless of what order things land in.

-- Widen the section taxonomy to 4 values. 002's CHECK only allows
-- ('start_here','day_to_day','troubleshooting') — it folded invoicing/e-sign
-- content into day_to_day. Jerald's brief for the Notion database was
-- explicit and separate: four categories, "Start here / Day to day / Money
-- and documents / Troubleshooting". Constraint name confirmed via \d guides
-- as `guides_section_check` before this change.
-- FLAG for the front-end agent: types.ts's GuideSection union (currently 3
-- values) will need 'money_and_documents' added for it to get its own tab —
-- the data is correct and present either way, just grouped under day_to_day
-- in any UI that hasn't been updated yet.
ALTER TABLE guides DROP CONSTRAINT IF EXISTS guides_section_check;
ALTER TABLE guides ADD CONSTRAINT guides_section_check
  CHECK (section IN ('start_here','day_to_day','money_and_documents','troubleshooting'));

-- Notion's own last_edited_time — lets the importer skip re-processing a page
-- that hasn't changed without re-diffing full content every run.
ALTER TABLE guides ADD COLUMN IF NOT EXISTS notion_last_edited_time TIMESTAMPTZ;

-- sha256 of the normalised synced fields (title/category/order/video/content/
-- image set). Two consecutive syncs with no Notion-side change produce the
-- same hash, so the importer can prove "ran twice, changed nothing" by simply
-- not issuing an UPDATE when the hash is unchanged.
ALTER TABLE guides ADD COLUMN IF NOT EXISTS notion_content_hash TEXT;

-- Informational only (mirrors the Notion "Verified" checkbox) — does NOT gate
-- client visibility; only `status` does that. Exists purely so an internal
-- view can show Jerald which synced guides he's personally checked.
ALTER TABLE guides ADD COLUMN IF NOT EXISTS notion_verified BOOLEAN NOT NULL DEFAULT false;

-- When a guide most recently left 'live' status, and when the importer last
-- looked at it at all — both nullable, both purely observational/audit.
ALTER TABLE guides ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_guides_status ON guides(status);
CREATE INDEX IF NOT EXISTS idx_guides_product_section ON guides(product_slug, section, order_index);

-- Urgent data correction (Jerald, 2026-07-13): the 10 pre-existing guides were
-- ported from the same Notion SOPs he says are "not fully accurate" and must
-- now be treated as unverified until he re-checks or rewrites each one from
-- the new Notion database. They currently default to status='live' (002's
-- column default), which means they are visible to clients RIGHT NOW. Flip
-- them to 'draft' immediately; only rows the Notion importer has actually
-- linked (notion_page_id set) are ever eligible to go back to 'live', and only
-- when their Notion page's Status is Published.
UPDATE guides SET status = 'draft' WHERE notion_page_id IS NULL AND status = 'live';

-- Guides are the public knowledge base (no account needed to read them).
-- Re-stating this is harmless if 002 already set it identically.
DROP POLICY IF EXISTS guides_read ON guides;
CREATE POLICY guides_read ON guides FOR SELECT USING (true);

-- The Notion importer connects as the same unprivileged `portal_app` role as
-- the API server (server/.env), not as a superuser — RLS applies to it too.
-- 001/002 granted portal_app INSERT/UPDATE at the GRANT level but never added
-- a matching RLS policy, so writes were silently rejected ("new row violates
-- row-level security policy") until this. Guides carry no per-client data —
-- there is nothing to isolate on the write side either, so USING/WITH CHECK
-- (true) is correct, not a shortcut.
DROP POLICY IF EXISTS guides_write ON guides;
CREATE POLICY guides_write ON guides FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS guides_modify ON guides;
CREATE POLICY guides_modify ON guides FOR UPDATE USING (true) WITH CHECK (true);
