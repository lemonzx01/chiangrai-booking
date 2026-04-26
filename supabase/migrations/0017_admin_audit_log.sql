-- ===========================================
-- MIGRATION 0017: Admin audit log
-- ===========================================
--
-- Why this exists:
--   admin_notifications is an inbox, not a log. We need an
--   immutable record of who did what, when, with what payload —
--   for compliance, debugging, and the inevitable "wait, who
--   refunded that booking?" conversation.
--
-- Design:
--   - Append-only. We never UPDATE or DELETE rows.
--   - actor_id references admins(id) but we keep the row even
--     if the admin is later deleted (ON DELETE SET NULL) —
--     audit history must outlive the admin account.
--   - target is a polymorphic pointer (resource_type + resource_id)
--     because admin actions touch many tables. Keeping it loose
--     beats a per-action table for ergonomics.
--   - metadata JSONB lets us record action-specific context
--     (refund amount, reason, old/new values) without schema churn.
-- ===========================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  actor_email TEXT,                          -- denormalized: survives admin deletion
  action TEXT NOT NULL,                      -- e.g. 'booking.refund', 'hotel.delete'
  resource_type TEXT,                        -- 'booking' | 'hotel' | 'car' | 'partner' | ...
  resource_id TEXT,                          -- string so non-UUID ids (booking_code) fit
  metadata JSONB DEFAULT '{}'::jsonb,        -- free-form context
  ip_address TEXT,                           -- request IP for forensics
  user_agent TEXT,
  request_id TEXT,                           -- correlates to logger's request id
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lookup patterns:
--   1. "what has admin X done?"          → actor_id + created_at
--   2. "what happened to booking Y?"      → resource_type + resource_id
--   3. "show all refunds in March"        → action + created_at
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor
  ON public.admin_audit_log (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_resource
  ON public.admin_audit_log (resource_type, resource_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_action
  ON public.admin_audit_log (action, created_at DESC);

-- Defensive: forbid UPDATE / DELETE at the RLS layer too.
-- The backend uses service-role which bypasses RLS, so this
-- is belt-and-braces against accidentally exposing the table
-- to anon clients in the future.
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no anon read"
  ON public.admin_audit_log
  FOR SELECT
  USING (false);

CREATE POLICY "no anon write"
  ON public.admin_audit_log
  FOR ALL
  USING (false)
  WITH CHECK (false);
