-- ============================================================
-- Migration 0010: Tighten Row Level Security
-- ============================================================
--
-- The original schema.sql granted "Anyone can view bookings/payments"
-- which exposed customer PII (names, phones, emails) to anonymous
-- callers using the anon key. This migration:
--
--   1. DROPs the public read policies on bookings & payments
--   2. Replaces them with policies that scope reads to:
--        - the customer themselves (matched by JWT email)
--        - the partner who owns the booked hotel/car
--        - admins (handled by service-role bypass)
--   3. Tightens partners table to allow self-read only
--
-- The backend always uses createAdminClient() (service role) which
-- bypasses RLS, so this only affects code paths that use the anon
-- key — primarily public listing endpoints, which already only read
-- hotels/cars (not PII tables).
-- ============================================================

-- ---- Ensure RLS is on for sensitive tables ----
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ---- Drop legacy permissive policies ----
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can update bookings" ON public.bookings;

-- ---- bookings: own-rows policies ----
-- A signed-in user can read bookings whose customer_email matches
-- their JWT email claim.
CREATE POLICY "Customers can view own bookings"
  ON public.bookings
  FOR SELECT
  USING (
    customer_email = (auth.jwt() ->> 'email')
  );

-- Partners can read bookings for hotels/cars they own.
CREATE POLICY "Partners can view bookings for owned listings"
  ON public.bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.hotels h
      WHERE h.id = bookings.hotel_id
        AND h.owner_id::text = (auth.jwt() ->> 'sub')
    )
    OR EXISTS (
      SELECT 1
      FROM public.cars c
      WHERE c.id = bookings.car_id
        AND c.owner_id::text = (auth.jwt() ->> 'sub')
    )
  );

-- Admins can read everything (role claim in JWT).
CREATE POLICY "Admins can view all bookings"
  ON public.bookings
  FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin');

-- INSERT/UPDATE through anon key remains blocked — backend uses service role.

-- ---- payments: scoped reads ----
CREATE POLICY "Customers can view own payments"
  ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = payments.booking_id
        AND b.customer_email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Admins can view all payments"
  ON public.payments
  FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin');

-- ---- reviews: read approved only via anon, write via service role ----
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews
  FOR SELECT
  USING (is_approved = true);

-- ---- coupons: hidden from anon entirely ----
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view coupons" ON public.coupons;
-- (no policy = nothing visible to anon; backend reads via service role)

-- ---- partners: self-read only ----
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view partners" ON public.partners;
CREATE POLICY "Partners view self"
  ON public.partners
  FOR SELECT
  USING (
    user_id::text = (auth.jwt() ->> 'sub')
    OR (auth.jwt() ->> 'role') = 'admin'
  );

-- ---- users: self-read only (admins via service role) ----
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
CREATE POLICY "Users view self"
  ON public.users
  FOR SELECT
  USING (
    id::text = (auth.jwt() ->> 'sub')
    OR (auth.jwt() ->> 'role') = 'admin'
  );

-- ---- hotels & cars stay publicly readable (listings) ----
-- These contain no PII and need to be visible on the home page.
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view hotels" ON public.hotels;
CREATE POLICY "Anyone can view active hotels"
  ON public.hotels
  FOR SELECT
  USING (is_active = true OR is_active IS NULL);

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view cars" ON public.cars;
CREATE POLICY "Anyone can view active cars"
  ON public.cars
  FOR SELECT
  USING (is_active = true OR is_active IS NULL);
