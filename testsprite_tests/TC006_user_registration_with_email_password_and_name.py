import requests
import uuid

BASE_URL = "http://localhost:3001"
REGISTER_ENDPOINT = f"{BASE_URL}/api/auth/register"


def test_user_registration_with_email_password_and_name():
    # Prepare headers and timeout
    headers = {"Content-Type": "application/json"}
    timeout = 30

    # Generate unique email for registration
    unique_email = f"testuser_{uuid.uuid4().hex}@example.com"
    valid_password = "StrongPass1"
    short_password = "short"
    user_name = "Test User"

    # --- 1. Successful Registration with valid unique email and valid password length ---
    payload_valid = {
        "email": unique_email,
        "password": valid_password,
        "name": user_name
    }

    created = False
    try:
        response = requests.post(REGISTER_ENDPOINT, json=payload_valid, headers=headers, timeout=timeout)
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        created = True

        # --- 2. Registration with duplicate email - should fail with 409 ---
        response_dup = requests.post(REGISTER_ENDPOINT, json=payload_valid, headers=headers, timeout=timeout)
        assert response_dup.status_code == 409, f"Expected 409 Conflict for duplicate email, got {response_dup.status_code}"

        # --- 3. Registration with password less than minimum length (8) - should fail with 400 ---
        payload_short_password = {
            "email": f"new_{uuid.uuid4().hex}@example.com",
            "password": short_password,
            "name": user_name
        }
        response_short_pw = requests.post(REGISTER_ENDPOINT, json=payload_short_password, headers=headers, timeout=timeout)
        assert response_short_pw.status_code == 400, f"Expected 400 Bad Request for short password, got {response_short_pw.status_code}"

        # --- 4. Registration with missing fields - should fail 400 ---
        payload_missing_fields = {
            "email": f"missing_{uuid.uuid4().hex}@example.com"
            # missing password and name
        }
        response_missing = requests.post(REGISTER_ENDPOINT, json=payload_missing_fields, headers=headers, timeout=timeout)
        assert response_missing.status_code == 400, f"Expected 400 Bad Request for missing fields, got {response_missing.status_code}"

        # --- 5. Registration with invalid email format - should fail 400 ---
        payload_invalid_email = {
            "email": "invalid-email-format",
            "password": valid_password,
            "name": user_name
        }
        response_invalid_email = requests.post(REGISTER_ENDPOINT, json=payload_invalid_email, headers=headers, timeout=timeout)
        assert response_invalid_email.status_code == 400, f"Expected 400 Bad Request for invalid email, got {response_invalid_email.status_code}"

    finally:
        if created:
            # Cleanup: Not implemented as per PRD
            pass


test_user_registration_with_email_password_and_name()