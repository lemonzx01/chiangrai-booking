-- ============================================================
-- Migration 0016: Availability Blocks (Partner blockout calendar)
-- ============================================================
--
-- Purpose:
--   Let partners block dates on their own hotels/rooms/cars
--   (maintenance, private bookings, seasonal closure) so the
--   public booking flow won't accept reservations that overlap.
--
-- Scope options for a block:
--   1. hotel_id + room_type_id NULL  -> blocks ALL rooms in hotel
--   2. hotel_id + room_type_id set   -> blocks one room type only
--   3. car_id                        -> blocks a single car
--
-- Dates follow the same half-open convention as bookings:
--   [start_date, end_date) — end_date is the first day the resource
--   is available again, matching how check_in/check_out work.
--
-- ============================================================

CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
  car_id       UUID REFERENCES public.cars(id) ON DELETE CASCADE,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  reason       TEXT NOT NULL,
  notes        TEXT,
  created_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Exactly one of (hotel_id, car_id) must be set.
  CONSTRAINT one_resource_target CHECK (
    (hotel_id IS NOT NULL AND car_id IS NULL) OR
    (hotel_id IS NULL AND car_id IS NOT NULL)
  ),
  -- room_type_id only allowed when hotel_id is set.
  CONSTRAINT room_type_requires_hotel CHECK (
    room_type_id IS NULL OR hotel_id IS NOT NULL
  ),
  -- end_date must be strictly after start_date.
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- ----------------------------------------------------------
-- Indexes for overlap queries
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_availability_blocks_hotel
  ON public.availability_blocks(hotel_id, start_date, end_date)
  WHERE hotel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_availability_blocks_room_type
  ON public.availability_blocks(room_type_id, start_date, end_date)
  WHERE room_type_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_availability_blocks_car
  ON public.availability_blocks(car_id, start_date, end_date)
  WHERE car_id IS NOT NULL;

-- ----------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; API uses service role so it always works.
-- Anon clients have no read access — they should use the public
-- booking availability RPC which already respects blocks.

-- ----------------------------------------------------------
-- Helper: do any blocks overlap a date range?
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_blocking_overlap(
  p_hotel_id     UUID,
  p_room_type_id UUID,
  p_car_id       UUID,
  p_start_date   DATE,
  p_end_date     DATE
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.availability_blocks b
    WHERE b.start_date < p_end_date
      AND b.end_date   > p_start_date
      AND (
        -- Room-scoped booking: a block at hotel level or room-type level
        -- both apply to this room.
        (p_room_type_id IS NOT NULL AND (
          b.room_type_id = p_room_type_id
          OR (b.hotel_id = p_hotel_id AND b.room_type_id IS NULL)
        ))
        -- Hotel-wide booking (no room_type): only whole-hotel blocks apply.
        OR (p_room_type_id IS NULL AND p_hotel_id IS NOT NULL AND b.hotel_id = p_hotel_id AND b.room_type_id IS NULL)
        -- Car booking.
        OR (p_car_id IS NOT NULL AND b.car_id = p_car_id)
      )
  );
$$;

COMMENT ON FUNCTION public.has_blocking_overlap IS
'Returns TRUE if any availability_blocks row overlaps the given date range for the given resource.';

-- ============================================================
-- Patch: atomic booking functions now reject blocked dates
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_booking_code      VARCHAR,
  p_booking_type      booking_type,
  p_hotel_id          UUID,
  p_room_type_id      UUID,
  p_check_in_date     DATE,
  p_check_out_date    DATE,
  p_number_of_guests  INTEGER,
  p_customer_name     TEXT,
  p_customer_email    TEXT,
  p_customer_phone    TEXT,
  p_special_requests  TEXT,
  p_total_price       DECIMAL,
  p_currency          VARCHAR DEFAULT 'THB'
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_rooms  INTEGER;
  v_booked_count INTEGER;
  v_booking      public.bookings;
