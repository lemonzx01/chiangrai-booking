-- ===========================================
-- MIGRATION 0025: Loyalty tier — lifetime earned counter
-- ===========================================
--
-- Phase 2 of the loyalty program. Phase 1 added a balance
-- counter (loyalty_points) that goes up on earn and down on
-- redeem. Tier eligibility needs a SEPARATE counter that only
-- goes up on earn — once you've earned 2000 points lifetime,
-- you're Gold even after spending some.
--
--   loyalty_lifetime_earned — sum of all positive deltas in
--     loyalty_ledger ever credited to this user. Never
--     decreases (redeem doesn't touch it).
--
-- Tier thresholds + earn multipliers live in code constants
-- (apps/backend/src/lib/loyalty.ts LOYALTY_TIERS) so we can
-- iterate on the program economics without DB churn:
--
--   Bronze  0+ lifetime    1.00x earn rate
--   Silver  500+           1.25x
--   Gold    2000+          1.50x
--
-- Backfill: set lifetime to current loyalty_points for every
-- existing user. That's correct only if no one has redeemed
-- yet (which is the case for migrations applied before phase 2
-- ships). After this migration, the lib enforces the
-- earn-only-grows invariant.
-- ===========================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS loyalty_lifetime_earned INTEGER NOT NULL DEFAULT 0;

-- Backfill from current balance — safe because no redemption
-- existed prior to this migration (phase 1.5 redeem was added
-- in 0024 but the production DB hasn't seen redemptions yet).
UPDATE public.users
   SET loyalty_lifetime_earned = loyalty_points
 WHERE loyalty_lifetime_earned = 0
   AND loyalty_points > 0;

-- Index for the (eventual) "leaderboard" admin query —
-- "show me top earners" without a full table scan.
CREATE INDEX IF NOT EXISTS idx_users_loyalty_lifetime
  ON public.users (loyalty_lifetime_earned DESC)
  WHERE loyalty_lifetime_earned > 0;
