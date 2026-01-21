import requests
from datetime import date, timedelta
import uuid

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Test user credentials for login (should exist in the system)
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "TestPass123"

def test_create_stripe_checkout_session():
    session = requests.Session()

    # Step 1: Login to get user_token cookie for authentication
    login_payload = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }
    login_resp = session.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}: {login_resp.text}"
    assert "user_token" in login_resp.cookies, "User token cookie missing after login"

    # Step 2: Create a booking to use its id for checkout session (required for auth)
    # We need a valid hotel_id and room_type_id to create a booking
    # Fetch first hotel to get ids
    hotels_resp = session.get(f"{BASE_URL}/api/hotels?limit=1&offset=0", timeout=TIMEOUT)
    assert hotels_resp.status_code == 200, f"Failed to get hotels: {hotels_resp.text}"
    hotels_data = hotels_resp.json()
    assert "data" in hotels_data and hotels_data["data"], "No hotels found to create a booking"
    hotel = hotels_data["data"][0]
    hotel_id = hotel["id"]

    # Fetch hotel details to get room_types
    hotel_details_resp = session.get(f"{BASE_URL}/api/hotels/{hotel_id}", timeout=TIMEOUT)
    assert hotel_details_resp.status_code == 200, f"Failed to get hotel details: {hotel_details_resp.text}"
    hotel_details = hotel_details_resp.json()
    room_types = hotel_details.get("room_types", [])
    assert len(room_types) > 0, "Hotel has no room types for booking"
    room_type_id = room_types[0]["id"]

    check_in = (date.today() + timedelta(days=1)).isoformat()
    check_out = (date.today() + timedelta(days=3)).isoformat()

    booking_payload = {
        "hotel_id": hotel_id,
        "room_type_id": room_type_id,
        "check_in": check_in,
        "check_out": check_out,
        "guests": 1,
        "guest_name": "Test User",
        "guest_email": TEST_USER_EMAIL,
        "guest_phone": "0812345678"
    }

    booking_resp = session.post(f"{BASE_URL}/api/bookings", json=booking_payload, timeout=TIMEOUT)
    assert booking_resp.status_code == 201, f"Booking creation failed: {booking_resp.text}"
    booking_data = booking_resp.json()
    booking_id = booking_data["booking"]["id"]

    try:
        # Step 3: Successful creation of Stripe Checkout session
        checkout_payload = {
            "booking_id": booking_id,
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel"
        }
        checkout_resp = session.post(f"{BASE_URL}/api/checkout", json=checkout_payload, timeout=TIMEOUT)
        assert checkout_resp.status_code == 200, f"Checkout session creation failed: {checkout_resp.text}"
        checkout_json = checkout_resp.json()
        assert "session_id" in checkout_json, "session_id missing in checkout response"
        assert "url" in checkout_json, "url missing in checkout response"
        assert checkout_json["url"].startswith("http"), "Invalid url format in checkout response"

        # Step 4: Validation error - missing booking_id
        invalid_payload = {
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel"
        }
        invalid_resp = session.post(f"{BASE_URL}/api/checkout", json=invalid_payload, timeout=TIMEOUT)
        assert invalid_resp.status_code == 400, f"Expected 400 for missing booking_id, got {invalid_resp.status_code}"

        # Step 5: Booking not found error
        non_existent_booking_id = str(uuid.uuid4())
        not_found_payload = {
            "booking_id": non_existent_booking_id,
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel"
        }
        not_found_resp = session.post(f"{BASE_URL}/api/checkout", json=not_found_payload, timeout=TIMEOUT)
        assert not_found_resp.status_code == 404, f"Expected 404 for non-existent booking_id, got {not_found_resp.status_code}"

    finally:
        # Cleanup: Delete the booking to keep test environment clean
        # Assuming there's DELETE /api/bookings/{id} endpoint for cleanup

        # Check if the endpoint exists, else ignore
        try:
            del_resp = session.delete(f"{BASE_URL}/api/bookings/{booking_id}", timeout=TIMEOUT)
            # 200 or 204 expected if delete supported
            if del_resp.status_code not in (200, 204, 404):
                # Log unexpected status but continue
                print(f"Unexpected status deleting booking: {del_resp.status_code}")
        except Exception:
            # Ignore exceptions during cleanup
            pass

test_create_stripe_checkout_session()