import requests
import datetime

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_create_stripe_checkout_session_for_booking():
    # Helper function to login as user and get auth headers
    def user_login(email, password):
        login_url = f"{BASE_URL}/api/auth/login"
        payload = {"email": email, "password": password}
        resp = requests.post(login_url, json=payload, timeout=TIMEOUT)
        resp.raise_for_status()
        # Extract cookies (JWT token is stored in HttpOnly cookie)
        cookies = resp.cookies
        return cookies

    # Helper function to login as admin
    def admin_login(email, password):
        login_url = f"{BASE_URL}/api/admin/login"
        payload = {"email": email, "password": password}
        resp = requests.post(login_url, json=payload, timeout=TIMEOUT)
        resp.raise_for_status()
        cookies = resp.cookies
        return cookies

    # Helper function to create hotel to get hotel_id
    def create_hotel(admin_cookies):
        url = f"{BASE_URL}/api/hotels"
        hotel_data = {
            "name": "Test Hotel for Checkout",
            "description": "Test description",
            "location": "Chiang Rai",
            "address": "123 Test St",
            "phone": "0123456789",
            "email": "hotel@example.com",
            "is_active": True
        }
        resp = requests.post(url, json=hotel_data, cookies=admin_cookies, timeout=TIMEOUT)
        resp.raise_for_status()
        return get_latest_hotel_id(admin_cookies)

    def get_latest_hotel_id(admin_cookies):
        url = f"{BASE_URL}/api/hotels?limit=1&offset=0"
        resp = requests.get(url, cookies=admin_cookies, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        hotels = data.get("data", [])
        if not hotels:
            raise Exception("No hotels found after creation")
        return hotels[0].get("id")

    # Helper function to get room_type_id for a hotel
    def get_room_type_id(hotel_id):
        url = f"{BASE_URL}/api/hotels/{hotel_id}"
        resp = requests.get(url, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        room_types = data.get("room_types", [])
        if not room_types:
            raise Exception("No room types found for hotel")
        return room_types[0].get("id")

    # Helper function to create booking
    def create_booking(user_cookies, hotel_id, room_type_id):
        url = f"{BASE_URL}/api/bookings"
        check_in = (datetime.date.today() + datetime.timedelta(days=10)).isoformat()
        check_out = (datetime.date.today() + datetime.timedelta(days=12)).isoformat()
        booking_payload = {
            "booking_type": "HOTEL",
            "hotel_id": hotel_id,
            "room_type_id": room_type_id,
            "check_in_date": check_in,
            "check_out_date": check_out,
            "number_of_guests": 1,
            "customer_name": "Test Guest",
            "customer_email": "guest@example.com",
            "customer_phone": "0812345678"
        }
        resp = requests.post(url, json=booking_payload, cookies=user_cookies, timeout=TIMEOUT)
        resp.raise_for_status()
        booking = resp.json().get("booking")
        if not booking or not booking.get("id"):
            raise Exception("Booking creation response missing booking id")
        return booking.get("id")

    # Admin login to create hotel (assuming admin user exists)
    admin_email = "admin@example.com"
    admin_password = "AdminPass123"
    try:
        admin_cookies = admin_login(admin_email, admin_password)
    except Exception:
        assert False, "Admin login failed; cannot create hotel or booking for test."

    booking_id = None
    try:
        hotel_id = create_hotel(admin_cookies)
        room_type_id = get_room_type_id(hotel_id)

        # Login as normal user - assuming test user exists or register one
        test_user_email = "userforcheckout@example.com"
        test_user_password = "UserPass123"
        user_cookies = None
        try:
            user_cookies = user_login(test_user_email, test_user_password)
        except requests.HTTPError as e_user_login:
            reg_url = f"{BASE_URL}/api/auth/register"
            reg_payload = {
                "email": test_user_email,
                "password": test_user_password,
                "name": "User For Checkout"
            }
            reg_resp = requests.post(reg_url, json=reg_payload, timeout=TIMEOUT)
            reg_resp.raise_for_status()
            user_cookies = user_login(test_user_email, test_user_password)

        booking_id = create_booking(user_cookies, hotel_id, room_type_id)

        # Test create Stripe Checkout session with valid booking_id
        checkout_url = f"{BASE_URL}/api/checkout"
        success_url = f"{BASE_URL}/payment-success"
        cancel_url = f"{BASE_URL}/payment-cancel"
        payload = {
            "booking_id": booking_id,
            "success_url": success_url,
            "cancel_url": cancel_url
        }
        resp = requests.post(checkout_url, json=payload, cookies=user_cookies, timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert "session_id" in data and isinstance(data["session_id"], str) and data["session_id"]
        assert "url" in data and isinstance(data["url"], str) and data["url"].startswith("http")

        # Test error handling: booking_id missing
        resp_missing = requests.post(checkout_url, json={}, cookies=user_cookies, timeout=TIMEOUT)
        assert resp_missing.status_code == 400

        # Test error handling: invalid booking_id
        invalid_payload = {
            "booking_id": "00000000-0000-0000-0000-000000000000",
            "success_url": success_url,
            "cancel_url": cancel_url
        }
        resp_invalid = requests.post(checkout_url, json=invalid_payload, cookies=user_cookies, timeout=TIMEOUT)
        assert resp_invalid.status_code == 404

    finally:
        pass

test_create_stripe_checkout_session_for_booking()
