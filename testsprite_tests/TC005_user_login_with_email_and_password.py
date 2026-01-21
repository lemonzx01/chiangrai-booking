import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:3001"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT = 30


def test_user_login_with_email_and_password():
    url = BASE_URL + LOGIN_ENDPOINT
    headers = {"Content-Type": "application/json"}

    # Test valid user login credentials
    valid_user_payload = {
        "email": "user@example.com",
        "password": "validUserPass123"
    }

    try:
        resp = requests.post(url, json=valid_user_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200 for valid user login but got {resp.status_code}"
        resp_json = resp.json()
        assert "user" in resp_json, "Response JSON missing 'user' key"
        user = resp_json["user"]
        assert "id" in user and isinstance(user["id"], str) and user["id"], "User id missing or invalid"
        assert user.get("email") == valid_user_payload["email"], "Returned user email does not match"
        assert user.get("role") in ("user", "admin"), "User role is not valid"

        # Validate JWT token presence via HttpOnly cookie in Set-Cookie header
        cookies = resp.headers.get("Set-Cookie", "")
        assert any(token_name in cookies for token_name in ["user_token", "admin_token"]), \
            "JWT token cookie (user_token or admin_token) missing in response cookies"

    except RequestException as e:
        assert False, f"Request failed for valid user login: {e}"

    # Test valid admin login credentials
    valid_admin_payload = {
        "email": "admin@example.com",
        "password": "validAdminPass123"
    }

    try:
        resp = requests.post(url, json=valid_admin_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200 for valid admin login but got {resp.status_code}"
        resp_json = resp.json()
        assert "user" in resp_json, "Response JSON missing 'user' key for admin"
        user = resp_json["user"]
        assert "id" in user and isinstance(user["id"], str) and user["id"], "Admin user id missing or invalid"
        assert user.get("email") == valid_admin_payload["email"], "Returned admin email does not match"
        assert user.get("role") in ("user", "admin"), "Admin user role invalid"
        assert user["role"] == "admin", "User role is not admin for admin login"

        cookies = resp.headers.get("Set-Cookie", "")
        assert "admin_token" in cookies, "JWT token cookie admin_token missing in response cookies for admin"

    except RequestException as e:
        assert False, f"Request failed for valid admin login: {e}"

    # Test invalid credentials (wrong password)
    invalid_cred_payload = {
        "email": "user@example.com",
        "password": "wrongpassword"
    }

    try:
        resp = requests.post(url, json=invalid_cred_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 401, f"Expected 401 for invalid credentials but got {resp.status_code}"

    except RequestException as e:
        assert False, f"Request failed for invalid credentials test: {e}"

    # Test missing email field
    missing_email_payload = {
        "password": "somepassword"
    }

    try:
        resp = requests.post(url, json=missing_email_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for missing email field but got {resp.status_code}"

    except RequestException as e:
        assert False, f"Request failed for missing email test: {e}"

    # Test missing password field
    missing_password_payload = {
        "email": "user@example.com"
    }

    try:
        resp = requests.post(url, json=missing_password_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for missing password field but got {resp.status_code}"

    except RequestException as e:
        assert False, f"Request failed for missing password test: {e}"


test_user_login_with_email_and_password()