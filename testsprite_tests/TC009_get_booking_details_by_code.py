import requests
import uuid

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_get_booking_details_by_code():
    # First, create a booking to get a valid code
    # For that, we need valid hotel_id and room_type_id from existing data
    
    # 1. Get list of hotels to find a valid hotel_id
    hotels_resp = requests.get(f"{BASE_URL}/api/hotels", timeout=TIMEOUT)
    assert hotels_resp.status_code == 200, "Failed to fetch hotels"
    hotels_data = hotels_resp.json()
    assert "data" in hotels_data and len(hotels_data["data"]) > 0, "No hotels found for booking creation"
    hotel = hotels_data["data"][0]
    hotel_id = hotel.get("id")
    assert hotel_id, "Hotel ID missing"

    # 2. Get hotel details to find a valid room_type_id
    hotel_detail_resp = requests.get(f"{BASE_URL}/api/hotels/{hotel_id}", timeout=TIMEOUT)
    assert hotel_detail_resp.status_code == 200, "Failed to fetch hotel details"
    hotel_detail = hotel_detail_resp.json()
    room_types = hotel_detail.get("room_types")
    assert room_types and len(room_types) > 0, "No room types found in hotel details"
    room_type_id = room_types[0].get("id")
    assert room_type_id, "Room type ID missing"

    # 3. For booking creation, user authentication is required.
    # Provide test user credentials here. For test purposes we assume a test user is registered.
    test_user_email = "testuser@example.com"
    test_user_password = "password123"  # Ensure this user exists or create it beforehand.

    login_resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": test_user_email, "password": test_user_password},
        timeout=TIMEOUT
    )
    assert login_resp.status_code == 200, f"User login failed with status {login_resp.status_code}"
    # Extract user_token cookie
    cookies = login_resp.cookies
    assert "user_token" in cookies or any(key.startswith("user_token") for key in cookies.keys()), "Authentication cookie missing"

    # Prepare booking payload with valid data
    from datetime import date, timedelta
    today = date.today()
    check_in = today + timedelta(days=10)
    check_out = today + timedelta(days=15)
    booking_payload = {
        "hotel_id": hotel_id,
        "room_type_id": room_type_id,
        "check_in": check_in.isoformat(),
        "check_out": check_out.isoformat(),
        "guests": 1,
        "guest_name": "Test Guest",
        "guest_email": "guest@example.com",
        "guest_phone": "0123456789"
    }

    booking_resp = requests.post(
        f"{BASE_URL}/api/bookings",
        json=booking_payload,
        cookies=cookies,
        timeout=TIMEOUT
    )
    assert booking_resp.status_code == 201, f"Booking creation failed with status {booking_resp.status_code}"
    booking_data = booking_resp.json()
    booking = booking_data.get("booking")
    assert booking and "code" in booking, "Booking code not returned after creation"
    booking_code = booking["code"]

    try:
        # 4. Test GET /api/bookings/{code} with valid code
        get_booking_resp = requests.get(f"{BASE_URL}/api/bookings/{booking_code}", timeout=TIMEOUT)
        assert get_booking_resp.status_code == 200, "Failed to get booking by valid code"
        booking_detail = get_booking_resp.json()
        assert "booking" in booking_detail, "Booking details missing in response"
        # Validate booking code in response
        assert booking_detail["booking"].get("code") == booking_code

        # 5. Test GET /api/bookings/{code} with invalid code (random UUID string)
        invalid_code = str(uuid.uuid4())
        invalid_resp = requests.get(f"{BASE_URL}/api/bookings/{invalid_code}", timeout=TIMEOUT)
        assert invalid_resp.status_code == 404, f"Expected 404 for invalid booking code but got {invalid_resp.status_code}"
    finally:
        # Clean up - delete the created booking if deletion endpoint exists
        # Since no DELETE booking endpoint info in PRD, skipping actual deletion.
        pass

test_get_booking_details_by_code()