BEGIN
  -- Reject if partner has blocked these dates.
  IF public.has_blocking_overlap(p_hotel_id, p_room_type_id, NULL, p_check_in_date, p_check_out_date) THEN
    RAISE EXCEPTION 'DATES_BLOCKED' USING ERRCODE = 'P0001';
  END IF;

  IF p_room_type_id IS NULL THEN
    INSERT INTO public.bookings (
      booking_code, booking_type, hotel_id,
      check_in_date, check_out_date, number_of_guests,
      customer_name, customer_email, customer_phone,
      special_requests, total_price, currency, status
    ) VALUES (
      p_booking_code, p_booking_type, p_hotel_id,
      p_check_in_date, p_check_out_date, p_number_of_guests,
      p_customer_name, p_customer_email, p_customer_phone,
      p_special_requests, p_total_price, p_currency, 'PENDING'
    )
    RETURNING * INTO v_booking;
    RETURN v_booking;
  END IF;

  SELECT total_rooms INTO v_total_rooms
  FROM public.room_types
  WHERE id = p_room_type_id
  FOR UPDATE;

  IF v_total_rooms IS NULL THEN
    RAISE EXCEPTION 'ROOM_TYPE_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  SELECT COUNT(*) INTO v_booked_count
  FROM public.bookings
  WHERE room_type_id = p_room_type_id
    AND check_in_date < p_check_out_date
    AND check_out_date > p_check_in_date
    AND status NOT IN ('CANCELLED', 'COMPLETED');

  IF v_booked_count >= v_total_rooms THEN
    RAISE EXCEPTION 'ROOM_FULL' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.bookings (
    booking_code, booking_type, hotel_id, room_type_id,
    check_in_date, check_out_date, number_of_guests,
    customer_name, customer_email, customer_phone,
    special_requests, total_price, currency, status
  ) VALUES (
    p_booking_code, p_booking_type, p_hotel_id, p_room_type_id,
    p_check_in_date, p_check_out_date, p_number_of_guests,
    p_customer_name, p_customer_email, p_customer_phone,
    p_special_requests, p_total_price, p_currency, 'PENDING'
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_car_booking_atomic(
  p_booking_code      VARCHAR,
  p_booking_type      booking_type,
  p_car_id            UUID,
  p_check_in_date     DATE,
  p_check_out_date    DATE,
  p_number_of_guests  INTEGER,
  p_customer_name     TEXT,
  p_customer_email    TEXT,
  p_customer_phone    TEXT,
  p_special_requests  TEXT,
  p_total_price       DECIMAL,
  p_currency          VARCHAR DEFAULT 'THB'
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_car_exists   BOOLEAN;
  v_booked_count INTEGER;
  v_booking      public.bookings;
BEGIN
  IF public.has_blocking_overlap(NULL, NULL, p_car_id, p_check_in_date, p_check_out_date) THEN
    RAISE EXCEPTION 'DATES_BLOCKED' USING ERRCODE = 'P0001';
  END IF;

  SELECT TRUE INTO v_car_exists
  FROM public.cars
  WHERE id = p_car_id
  FOR UPDATE;

  IF NOT v_car_exists THEN
    RAISE EXCEPTION 'CAR_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  SELECT COUNT(*) INTO v_booked_count
  FROM public.bookings
  WHERE car_id = p_car_id
    AND check_in_date < p_check_out_date
    AND check_out_date > p_check_in_date
    AND status NOT IN ('CANCELLED', 'COMPLETED');

  IF v_booked_count > 0 THEN
    RAISE EXCEPTION 'CAR_FULL' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.bookings (
    booking_code, booking_type, car_id,
    check_in_date, check_out_date, number_of_guests,
    customer_name, customer_email, customer_phone,
    special_requests, total_price, currency, status
  ) VALUES (
    p_booking_code, p_booking_type, p_car_id,
    p_check_in_date, p_check_out_date, p_number_of_guests,
    p_customer_name, p_customer_email, p_customer_phone,
    p_special_requests, p_total_price, p_currency, 'PENDING'
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_blocking_overlap TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_booking_atomic TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_car_booking_atomic TO authenticated, anon, service_role;
