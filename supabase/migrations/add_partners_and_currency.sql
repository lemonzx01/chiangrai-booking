-- ===========================================
-- Migration: Add Partners & Multi-Currency Support
-- ===========================================
-- This migration adds:
-- 1. Partners table for hotels and drivers
-- 2. Room types table (separate from hotels)
-- 3. Multi-currency support (THB, USD, EUR)
-- 4. Driver name/surname fields for cars
-- 5. Partner relationships for hotels and cars
-- ===========================================

-- ===========================================
-- 1. CREATE ENUMS
-- ===========================================

-- Partner type enum
CREATE TYPE partner_type AS ENUM ('HOTEL', 'DRIVER');

-- Currency type enum
CREATE TYPE currency_type AS ENUM ('THB', 'USD', 'EUR');

-- ===========================================
-- 2. CREATE PARTNERS TABLE
-- ===========================================

CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  type partner_type NOT NULL,
  stripe_account_id TEXT,
  commission_rate DECIMAL(5, 2) DEFAULT 10.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 3. CREATE ROOM TYPES TABLE
-- ===========================================

CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  price_per_night DECIMAL(10, 2) NOT NULL,
  max_guests INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 4. MODIFY HOTELS TABLE
-- ===========================================

-- Add partner_id (nullable for backward compatibility)
ALTER TABLE hotels
  ADD COLUMN partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

-- Add currency field
ALTER TABLE hotels
  ADD COLUMN currency currency_type DEFAULT 'THB';

-- Add base_price_per_night (migrate from price_per_night)
ALTER TABLE hotels
  ADD COLUMN base_price_per_night DECIMAL(10, 2);

-- Migrate existing price_per_night to base_price_per_night
UPDATE hotels
  SET base_price_per_night = price_per_night
  WHERE base_price_per_night IS NULL;

-- Make base_price_per_night NOT NULL after migration
ALTER TABLE hotels
  ALTER COLUMN base_price_per_night SET NOT NULL;

-- Note: We keep room_type_th and room_type_en for backward compatibility
-- but new bookings should use room_types table

-- ===========================================
-- 5. MODIFY CARS TABLE
-- ===========================================

-- Add partner_id (nullable for backward compatibility)
ALTER TABLE cars
  ADD COLUMN partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

-- Add driver name fields
ALTER TABLE cars
  ADD COLUMN driver_name TEXT,
  ADD COLUMN driver_surname TEXT;

-- Add currency field
ALTER TABLE cars
  ADD COLUMN currency currency_type DEFAULT 'THB';

-- Add base_price_per_day (migrate from price_per_day)
ALTER TABLE cars
  ADD COLUMN base_price_per_day DECIMAL(10, 2);

-- Migrate existing price_per_day to base_price_per_day
UPDATE cars
  SET base_price_per_day = price_per_day
  WHERE base_price_per_day IS NULL;

-- Make base_price_per_day NOT NULL after migration
ALTER TABLE cars
  ALTER COLUMN base_price_per_day SET NOT NULL;

-- ===========================================
-- 6. MODIFY BOOKINGS TABLE
-- ===========================================

-- Add currency field
ALTER TABLE bookings
  ADD COLUMN currency currency_type DEFAULT 'THB';

-- Add room_type_id (nullable - for hotel bookings)
ALTER TABLE bookings
  ADD COLUMN room_type_id UUID REFERENCES room_types(id) ON DELETE SET NULL;

-- ===========================================
-- 7. MODIFY PAYMENTS TABLE
-- ===========================================

-- Change currency from VARCHAR(3) to currency_type enum
-- First, ensure all existing values are valid
UPDATE payments
  SET currency = 'THB'
  WHERE currency NOT IN ('THB', 'USD', 'EUR') OR currency IS NULL;

-- Drop the old column and add new one with enum type
ALTER TABLE payments
  DROP COLUMN currency;

ALTER TABLE payments
  ADD COLUMN currency currency_type DEFAULT 'THB';

-- ===========================================
-- 8. CREATE INDEXES
-- ===========================================

-- Partners indexes
CREATE INDEX idx_partners_type ON partners(type);
CREATE INDEX idx_partners_is_active ON partners(is_active);
CREATE INDEX idx_partners_email ON partners(email);

-- Room types indexes
CREATE INDEX idx_room_types_hotel_id ON room_types(hotel_id);
CREATE INDEX idx_room_types_is_active ON room_types(is_active);

-- Hotels indexes (for new fields)
CREATE INDEX idx_hotels_partner_id ON hotels(partner_id);
CREATE INDEX idx_hotels_currency ON hotels(currency);

-- Cars indexes (for new fields)
CREATE INDEX idx_cars_partner_id ON cars(partner_id);
CREATE INDEX idx_cars_currency ON cars(currency);

-- Bookings indexes (for new fields)
CREATE INDEX idx_bookings_currency ON bookings(currency);
CREATE INDEX idx_bookings_room_type_id ON bookings(room_type_id);

-- ===========================================
-- 9. CREATE TRIGGERS
-- ===========================================

-- Trigger for partners updated_at
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for room_types updated_at
CREATE TRIGGER update_room_types_updated_at
  BEFORE UPDATE ON room_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on new tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

-- Public read access for active partners
CREATE POLICY "Partners are viewable by everyone" ON partners
  FOR SELECT USING (is_active = true);

-- Public read access for active room types
CREATE POLICY "Room types are viewable by everyone" ON room_types
  FOR SELECT USING (is_active = true);

-- ===========================================
-- 11. MIGRATION NOTES
-- ===========================================
-- 
-- Backward Compatibility:
-- - Existing hotels keep room_type_th and room_type_en fields
-- - Existing bookings without room_type_id will still work
-- - price_per_night and price_per_day are kept for compatibility
--   but new code should use base_price_per_night and base_price_per_day
-- 
-- Next Steps:
-- 1. Create room types for existing hotels
-- 2. Link hotels/cars to partners if needed
-- 3. Update application code to use new fields
-- ===========================================

































