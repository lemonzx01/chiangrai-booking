-- ============================================================
-- Migration 0013: Atomic Booking RPCs
-- ============================================================
--
-- Purpose:
--   Eliminate the read-then-write race condition that allows
--   double-booking of rooms or cars when two concurrent
--   requests pass the availability check before either insert.
--
-- Strategy:
--   - Lock the relevant resource row (room_types or cars)
--     with SELECT ... FOR UPDATE
--   - Re-count overlapping non-cancelled bookings under that lock
--   - Insert if available, RAISE EXCEPTION 'ROOM_FULL' / 'CAR_FULL' otherwise
--
-- Both functions use SECURITY DEFINER so the API service-role
-- caller doesn't need direct INSERT grants — but they only
-- ever insert into bookings, so the blast radius is small.
-- ============================================================

-- ----------------------------------------------------------
-- create_booking_atomic — for hotel/room bookings
-- ----------------------------------------------------------
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
  IF p_room_type_id IS NULL THEN
    -- No room type means no concurrency to fight over.
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

  -- Lock the room_type row so concurrent transactions queue up.
  SELECT total_rooms INTO v_total_rooms
  FROM public.room_types
  WHERE id = p_room_type_id
  FOR UPDATE;

  IF v_total_rooms IS NULL THEN
    RAISE EXCEPTION 'ROOM_TYPE_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- Re-check availability under the lock.
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

COMMENT ON FUNCTION public.create_booking_atomic IS
'Atomically check room availability and insert a booking under SELECT FOR UPDATE.
Raises ROOM_FULL (P0001) if overlapping bookings >= total_rooms.';

-- ----------------------------------------------------------
-- create_car_booking_atomic — for car bookings
-- ----------------------------------------------------------
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
  -- Lock the car row.
  SELECT TRUE INTO v_car_exists
  FROM public.cars
  WHERE id = p_car_id
  FOR UPDATE;

  IF NOT v_car_exists THEN
    RAISE EXCEPTION 'CAR_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- Re-check under the lock.
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

COMMENT ON FUNCTION public.create_car_booking_atomic IS
'Atomically check car availability and insert a booking under SELECT FOR UPDATE.
Raises CAR_FULL (P0001) if any overlapping non-cancelled booking exists.';

-- Grant execute to the API role(s). The service role has it implicitly.
GRANT EXECUTE ON FUNCTION public.create_booking_atomic TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_car_booking_atomic TO authenticated, anon, service_role;
