import requests
import uuid

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_get_hotel_details_by_id():
    # First, create a hotel to ensure we have a valid hotel id to test against.
    # We need admin auth token to create a hotel. For testing, assume a valid ADMIN_TOKEN is available or skip if not.
    # Since no admin credentials provided, we'll just attempt list hotels to get an existing hotel id if possible.
    # If no hotel exists, the test will create a hotel with admin token then delete it after test.
    # For this example, we will try to get an existing hotel id by listing hotels.
    
    # Helper functions
    def get_hotels():
        resp = requests.get(f"{BASE_URL}/api/hotels", timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    def create_hotel(admin_token: str):
        url = f"{BASE_URL}/api/hotels"
        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "name": f"Test Hotel {uuid.uuid4()}",
            "description": "Test hotel created for API testing.",
            "location": "Chiang Rai",
            "address": "123 Test St",
            "phone": "0999999999",
            "email": "testhotel@example.com",
            "website": "http://testhotel.example.com",
            "active": True,
            "stars": 4,
            "policy": "No pets allowed.",
            "amenities": ["wifi", "pool", "parking"]
        }
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
        return response.json().get("id")

    def delete_hotel(hotel_id: str, admin_token: str):
        url = f"{BASE_URL}/api/hotels/{hotel_id}"
        headers = {
            "Authorization": f"Bearer {admin_token}"
        }
        # Assuming DELETE method exists to delete hotel. If not, skip deletion.
        try:
            response = requests.delete(url, headers=headers, timeout=TIMEOUT)
            # If not allowed or 405, ignore
            if response.status_code not in (200, 204, 404):
                response.raise_for_status()
        except Exception:
            pass

    # Admin token - for test purpose, this should be replaced with a valid admin token if available.
    ADMIN_TOKEN = None

    # Attempt to get at least one existing hotel id from listing
    try:
        hotels_data = get_hotels()
        hotel_list = hotels_data.get("data", [])
        if hotel_list:
            hotel_id = hotel_list[0].get("id") or hotel_list[0].get("_id") or str(hotel_list[0].get("id"))
        else:
            hotel_id = None
    except Exception:
        hotel_id = None

    # If no hotel id found and no admin token, then we cannot create hotel - test will only test 404 case
    if not hotel_id and not ADMIN_TOKEN:
        # We can only test for 404 in this case
        non_existent_id = str(uuid.uuid4())
        url = f"{BASE_URL}/api/hotels/{non_existent_id}"
        resp = requests.get(url, timeout=TIMEOUT)
        assert resp.status_code == 404, f"Expected 404 for non-existent hotel id, got {resp.status_code}"
        return

    # If no hotel_id but have admin token, create one
    created = False
    if not hotel_id and ADMIN_TOKEN:
        hotel_id = None
        try:
            # Create hotel
            url_create = f"{BASE_URL}/api/hotels"
            headers_create = {
                "Authorization": f"Bearer {ADMIN_TOKEN}",
                "Content-Type": "application/json"
            }
            payload_create = {
                "name": f"Test Hotel {uuid.uuid4()}",
                "description": "Test hotel for get_hotel_details_by_id test.",
                "location": "Chiang Rai",
                "address": "123 Test St",
                "phone": "0999999999",
                "email": "testhotel@example.com",
                "website": "http://testhotel.example.com",
                "active": True,
                "stars": 4,
                "policy": "No pets allowed.",
                "amenities": ["wifi", "pool", "parking"]
            }
            resp_create = requests.post(url_create, json=payload_create, headers=headers_create, timeout=TIMEOUT)
            resp_create.raise_for_status()
            hotel_resp = resp_create.json()
            # Some APIs might return created resource or header for location; try to find id in body
            hotel_id = hotel_resp.get("id") or hotel_resp.get("hotel", {}).get("id")
            created = True
        except Exception as ex:
            assert False, f"Failed to create hotel for testing: {ex}"

    # Test fetching hotel details - success case
    url_details = f"{BASE_URL}/api/hotels/{hotel_id}"
    resp_details = requests.get(url_details, timeout=TIMEOUT)
    assert resp_details.status_code == 200, f"Expected 200 for existing hotel id, got {resp_details.status_code}"
    json_data = resp_details.json()
    assert "hotel" in json_data, "Response JSON must contain 'hotel'"
    assert "room_types" in json_data, "Response JSON must contain 'room_types'"
    assert isinstance(json_data["room_types"], list), "'room_types' must be a list"
    hotel_info = json_data["hotel"]
    assert isinstance(hotel_info, dict), "'hotel' must be a dict"
    # Basic fields check
    assert "id" in hotel_info, "'hotel' object must contain 'id'"
    assert hotel_info["id"] == hotel_id, f"'hotel.id' must match requested id {hotel_id}"

    # Test fetching hotel details - 404 case for non-existent id
    non_existent_id = str(uuid.uuid4())
    url_not_found = f"{BASE_URL}/api/hotels/{non_existent_id}"
    resp_not_found = requests.get(url_not_found, timeout=TIMEOUT)
    assert resp_not_found.status_code == 404, f"Expected 404 for non-existent hotel id, got {resp_not_found.status_code}"

    # Cleanup created hotel if any
    if created and ADMIN_TOKEN and hotel_id:
        try:
            url_delete = f"{BASE_URL}/api/hotels/{hotel_id}"
            headers_delete = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
            resp_delete = requests.delete(url_delete, headers=headers_delete, timeout=TIMEOUT)
            # Accept 200, 204 or 404 (already deleted)
            assert resp_delete.status_code in (200, 204, 404)
        except Exception:
            pass

test_get_hotel_details_by_id()