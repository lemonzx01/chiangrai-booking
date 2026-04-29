-- ===========================================
-- MIGRATION 0021: User wishlist (cross-device persistence)
-- ===========================================
--
-- Until now wishlist was localStorage-only — fine for guests,
-- but loses entries when a logged-in user switches devices.
-- This adds server-side persistence for authenticated users.
-- The localStorage path stays as the offline-first fallback;
-- the hook reconciles both sides on login.
--
-- Schema design notes:
--   - Composite primary key (user_id, kind, id) so re-saving
--     an item is idempotent — a single ON CONFLICT DO NOTHING
--     handles the "already in wishlist" case without an
--     extra select.
--   - kind is constrained to the same values the localStorage
--     hook uses (hotel | car) — keeps client + server in lock-
--     step.
--   - We don't FK to hotels/cars: those tables are mutable
--     (admin can hard-delete a hotel) and a wishlist entry
--     pointing at a deleted hotel is fine — the resolve step
--     just skips it. Cleaning up via a periodic job if it
--     becomes a real problem.
--   - added_at is the timestamp the user saved it (NOT the
--     migration time) so cross-device sort order is stable.
-- ===========================================

CREATE TABLE IF NOT EXISTS public.user_wishlist (
  user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind     TEXT NOT NULL,
  id       TEXT NOT NULL,         -- listing id (uuid as text — flexible)
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, kind, id),
  CONSTRAINT user_wishlist_kind_chk CHECK (kind IN ('hotel', 'car'))
);

-- Common query: "give me everything for user X, newest first".
CREATE INDEX IF NOT EXISTS idx_user_wishlist_user_added
  ON public.user_wishlist (user_id, added_at DESC);

-- RLS: this table is user-private. The backend uses service-role
-- and bypasses RLS, but we lock down anon read/write as
-- defense-in-depth in case the anon key is ever exposed.
ALTER TABLE public.user_wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no anon read"
  ON public.user_wishlist
  FOR SELECT
  USING (false);

CREATE POLICY "no anon write"
  ON public.user_wishlist
  FOR ALL
  USING (false)
  WITH CHECK (false);
