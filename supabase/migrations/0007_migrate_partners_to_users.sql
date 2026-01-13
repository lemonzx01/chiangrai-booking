-- ===========================================
-- MIGRATION: MIGRATE PARTNERS TO USERS
-- ===========================================
-- This migration:
-- 1. Migrates existing partners to users table (role='partner')
-- 2. Creates mapping between old partner.id and new user.id
-- 3. Updates hotels.partner_id and cars.partner_id to reference users.id
-- 4. Keeps partners table for backward compatibility (deprecated)
-- ===========================================

-- ===========================================
-- 1. MIGRATE PARTNERS TO USERS
-- ===========================================

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

-- ===========================================
-- 2. ADD owner_id COLUMNS (if not exists)
-- ===========================================

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

-- ===========================================
-- 3. MIGRATE partner_id TO owner_id
-- ===========================================

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

-- ===========================================
-- 4. CREATE INDEXES FOR owner_id
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON public.hotels(owner_id);
CREATE INDEX IF NOT EXISTS idx_cars_owner_id ON public.cars(owner_id);

-- ===========================================
-- 5. COMMENTS
-- ===========================================

COMMENT ON COLUMN public.hotels.owner_id IS 'Owner user ID (replaces partner_id)';
COMMENT ON COLUMN public.cars.owner_id IS 'Owner user ID (replaces partner_id)';

-- Note: partners table is kept for backward compatibility but should be deprecated in future
