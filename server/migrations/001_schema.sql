-- PreBuild Support Portal v2 — self-hosted Postgres schema
-- NOTE: this is plain Postgres (not the full Supabase stack: no GoTrue/PostgREST/Studio).
-- Auth + RLS-claim propagation are handled by our Express server (server/index.js),
-- which signs its own JWTs and sets `app.account_id` per request via set_config()
-- inside the same transaction that runs the query, so the RLS policies below
-- can key off it exactly the way Supabase's `auth.uid()` pattern works.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- ACCOUNTS  (one row per builder client — the isolation boundary)
-- ============================================================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- GUIDES  (shared help content — not account-scoped)
-- ============================================================================
CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  minutes INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  content_format TEXT NOT NULL DEFAULT 'html' CHECK (content_format IN ('html','md')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TICKETS  (account-scoped — must be isolated per account)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','closed')),
  source TEXT NOT NULL DEFAULT 'portal', -- 'portal' | 'chat_escalation'
  notified_inbox BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_account ON tickets(account_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- ============================================================================
-- CHAT LOG  (account-scoped, for grounding audit + escalation trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  grounded BOOLEAN NOT NULL DEFAULT TRUE, -- false if this was a refusal (no grounding found)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_account ON chat_messages(account_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

-- Guides: readable by anyone with a valid session (app.account_id set to any non-empty value)
CREATE POLICY guides_read ON guides FOR SELECT
  USING (current_setting('app.account_id', true) IS NOT NULL AND current_setting('app.account_id', true) <> '');

-- Accounts: an account can only ever see its own row
CREATE POLICY accounts_self ON accounts FOR SELECT
  USING (id = NULLIF(current_setting('app.account_id', true), '')::uuid);

-- Tickets: strictly scoped to the calling account for read AND write
CREATE POLICY tickets_isolated_select ON tickets FOR SELECT
  USING (account_id = NULLIF(current_setting('app.account_id', true), '')::uuid);

CREATE POLICY tickets_isolated_insert ON tickets FOR INSERT
  WITH CHECK (account_id = NULLIF(current_setting('app.account_id', true), '')::uuid);

CREATE POLICY tickets_isolated_update ON tickets FOR UPDATE
  USING (account_id = NULLIF(current_setting('app.account_id', true), '')::uuid);

-- Chat messages: same isolation pattern
CREATE POLICY chat_isolated_select ON chat_messages FOR SELECT
  USING (account_id = NULLIF(current_setting('app.account_id', true), '')::uuid);

CREATE POLICY chat_isolated_insert ON chat_messages FOR INSERT
  WITH CHECK (account_id = NULLIF(current_setting('app.account_id', true), '')::uuid);

-- ============================================================================
-- APPLICATION ROLE
-- The Express server connects as `portal_app`, a non-superuser role, so RLS
-- actually applies (table owners / superusers bypass RLS by default in Postgres).
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'portal_app') THEN
    -- Real password is set separately post-migration (see .secrets/portal_pg.env) —
    -- never commit a real credential into this tracked file.
    CREATE ROLE portal_app LOGIN PASSWORD 'CHANGE_ME_PLACEHOLDER';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE portal TO portal_app;
GRANT USAGE ON SCHEMA public TO portal_app;
GRANT SELECT, INSERT, UPDATE ON accounts, guides, tickets, chat_messages TO portal_app;

-- ============================================================================
-- LOGIN LOOKUP (SECURITY DEFINER)
-- accounts_self RLS above means portal_app can normally only read a row it
-- already knows the id of — correct for the isolation model, but login has
-- to find an account by EMAIL before any id/session exists. This function
-- runs with the definer's (table owner's) privileges, bypassing RLS, but
-- only to return the fields needed to verify a password — it is the single,
-- deliberate, narrow exception to "portal_app never bypasses RLS".
-- ============================================================================
CREATE OR REPLACE FUNCTION account_login_lookup(p_email text)
RETURNS TABLE(id uuid, slug text, company_name text, password_hash text)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT id, slug, company_name, password_hash FROM accounts WHERE contact_email = p_email;
$$;

REVOKE ALL ON FUNCTION account_login_lookup(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION account_login_lookup(text) TO portal_app;
