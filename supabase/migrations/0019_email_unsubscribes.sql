-- ===========================================
-- MIGRATION 0019: Email unsubscribe list
-- ===========================================
--
-- A simple denylist of email addresses that have opted out
-- of marketing email. Transactional email (booking
-- confirmations, password resets, cancellation notices) is
-- sent regardless — those are operational, not marketing.
--
-- Why a separate table instead of a column on `users`:
--   - Most customers in `bookings.customer_email` aren't in
--     `users` (guest checkout). The unsubscribe list needs
--     to cover both.
--   - Email is the only stable identifier across guests +
--     account holders, so it's the natural primary key here.
--   - Denylist makes the "can we email this address?" check
--     a single index lookup with no joins.
-- ===========================================

CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  email TEXT PRIMARY KEY,                -- lowercased
  reason TEXT,                           -- optional free-text from the form
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Categories let us add finer-grained opt-outs later
  -- ("only news, keep promo") without a schema change. For
  -- now an empty array means "everything marketing".
  categories TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Lookups are always by exact email — primary key index covers it.
-- Add a created-time index for "show me recent unsubscribes" admin views.
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_at
  ON public.email_unsubscribes (unsubscribed_at DESC);

-- RLS: anonymous users CAN write to this table via the
-- /email-preferences page (the page itself authenticates via
-- HMAC-signed token, so the backend uses service-role to
-- insert). Lock down anon SELECT to prevent leaking the list.
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no anon read"
  ON public.email_unsubscribes
  FOR SELECT
  USING (false);

CREATE POLICY "no anon write"
  ON public.email_unsubscribes
  FOR ALL
  USING (false)
  WITH CHECK (false);
