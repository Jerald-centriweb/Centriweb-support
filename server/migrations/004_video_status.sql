-- PreBuild Support Portal — video sharing health (2026-07-13/14).
--
-- The Notion sync (server/notion-sync.mjs) now resolves a guide's video from
-- either the Notion "Video" property or a recognised video link/embed found
-- in the page BODY (Jerald will not always use the property), and — for
-- Google Drive links specifically — actively checks whether the file is
-- shared "Anyone with the link can view" every single run, never gated
-- behind the content-unchanged short-circuit, because Drive sharing can
-- change with zero corresponding Notion edit to trigger a re-check.
--
-- The result is stored here rather than recomputed by the client, because an
-- iframe blocked by Google's sign-in wall is cross-origin — the client's own
-- JS cannot introspect why it failed to load. Storing it server-side is the
-- only way the front end can know to hide a broken embed and fall back to
-- the written steps, and the only way we (not the client) get alerted the
-- moment a video newly turns unreachable (see alertInbox usage in
-- notion-sync.mjs).
--
-- video_status is NULL whenever there is no video at all. Once a video
-- exists: 'ok' (reachable, or a non-Drive host we don't actively probe —
-- YouTube/Loom/Vimeo), or 'unreachable' (Drive returned a sign-in wall or
-- 404). video_status_reason carries the human-readable detail for whoever
-- is debugging (logs / direct DB read) — never shown to a client.
ALTER TABLE guides ADD COLUMN IF NOT EXISTS video_status TEXT
  CHECK (video_status IN ('ok','unreachable'));
ALTER TABLE guides ADD COLUMN IF NOT EXISTS video_status_reason TEXT;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS video_checked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_guides_video_status ON guides(video_status) WHERE video_status IS NOT NULL;
