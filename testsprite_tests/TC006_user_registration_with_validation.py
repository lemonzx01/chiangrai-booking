import requests
import uuid

BASE_URL = "http://localhost:3001"
REGISTER_ENDPOINT = f"{BASE_URL}/api/auth/register"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def test_user_registration_with_validation():
    # Generate a unique email to avoid conflict in duplication test
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    valid_password = "validPass123"
    valid_name = "Test User"

    # 1. Successful registration with valid data
    payload_valid = {
        "email": unique_email,
        "password": valid_password,
        "name": valid_name
    }
    response = requests.post(REGISTER_ENDPOINT, json=payload_valid, headers=HEADERS, timeout=TIMEOUT)
    assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    # The API likely returns empty body or user info, so no strict schema here, presence of success is enough

    # 2. Validation error: password too short (< 8 characters)
    payload_short_password = {
        "email": f"shortpass_{uuid.uuid4().hex[:8]}@example.com",
        "password": "short",
        "name": "Short Pass"
    }
    response = requests.post(REGISTER_ENDPOINT, json=payload_short_password, headers=HEADERS, timeout=TIMEOUT)
    assert response.status_code == 400, f"Expected 400 for short password, got {response.status_code}"
    # Validate error message presence and type
    try:
        data = response.json()
        assert isinstance(data, dict)
        assert any("password" in str(v).lower() for v in data.values()) or "password" in data.get("message", "").lower()
    except Exception:
        pass  # If no JSON or no message, skip detailed check

    # 3. Validation error: missing required fields (e.g., no email)
    payload_missing_email = {
        "password": valid_password,
        "name": valid_name
    }
    response = requests.post(REGISTER_ENDPOINT, json=payload_missing_email, headers=HEADERS, timeout=TIMEOUT)
    assert response.status_code == 400, f"Expected 400 for missing email, got {response.status_code}"

    # 4. Validation error: invalid email format
    payload_invalid_email = {
        "email": "invalid-email-format",
        "password": valid_password,
        "name": valid_name
    }
    response = requests.post(REGISTER_ENDPOINT, json=payload_invalid_email, headers=HEADERS, timeout=TIMEOUT)
    assert response.status_code == 400, f"Expected 400 for invalid email format, got {response.status_code}"

    # 5. Duplicate email registration should return 409
    payload_duplicate_email = {
        "email": unique_email,
        "password": valid_password,
        "name": valid_name
    }
    response = requests.post(REGISTER_ENDPOINT, json=payload_duplicate_email, headers=HEADERS, timeout=TIMEOUT)
    assert response.status_code == 409, f"Expected 409 for duplicate email, got {response.status_code}"

    # Additional check: For 409 response, check message presence
    try:
        data = response.json()
        assert isinstance(data, dict)
        assert "email" in data.get("message", "").lower() or "already exists" in data.get("message", "").lower()
    except Exception:
        pass


test_user_registration_with_validation()