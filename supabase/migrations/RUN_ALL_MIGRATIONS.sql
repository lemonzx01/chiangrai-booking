-- ===========================================
-- COMPLETE MIGRATION: MULTI-VENDOR SYSTEM
-- ===========================================
-- This file combines both migrations:
-- 1. Creates users table and user_role enum
-- 2. Migrates partners to users and adds owner_id
-- 
-- Run this entire file in Supabase SQL Editor
-- ===========================================

-- ===========================================
-- MIGRATION 1: ADD USERS TABLE
-- ===========================================

-- 1. CREATE USER ROLE ENUM
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'partner', 'user');

-- 2. CREATE USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role DEFAULT 'user' NOT NULL,
  google_id TEXT UNIQUE,
  password_hash TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Public read access for active users (limited fields)
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (is_active = true);

-- Users can view their own full profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 5. CREATE TRIGGER FOR updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. COMMENTS
COMMENT ON TABLE public.users IS 'Unified user table for admin, partner, and regular users';
COMMENT ON COLUMN public.users.role IS 'User role: admin, partner, or user';
COMMENT ON COLUMN public.users.google_id IS 'Google OAuth ID for Google login';
COMMENT ON COLUMN public.users.password_hash IS 'Hashed password for email/password login (nullable)';

-- ===========================================
-- MIGRATION 2: MIGRATE PARTNERS TO USERS
-- ===========================================

-- 1. MIGRATE PARTNERS TO USERS
-- Insert partners as users with role='partner'
INSERT INTO public.users (email, name, role, phone, is_active, created_at, updated_at)
SELECT 
  email,
  name,
  'partner'::user_role,
  phone,
  is_active,
  created_at,
  updated_at
FROM public.partners
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE users.email = partners.email
)
ON CONFLICT (email) DO NOTHING;

-- 2. ADD owner_id COLUMNS (if not exists)
-- Add owner_id to hotels table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'hotels' 
    AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.hotels
      ADD COLUMN owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add owner_id to cars table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cars' 
    AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.cars
      ADD COLUMN owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. MIGRATE partner_id TO owner_id
-- Update hotels.owner_id from hotels.partner_id
UPDATE public.hotels h
SET owner_id = u.id
FROM public.partners p
JOIN public.users u ON u.email = p.email AND u.role = 'partner'
WHERE h.partner_id = p.id
  AND h.owner_id IS NULL;

-- Update cars.owner_id from cars.partner_id
UPDATE public.cars c
SET owner_id = u.id
FROM public.partners p
JOIN public.users u ON u.email = p.email AND u.role = 'partner'
WHERE c.partner_id = p.id
  AND c.owner_id IS NULL;

-- 4. CREATE INDEXES FOR owner_id
CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON public.hotels(owner_id);
CREATE INDEX IF NOT EXISTS idx_cars_owner_id ON public.cars(owner_id);

-- 5. COMMENTS
COMMENT ON COLUMN public.hotels.owner_id IS 'Owner user ID (replaces partner_id)';
COMMENT ON COLUMN public.cars.owner_id IS 'Owner user ID (replaces partner_id)';

-- ===========================================
-- VERIFICATION QUERIES (Optional - uncomment to run)
-- ===========================================

-- Check users table
-- SELECT id, email, name, role, is_active FROM users ORDER BY created_at;

-- Check migrated partners
-- SELECT id, email, name, role FROM users WHERE role = 'partner';

-- Check hotels with owner_id
-- SELECT id, name_th, owner_id FROM hotels WHERE owner_id IS NOT NULL LIMIT 10;

-- Check cars with owner_id
-- SELECT id, name_th, owner_id FROM cars WHERE owner_id IS NOT NULL LIMIT 10;

-- ===========================================
-- MIGRATION COMPLETE!
-- ===========================================
-- Next steps:
-- 1. Verify the migration by running the queries above
-- 2. Test login with partner accounts
-- 3. Test partner dashboard
-- ===========================================
