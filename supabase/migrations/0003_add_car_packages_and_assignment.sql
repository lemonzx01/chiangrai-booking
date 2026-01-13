-- ===========================================
-- MIGRATION: ADD CAR PACKAGES & ASSIGNMENT
-- ===========================================
-- This migration adds:
-- 1. A `car_packages` table for fixed-price car services.
-- 2. A link from `bookings` to `car_packages`.
-- 3. A field in `bookings` to assign a partner (driver).
-- ===========================================

-- 1. CREATE car_packages TABLE
CREATE TABLE public.car_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_th TEXT,
  description_en TEXT,
  duration_hours INTEGER NOT NULL DEFAULT 8, -- Duration in hours for a single day trip
  duration_days INTEGER NOT NULL DEFAULT 1, -- Number of days for the package
  max_passengers INTEGER NOT NULL DEFAULT 4,
  price_thb DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.car_packages ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active packages
CREATE POLICY "Car packages are viewable by everyone" ON public.car_packages
  FOR SELECT USING (is_active = true);

-- Allow admin full access
-- NOTE: You should have an `is_admin()` function for this.
-- CREATE POLICY "Admin full access on car packages" ON public.car_packages
--   FOR ALL USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_car_packages_updated_at
  BEFORE UPDATE ON public.car_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SEED DATA for car packages
INSERT INTO public.car_packages (name_th, name_en, description_th, description_en, duration_days, max_passengers, price_thb, is_active)
VALUES 
  ('รถพร้อมคนขับ 1 วัน', 'Car with Driver (1 Day)', 'บริการรถพร้อมคนขับ 1 วัน (ไม่เกิน 8 ชั่วโมง) ในเชียงราย', 'Car with driver for 1 day (up to 8 hours) in Chiang Rai', 1, 4, 3300.00, true),
  ('รถพร้อมคนขับ 3 วัน', 'Car with Driver (3 Days)', 'บริการรถพร้อมคนขับ 3 วัน 2 คืน สำหรับทริปเชียงราย', 'Car with driver for 3 days 2 nights for a Chiang Rai trip', 3, 4, 9500.00, true);
  -- ('รถพร้อมคนขับ + โรงแรม 3 วัน 2 คืน', 'Car with Driver + Hotel (3D2N)', 'รถพร้อมคนขับ 3 วัน 2 คืน พร้อมที่พัก 1 ห้อง', 'Car with driver for 3 days 2 nights with 1 hotel room', 3, 2, 14000.00, false); -- Initially inactive


-- 2. MODIFY bookings TABLE

-- Add a column to link to the car_packages table
ALTER TABLE public.bookings
  ADD COLUMN car_package_id UUID REFERENCES public.car_packages(id) ON DELETE SET NULL;

-- Add a column to assign a partner (driver) to the booking
ALTER TABLE public.bookings
  ADD COLUMN assigned_partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

-- Add an index for the new columns
CREATE INDEX idx_bookings_car_package_id ON public.bookings(car_package_id);
CREATE INDEX idx_bookings_assigned_partner_id ON public.bookings(assigned_partner_id);


-- 3. UPDATE booking_type ENUM if it doesn't exist
-- This is a bit tricky in Postgres. A common way is to rename, create new, and copy data.
-- For now, we will assume the existing 'CAR' type is sufficient and we'll use `car_package_id` to differentiate.
-- If you need a distinct type, you would do this:
-- ALTER TYPE booking_type RENAME TO booking_type_old;
-- CREATE TYPE booking_type AS ENUM ('HOTEL', 'CAR', 'COMBO', 'CAR_PACKAGE');
-- ALTER TABLE bookings ALTER COLUMN booking_type TYPE booking_type USING booking_type::text::booking_type;
-- DROP TYPE booking_type_old;

