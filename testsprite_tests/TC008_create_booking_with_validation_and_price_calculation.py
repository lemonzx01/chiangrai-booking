import requests
from datetime import datetime, timedelta
import uuid

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_create_booking_with_validation_and_price_calculation():
    # Step 1: Register a new user for authentication
    user_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    user_password = "Password123"
    user_name = "Test User"

    register_payload = {
        "email": user_email,
        "password": user_password,
        "name": user_name
    }
    register_resp = requests.post(
        f"{BASE_URL}/api/auth/register",
        json=register_payload,
        timeout=TIMEOUT
    )
    assert register_resp.status_code == 201, f"User registration failed: {register_resp.text}"

    # Step 2: Login to get authentication cookie (JWT token)
    login_payload = {
        "email": user_email,
        "password": user_password
    }
    login_resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=login_payload,
        timeout=TIMEOUT
    )
    assert login_resp.status_code == 200, f"User login failed: {login_resp.text}"
    # Extract user_token cookie for auth
    cookies = login_resp.cookies
    assert "user_token" in cookies, "Authentication token cookie not found in login response"

    # Step 3: Fetch list of hotels with pagination limit=1 to get a hotel and its room types
    hotels_resp = requests.get(
        f"{BASE_URL}/api/hotels?limit=1",
        timeout=TIMEOUT
    )
    assert hotels_resp.status_code == 200, f"Failed to get hotels: {hotels_resp.text}"
    hotels_data = hotels_resp.json()
    assert "data" in hotels_data and len(hotels_data["data"]) > 0, "No hotels found for booking test"

    hotel_id = hotels_data["data"][0].get("id")
    assert hotel_id, "Hotel id not found"

    # Step 4: Get hotel details to fetch a room_type_id and its price (price must be inferred or assumed)
    hotel_detail_resp = requests.get(
        f"{BASE_URL}/api/hotels/{hotel_id}",
        timeout=TIMEOUT
    )
    assert hotel_detail_resp.status_code == 200, f"Failed to get hotel details: {hotel_detail_resp.text}"
    hotel_detail = hotel_detail_resp.json()
    room_types = hotel_detail.get("room_types", [])
    assert len(room_types) > 0, "No room types found for the hotel"
    room_type = room_types[0]
    room_type_id = room_type.get("id")
    assert room_type_id, "Room type id not found"

    # Attempt to find price per night; the PRD does not specify exact field names, try common fields.
    # If price field missing, can't do price calculation validation fully.
    price_per_night = None
    for key in ["price", "price_per_night", "daily_rate", "rate"]:
        if key in room_type and isinstance(room_type[key], (int, float)):
            price_per_night = room_type[key]
            break
    # To enforce price validation, price must be found
    assert price_per_night is not None, "Room type price not found in hotel details"

    # Step 5: Prepare booking payload with valid data and dates (check_in < check_out, future dates)
    today = datetime.utcnow().date()
    check_in_date = today + timedelta(days=5)
    check_out_date = today + timedelta(days=8)
    guests = 2
    guest_name = "John Doe"
    guest_email = "johndoe@example.com"
    guest_phone = "+66812345678"

    booking_payload = {
        "booking_type": "HOTEL",
        "hotel_id": hotel_id,
        "room_type_id": room_type_id,
        "check_in_date": check_in_date.isoformat(),
        "check_out_date": check_out_date.isoformat(),
        "number_of_guests": guests,
        "customer_name": guest_name,
        "customer_email": guest_email,
        "customer_phone": guest_phone
    }

    headers = {
        "Content-Type": "application/json"
    }

    # Step 6: POST /api/bookings with user authentication cookie
    booking_resp = requests.post(
        f"{BASE_URL}/api/bookings",
        json=booking_payload,
        cookies={"user_token": cookies["user_token"]},
        headers=headers,
        timeout=TIMEOUT
    )
    assert booking_resp.status_code == 201, f"Booking creation failed: {booking_resp.status_code} {booking_resp.text}"
    booking_data = booking_resp.json()
    assert "booking" in booking_data, "Booking data missing in response"

    booking = booking_data["booking"]
    assert "id" in booking and booking["id"], "Booking id missing"
    assert "code" in booking and booking["code"], "Booking code missing"
    assert booking["status"] in ["PENDING", "PAID", "CONFIRMED", "CANCELLED"], f"Invalid status: {booking['status']}"
    assert "total_price" in booking and isinstance(booking["total_price"], (int, float)), "Total price missing or invalid"

    # Step 7: Validate total price calculation: (nights * price_per_night)
    nights = (check_out_date - check_in_date).days
    expected_total_price = price_per_night * nights
    # Allow small floating point rounding differences
    assert abs(booking["total_price"] - expected_total_price) < 0.01, (
        f"Incorrect total price: expected approx {expected_total_price}, got {booking['total_price']}"
    )

    # Step 8: Validate booking code uniqueness format (typical alphanumeric, length > 4)
    code = booking["code"]
    assert isinstance(code, str) and len(code) >= 5 and code.isalnum(), f"Booking code format invalid: {code}"

    # Step 9: Test validation errors:
    # Missing required field (e.g. number_of_guests)
    invalid_payload = booking_payload.copy()
    invalid_payload.pop("number_of_guests")
    invalid_resp = requests.post(
        f"{BASE_URL}/api/bookings",
        json=invalid_payload,
        cookies={"user_token": cookies["user_token"]},
        headers=headers,
        timeout=TIMEOUT
    )
    assert invalid_resp.status_code == 400, f"Expected 400 for missing guests, got {invalid_resp.status_code}"

    # Check-in date after check-out date
    invalid_dates_payload = booking_payload.copy()
    invalid_dates_payload["check_in_date"] = (today + timedelta(days=10)).isoformat()
    invalid_dates_payload["check_out_date"] = (today + timedelta(days=8)).isoformat()
    invalid_dates_resp = requests.post(
        f"{BASE_URL}/api/bookings",
        json=invalid_dates_payload,
        cookies={"user_token": cookies["user_token"]},
        headers=headers,
        timeout=TIMEOUT
    )
    assert invalid_dates_resp.status_code == 400, f"Expected 400 for invalid date range, got {invalid_dates_resp.status_code}"

    # Without authentication token
    unauth_resp = requests.post(
        f"{BASE_URL}/api/bookings",
        json=booking_payload,
        headers=headers,
        timeout=TIMEOUT
    )
    assert unauth_resp.status_code == 401, f"Expected 401 Unauthorized when no auth cookie, got {unauth_resp.status_code}"

test_create_booking_with_validation_and_price_calculation()