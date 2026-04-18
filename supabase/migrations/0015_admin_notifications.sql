-- ============================================================
-- 0015_admin_notifications.sql
-- Admin notification inbox (new booking, cancellation, review, etc.)
-- ============================================================
-- Rationale
--   Today, admin-visible events are only reachable via email or by
--   hunting in the relevant admin page. A first-class in-app inbox
--   lets the admin see what needs attention on login without relying
--   on SMTP.
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  data JSONB,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unread feed queries hit (is_read, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread
  ON admin_notifications (is_read, created_at DESC);

-- "Find all events of type X" (used by dedupe jobs, analytics)
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type
  ON admin_notifications (type, created_at DESC);

-- RLS: admin-only. Service role bypasses RLS so backend can always write.
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_notifications_admin_read ON admin_notifications;
CREATE POLICY admin_notifications_admin_read ON admin_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid() AND admins.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS admin_notifications_admin_update ON admin_notifications;
CREATE POLICY admin_notifications_admin_update ON admin_notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid() AND admins.is_active = TRUE
    )
  );
