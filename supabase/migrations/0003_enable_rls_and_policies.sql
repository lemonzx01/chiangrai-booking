-- Enable RLS for all tables
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access on tables that should be public
CREATE POLICY "Public read access for hotels" ON public.hotels FOR SELECT USING (true);
CREATE POLICY "Public read access for room_types" ON public.room_types FOR SELECT USING (true);
CREATE POLICY "Public read access for cars" ON public.cars FOR SELECT USING (true);
CREATE POLICY "Public read access for partners" ON public.partners FOR SELECT USING (true);

-- NOTE: Bookings, payments, users, and admins tables now have RLS enabled but no policies for public access.
-- This is a secure default, meaning they can only be accessed from the backend using the service_role key.
-- We will add more specific policies later (e.g., authenticated users can see their own bookings).

