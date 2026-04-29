-- ===========================================
-- MIGRATION 0023: Referral reward issuance
-- ===========================================
--
-- Phase 2 of the referral program. Phase 1 (migration 0022)
-- recorded who referred whom; this migration adds the schema
-- needed to safely *issue* coupon rewards to both sides.
--
-- Two new columns on coupons:
--
--   bound_to_email — TEXT, nullable. When set, this coupon
--     can ONLY be redeemed by a booking whose customer_email
--     matches (case-insensitive). NULL = unbound, i.e. a
--     traditional public coupon code anyone can use.
--
--     Why bind by email and not by user_id: bookings carry a
--     customer_email but not necessarily a user_id (guests can
--     book without an account). Binding by email covers both
--     authenticated and guest checkouts uniformly.
--
--   source — TEXT, nullable. A short label tagging where the
--     coupon came from. Currently 'referral_referrer' or
--     'referral_referee'. Lets admins filter / report on
--     auto-issued vs hand-rolled promo codes.
--
-- We do NOT enforce the bound_to_email check at the DB layer
-- (no CHECK / trigger). That would mean every booking insert
-- needs to know about coupon redemption logic — a layering
-- violation. Instead we enforce in the validateCouponForBooking
-- helper which is the single chokepoint all redemption goes
-- through (checkout, validate endpoint, webhook).
-- ===========================================

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS bound_to_email TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT;

-- Partial index — only covers bound coupons, since the bulk
-- of the table is unbound (admin-issued promo codes) and we
-- don't query by bound_to_email for those.
CREATE INDEX IF NOT EXISTS idx_coupons_bound_email
  ON public.coupons (lower(bound_to_email))
  WHERE bound_to_email IS NOT NULL;

-- Source filter for admin reporting ("show me all referral
-- coupons issued in March").
CREATE INDEX IF NOT EXISTS idx_coupons_source
  ON public.coupons (source, created_at DESC)
  WHERE source IS NOT NULL;
