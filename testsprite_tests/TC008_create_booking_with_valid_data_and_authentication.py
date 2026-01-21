import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_create_booking_with_valid_data_and_authentication():
    # Credentials for a test user that must exist in the system or we create it here.
    test_user_email = "testuserbooking@example.com"
    test_user_password = "Strongpassword123"  # updated to include uppercase letter
    test_user_name = "Test Booking User"

    session = requests.Session()

    user_id = None
    booking_id = None
    try:
        # 1. Register the test user (ignore conflict if already exists)
        register_payload = {
            "email": test_user_email,
            "password": test_user_password,
            "name": test_user_name
        }
        register_resp = session.post(
            f"{BASE_URL}/api/auth/register",
            json=register_payload,
            timeout=TIMEOUT
        )
        if register_resp.status_code not in (201, 409):
            assert False, f"Unexpected registration status: {register_resp.status_code} - {register_resp.text}"

        # 2. Login the test user to obtain JWT session cookie for authentication
        login_payload = {
            "email": test_user_email,
            "password": test_user_password
        }
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.status_code} - {login_resp.text}"
        login_json = login_resp.json()
        assert "user" in login_json, "Login response missing user info"
        user = login_json["user"]
        assert user.get("email") == test_user_email
        assert user.get("role") == "user"
        user_id = user.get("id")
        assert user_id is not None, "User ID missing after login"

        # 3. Get list of hotels (limit 1) to get a valid hotel_id and room_type_id for booking
        hotels_resp = session.get(
            f"{BASE_URL}/api/hotels?limit=1",
            timeout=TIMEOUT
        )
        assert hotels_resp.status_code == 200, f"Failed to list hotels: {hotels_resp.status_code} - {hotels_resp.text}"
        hotels_data = hotels_resp.json()
        assert "data" in hotels_data and isinstance(hotels_data["data"], list) and len(hotels_data["data"]) > 0, "No hotels found"
        hotel = hotels_data["data"][0]
        hotel_id = hotel.get("id") or hotel.get("_id") # depending on naming in response
        assert hotel_id, "Hotel id missing"

        # 4. Get hotel details to find a valid room_type_id
        hotel_details_resp = session.get(
            f"{BASE_URL}/api/hotels/{hotel_id}",
            timeout=TIMEOUT
        )
        assert hotel_details_resp.status_code == 200, f"Failed to get hotel details: {hotel_details_resp.status_code} - {hotel_details_resp.text}"
        hotel_details_json = hotel_details_resp.json()
        room_types = hotel_details_json.get("room_types")
        assert room_types and isinstance(room_types, list) and len(room_types) > 0, "No room types found for hotel"
        room_type = room_types[0]
        room_type_id = room_type.get("id") or room_type.get("_id")
        assert room_type_id, "Room type id missing"

        # 5. Prepare booking data: check-in tomorrow and check-out day after
        check_in_date = (datetime.utcnow() + timedelta(days=1)).date().isoformat()
        check_out_date = (datetime.utcnow() + timedelta(days=2)).date().isoformat()

        booking_payload = {
            "booking_type": "HOTEL",
            "hotel_id": hotel_id,
            "room_type_id": room_type_id,
            "check_in_date": check_in_date,
            "check_out_date": check_out_date,
            "number_of_guests": 1,
            "customer_name": test_user_name,
            "customer_email": test_user_email,
            "customer_phone": "+66912345678"
        }

        # 6. Post booking creation with authentication cookie
        booking_resp = session.post(
            f"{BASE_URL}/api/bookings",
            json=booking_payload,
            timeout=TIMEOUT
        )
        assert booking_resp.status_code == 201, f"Booking creation failed: {booking_resp.status_code} - {booking_resp.text}"
        booking_json = booking_resp.json()
        assert "booking" in booking_json, "Response missing booking object"
        booking = booking_json["booking"]
        booking_id = booking.get("id")
        booking_code = booking.get("code")
        booking_status = booking.get("status")
        total_price = booking.get("total_price")

        # Validate booking fields
        assert isinstance(booking_id, str) and booking_id != "", "Booking ID invalid"
        assert isinstance(booking_code, str) and booking_code != "", "Booking code invalid"
        assert booking_status in ("PENDING", "PAID", "CONFIRMED", "CANCELLED"), "Booking status invalid"
        assert isinstance(total_price, (int, float)) and total_price > 0, "Total price invalid"

    finally:
        # Clean up: If booking was created, attempt to delete it to avoid test data buildup
        if booking_id:
            try:
                # Assuming there's a DELETE /api/bookings/{id} endpoint with authentication (not specified, so try best effort)
                delete_resp = session.delete(
                    f"{BASE_URL}/api/bookings/{booking_id}",
                    timeout=TIMEOUT
                )
                # No assertion here: endpoint may not exist or require admin, so ignore failures
            except Exception:
                pass

        # Optionally delete the test user if you want to clean that too (not specified in PRD)
        # Could be implemented if /api/auth/delete or admin endpoints existed

test_create_booking_with_valid_data_and_authentication()