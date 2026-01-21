import requests
import json

BASE_URL = "http://localhost:3001"
WEBHOOK_ENDPOINT = "/api/webhook/stripe"
TIMEOUT = 30

def test_stripe_webhook_event_handling():
    headers_valid = {
        # Normally Stripe-Signature header is included; here using a placeholder (assuming server verifies it)
        "Stripe-Signature": "t=123456789,v1=validsignaturehash",
        "Content-Type": "application/json"
    }
    headers_invalid = {
        "Stripe-Signature": "invalidsignature",
        "Content-Type": "application/json"
    }

    # Example valid webhook payload (a minimal representative Stripe event for payment_intent.succeeded)
    valid_payload = {
        "id": "evt_test_webhook",
        "object": "event",
        "api_version": "2022-11-15",
        "created": 1679291234,
        "data": {
            "object": {
                "id": "pi_test_123",
                "object": "payment_intent",
                "status": "succeeded",
                "amount": 2000,
                "currency": "usd",
                "metadata": {
                    "booking_code": "BK123456"
                }
            }
        },
        "livemode": False,
        "type": "payment_intent.succeeded"
    }

    # Example invalid webhook payload (for signature failure or malformed payload)
    invalid_payload = {
        "invalid": "data"
    }

    # Test valid webhook event handling
    try:
        response = requests.post(
            BASE_URL + WEBHOOK_ENDPOINT,
            headers=headers_valid,
            data=json.dumps(valid_payload),
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Expected 200 OK for valid webhook, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed for valid webhook: {e}"

    # Test invalid webhook event handling (invalid signature)
    try:
        response = requests.post(
            BASE_URL + WEBHOOK_ENDPOINT,
            headers=headers_invalid,
            data=json.dumps(valid_payload),
            timeout=TIMEOUT
        )
        assert response.status_code == 400, f"Expected 400 Bad Request for invalid signature, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed for invalid signature webhook: {e}"

    # Test invalid webhook event handling (bad payload)
    try:
        response = requests.post(
            BASE_URL + WEBHOOK_ENDPOINT,
            headers=headers_valid,
            data=json.dumps(invalid_payload),
            timeout=TIMEOUT
        )
        assert response.status_code == 400, f"Expected 400 Bad Request for invalid payload, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed for invalid payload webhook: {e}"

test_stripe_webhook_event_handling()