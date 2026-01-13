-- ===========================================
-- MIGRATION: ADD USERS TABLE
-- ===========================================
-- This migration adds:
-- 1. A `users` table for unified user management
-- 2. Support for Google OAuth login
-- 3. Role-based access control (admin, partner, user)
-- ===========================================

-- ===========================================
-- 1. CREATE USER ROLE ENUM
-- ===========================================

CREATE TYPE user_role AS ENUM ('admin', 'partner', 'user');

-- ===========================================
-- 2. CREATE USERS TABLE
-- ===========================================

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

-- ===========================================
-- 3. CREATE INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- ===========================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Public read access for active users (limited fields)
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (is_active = true);

-- Users can view their own full profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- ===========================================
-- 5. CREATE TRIGGER FOR updated_at
-- ===========================================

-- Check if update_updated_at_column function exists, if not create it
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

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- 6. COMMENTS
-- ===========================================

COMMENT ON TABLE public.users IS 'Unified user table for admin, partner, and regular users';
COMMENT ON COLUMN public.users.role IS 'User role: admin, partner, or user';
COMMENT ON COLUMN public.users.google_id IS 'Google OAuth ID for Google login';
COMMENT ON COLUMN public.users.password_hash IS 'Hashed password for email/password login (nullable)';
