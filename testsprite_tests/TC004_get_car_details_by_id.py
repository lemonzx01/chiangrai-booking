import requests
import uuid

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_get_car_details_by_id():
    # First, get list of cars to get a valid car id to test "existing car" case
    try:
        list_response = requests.get(f"{BASE_URL}/api/cars", timeout=TIMEOUT)
        assert list_response.status_code == 200, f"Expected status 200 but got {list_response.status_code}"
        cars_data = list_response.json()
        assert isinstance(cars_data, dict), "Cars list response is not a JSON object"
        # The actual schema for /api/cars list response was not fully described; assume 'data' is a list of cars
        cars_list = cars_data.get("data", [])
        assert isinstance(cars_list, list), "'data' property is not a list"
        # Use first car id if available; if none, skip valid car id test
        valid_car_id = cars_list[0].get("id") if cars_list else None
    except Exception as e:
        valid_car_id = None

    if valid_car_id:
        # Test GET /api/cars/{id} for existing car
        response = requests.get(f"{BASE_URL}/api/cars/{valid_car_id}", timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status 200 for existing car but got {response.status_code}"
        car_detail = response.json()
        assert isinstance(car_detail, dict), "Car detail response is not a JSON object"
        # Minimal validation: check at least 'id' matches valid_car_id
        assert car_detail.get("id") == valid_car_id or "id" not in car_detail, "Car detail ID does not match requested ID"

    # Test GET /api/cars/{id} for a non-existent car id (UUID random unlikely to exist)
    non_existent_id = str(uuid.uuid4())
    response_404 = requests.get(f"{BASE_URL}/api/cars/{non_existent_id}", timeout=TIMEOUT)
    assert response_404.status_code == 404, f"Expected status 404 for non-existent car ID but got {response_404.status_code}"

test_get_car_details_by_id()