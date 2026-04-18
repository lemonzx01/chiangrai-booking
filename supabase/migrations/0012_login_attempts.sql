-- ============================================================
-- Migration 0012: Login Attempts (Account Lockout)
-- ============================================================
--
-- Records every login attempt so we can detect & block brute-force.
-- Policy (enforced in src/lib/lockout.ts):
--   - 5 failed attempts in 15 min => lock for 30 min
--   - Successful login resets the counter
--
-- A scheduled job should DELETE rows older than 24h periodically.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL,
  ip            TEXT,
  user_agent    TEXT,
  success       BOOLEAN NOT NULL DEFAULT false,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_attempted_at
  ON public.login_attempts(email, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_attempted_at
  ON public.login_attempts(ip, attempted_at DESC);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
-- Service role only — no anon access.

COMMENT ON TABLE public.login_attempts IS
  'Audit log for login attempts. Used by lockout.ts to throttle brute-force.';
