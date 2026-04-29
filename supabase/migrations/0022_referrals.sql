-- ===========================================
-- MIGRATION 0022: Referral program
-- ===========================================
--
-- Phase 1: track who referred whom. Reward issuance (auto-
-- coupons on first paid booking) is wired separately in a
-- later migration.
--
-- Schema:
--   users.referral_code    — short, URL-safe, unique per user.
--                            Generated on first need (lazy);
--                            stored once written.
--   referrals              — one row per (referrer, referee).
--                            UNIQUE (referee_id) enforces "you
--                            can only be referred ONCE" — first
--                            attribution wins.
--                            UNIQUE (referrer_id, referee_id)
--                            is implied by the referee constraint.
--
-- We deliberately don't store the URL the user was referred
-- from, fingerprint, or anything that could be used to attack
-- the attribution flow. Referral codes are short enough that
-- guessing them is hard but not impossible — the worst case
-- is one user falsely getting credit for another's signup,
-- which is a trivially-small fraud risk for a travel app.
-- ===========================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Faster lookup-by-code at signup time.
CREATE INDEX IF NOT EXISTS idx_users_referral_code
  ON public.users (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- The user whose code was used.
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- The user who signed up.
  referee_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Snapshot of the code at signup time. If the referrer
  -- regenerates their code later, this row still tells us
  -- which code was used to attribute.
  referral_code TEXT NOT NULL,

  -- Status tracks the funnel for the reward flow:
  --   'pending'   — referee signed up, no booking yet
  --   'qualified' — referee made their first paid booking;
  --                 rewards are eligible to issue
  --   'rewarded'  — coupons have been issued to both sides
  --   'voided'    — admin reversed the referral (fraud, etc.)
  status TEXT NOT NULL DEFAULT 'pending',

  qualified_at TIMESTAMPTZ,
  rewarded_at  TIMESTAMPTZ,

  -- Coupon codes generated for each side (populated when
  -- status flips to 'rewarded'). Keeping them on the row
  -- makes "show the user their reward" a single SELECT.
  referrer_coupon_code TEXT,
  referee_coupon_code  TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A user can be the REFEREE only once — first attribution wins.
  CONSTRAINT referrals_referee_unique UNIQUE (referee_id),

  -- Self-referral makes no sense and is a common gaming attempt.
  CONSTRAINT referrals_no_self CHECK (referrer_id <> referee_id),

  CONSTRAINT referrals_status_chk CHECK (
    status IN ('pending', 'qualified', 'rewarded', 'voided')
  )
);

-- Common queries:
--   1. "Show me everyone X has referred"  → referrer_id + created_at
--   2. "Has the referee booked yet?"      → status partial idx
CREATE INDEX IF NOT EXISTS idx_referrals_referrer
  ON public.referrals (referrer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referrals_pending
  ON public.referrals (status, created_at DESC)
  WHERE status IN ('pending', 'qualified');

-- RLS: defense-in-depth. Backend uses service-role and
-- bypasses; lock anon out so a leaked anon key doesn't expose
-- referrer-referee social graph.
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no anon read"
  ON public.referrals FOR SELECT USING (false);

CREATE POLICY "no anon write"
  ON public.referrals FOR ALL USING (false) WITH CHECK (false);
