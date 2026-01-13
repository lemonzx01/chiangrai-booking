-- ===========================================
-- MIGRATION: MIGRATE FROM STRIPE TO OMISE
-- ===========================================
-- This migration changes payment system from Stripe to Omise:
-- 1. Rename stripe fields to omise fields in payments table
-- 2. Rename stripe_account_id to omise_recipient_id in partners table
-- 3. Update indexes
-- ===========================================

-- ===========================================
-- 1. UPDATE PAYMENTS TABLE
-- ===========================================

-- Add new Omise columns
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS omise_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS omise_source_id TEXT,
  ADD COLUMN IF NOT EXISTS omise_payment_intent_id TEXT;

-- Migrate data from Stripe to Omise (if any)
-- Note: This is a one-way migration. Old Stripe data will be preserved but not used.
-- UPDATE public.payments
--   SET omise_charge_id = stripe_payment_intent_id
--   WHERE stripe_payment_intent_id IS NOT NULL;

-- Create indexes for new Omise columns
CREATE INDEX IF NOT EXISTS idx_payments_omise_charge ON payments(omise_charge_id);
CREATE INDEX IF NOT EXISTS idx_payments_omise_source ON payments(omise_source_id);

-- Drop old Stripe indexes (keep columns for backward compatibility during transition)
-- DROP INDEX IF EXISTS idx_payments_stripe_session;

-- ===========================================
-- 2. UPDATE PARTNERS TABLE
-- ===========================================

-- Add new Omise column
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS omise_recipient_id TEXT;

-- Migrate data from Stripe to Omise (if any)
-- Note: Omise Recipients work differently from Stripe Connect accounts
-- This migration preserves the old stripe_account_id for reference
-- UPDATE public.partners
--   SET omise_recipient_id = stripe_account_id
--   WHERE stripe_account_id IS NOT NULL;

-- Create index for new Omise column
CREATE INDEX IF NOT EXISTS idx_partners_omise_recipient ON partners(omise_recipient_id);

-- ===========================================
-- 3. COMMENTS
-- ===========================================

COMMENT ON COLUMN public.payments.omise_charge_id IS 'Omise Charge ID for payment tracking';
COMMENT ON COLUMN public.payments.omise_source_id IS 'Omise Source ID for Internet Banking, TrueMoney, PromptPay';
COMMENT ON COLUMN public.payments.omise_payment_intent_id IS 'Omise Payment Intent ID (for future use)';
COMMENT ON COLUMN public.partners.omise_recipient_id IS 'Omise Recipient ID for partner payouts';

-- Note: Old Stripe columns (stripe_payment_intent_id, stripe_checkout_session_id, stripe_account_id)
-- are kept for backward compatibility and data migration purposes.
-- They can be removed in a future migration after confirming all data has been migrated.
