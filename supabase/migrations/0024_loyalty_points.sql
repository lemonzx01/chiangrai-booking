-- ===========================================
-- MIGRATION 0024: Loyalty points (phase 1 — counter + ledger)
-- ===========================================
--
-- Phase 1 of the loyalty program: track earned points so users
-- can see "you have N points" on their profile. Tier rules
-- (Bronze/Silver/Gold thresholds, persistent discounts) are
-- intentionally NOT in this migration — phase 2 layers tiers
-- on top of the same ledger without schema churn.
--
-- Earn rule (phase 1):
--   - 1 point per ฿100 spent on a paid booking
--   - Awarded when the booking flips to PAID via Stripe webhook
--   - Idempotent: re-processing the same booking awards once
--
-- Schema:
--   users.loyalty_points  — running counter for fast read
--   loyalty_ledger        — every change rendered as a row;
--                           lets us audit, retroactively rebuild
--                           the counter, and (eventually) gate
--                           tier transitions on lifetime sum
--
-- We deliberately denormalize the counter on users.* instead of
-- summing the ledger every read. The counter is the truth for
-- display; the ledger is the source-of-truth for "why is the
-- counter what it is." Both are written atomically inside
-- award_loyalty_points() so they can't drift.
-- ===========================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.loyalty_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Whose balance this row affects.
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Signed delta — can be negative (redemption, void, admin adjust).
  delta INTEGER NOT NULL CHECK (delta <> 0),

  -- 'earn'   — booked + paid → automatic award
  -- 'redeem' — user spent points (phase 2)
  -- 'void'   — admin reversed an earn (fraud, refund, etc.)
  -- 'adjust' — admin manual adjustment (positive or negative)
  kind TEXT NOT NULL,

  -- Provenance: what generated this row.
  --   ('booking', booking_id) for earns from paid bookings
  --   ('manual',  null)       for admin adjustments
  source_type TEXT,
  source_id   TEXT,

  -- Free-form note. For 'earn' rows we put the booking code +
  -- amount; for 'adjust' the admin's reason; for 'redeem' the
  -- coupon issued (phase 2).
  reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT loyalty_ledger_kind_chk
    CHECK (kind IN ('earn', 'redeem', 'void', 'adjust'))
);

-- Idempotency: each booking earns points exactly ONCE.
-- A unique partial index on (source_id) for kind='earn' +
-- source_type='booking' rejects duplicate earns at the DB
-- layer, so re-firing the Stripe webhook doesn't double-credit.
CREATE UNIQUE INDEX IF NOT EXISTS loyalty_ledger_booking_earn_unique
  ON public.loyalty_ledger (source_id)
  WHERE kind = 'earn' AND source_type = 'booking';

-- Most-common query: "give me this user's recent activity."
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_user_created
  ON public.loyalty_ledger (user_id, created_at DESC);

-- RLS: defense-in-depth. Backend uses service-role and bypasses
-- RLS, but we lock anon read/write so a leaked anon key doesn't
-- expose every user's earning history (which by itself isn't
-- sensitive, but plus an email join would be).
ALTER TABLE public.loyalty_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no anon read"
  ON public.loyalty_ledger FOR SELECT USING (false);

CREATE POLICY "no anon write"
  ON public.loyalty_ledger FOR ALL USING (false) WITH CHECK (false);
