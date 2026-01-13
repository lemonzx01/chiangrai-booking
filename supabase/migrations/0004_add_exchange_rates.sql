-- ===========================================
-- MIGRATION: ADD EXCHANGE RATES TABLE
-- ===========================================
-- This migration adds:
-- 1. An `exchange_rates` table for storing currency exchange rates.
-- 2. Indexes for efficient queries.
-- 3. Seed data with initial exchange rates.
-- ===========================================

-- 1. CREATE exchange_rates TABLE
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency VARCHAR(3) NOT NULL DEFAULT 'THB',
  target_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(10, 6) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(base_currency, target_currency)
);

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Allow public read access (everyone can view exchange rates)
CREATE POLICY "Exchange rates are viewable by everyone" ON public.exchange_rates
  FOR SELECT USING (true);

-- Allow admin full access (for updating rates)
-- Note: This requires admin authentication in the application layer
-- CREATE POLICY "Admin can manage exchange rates" ON public.exchange_rates
--   FOR ALL USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for efficient queries
CREATE INDEX idx_exchange_rates_base_currency ON public.exchange_rates(base_currency);
CREATE INDEX idx_exchange_rates_target_currency ON public.exchange_rates(target_currency);
CREATE INDEX idx_exchange_rates_updated_at ON public.exchange_rates(updated_at);

-- 2. SEED DATA - Initial exchange rates (approximate values)
-- These can be updated later through admin panel or cron job
INSERT INTO public.exchange_rates (base_currency, target_currency, rate) VALUES
  -- From THB
  ('THB', 'USD', 0.027),
  ('THB', 'EUR', 0.025),
  ('THB', 'JPY', 3.8),
  ('THB', 'CNY', 0.19),
  ('THB', 'GBP', 0.021),
  
  -- From USD
  ('USD', 'THB', 37.0),
  ('USD', 'EUR', 0.92),
  ('USD', 'JPY', 140.0),
  ('USD', 'CNY', 7.0),
  ('USD', 'GBP', 0.79),
  
  -- From EUR
  ('EUR', 'THB', 40.0),
  ('EUR', 'USD', 1.09),
  ('EUR', 'JPY', 152.0),
  ('EUR', 'CNY', 7.6),
  ('EUR', 'GBP', 0.86),
  
  -- From JPY
  ('JPY', 'THB', 0.26),
  ('JPY', 'USD', 0.0071),
  ('JPY', 'EUR', 0.0066),
  ('JPY', 'CNY', 0.05),
  ('JPY', 'GBP', 0.0056),
  
  -- From CNY
  ('CNY', 'THB', 5.3),
  ('CNY', 'USD', 0.14),
  ('CNY', 'EUR', 0.13),
  ('CNY', 'JPY', 20.0),
  ('CNY', 'GBP', 0.11),
  
  -- From GBP
  ('GBP', 'THB', 47.6),
  ('GBP', 'USD', 1.27),
  ('GBP', 'EUR', 1.16),
  ('GBP', 'JPY', 178.0),
  ('GBP', 'CNY', 8.9)
ON CONFLICT (base_currency, target_currency) DO NOTHING;
