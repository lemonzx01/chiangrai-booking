-- ===========================================
-- MIGRATION 0008: Email Verification, Availability, Cancellation & Refund
-- ===========================================

-- ---- Email Verification ----
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Google OAuth users are auto-verified
UPDATE public.users
  SET email_verified = true, email_verified_at = NOW()
  WHERE google_id IS NOT NULL;

-- ---- Availability ----
ALTER TABLE public.room_types
  ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 1 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_availability
  ON public.bookings(room_type_id, check_in_date, check_out_date, status);

CREATE INDEX IF NOT EXISTS idx_bookings_car_availability
  ON public.bookings(car_id, check_in_date, check_out_date, status);

-- ---- Cancellation & Refund ----
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_percentage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_status TEXT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
