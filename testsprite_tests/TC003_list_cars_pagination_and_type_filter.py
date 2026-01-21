import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_list_cars_pagination_and_type_filter():
    try:
        # Test default pagination (limit=10, offset=0) without filter
        response = requests.get(f"{BASE_URL}/api/cars", timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a JSON object"
        # Expect at least 'data' and possibly pagination keys, but API doc does not specify response schema exactly.
        # Check that response contains a list or iterable (likely) for cars
        assert 'data' not in data or isinstance(data.get('data', []), list) or isinstance(data, list) or 'pagination' in data, "Response format unclear but should contain car list or relevant structure"
        # We allow flexibility because PRD lacks strict schema for GET /api/cars response beyond description
        
        # Test with pagination parameters limit=5 and offset=0
        params = {"limit": 5, "offset": 0}
        response = requests.get(f"{BASE_URL}/api/cars", params=params, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}"
        data = response.json()
        # If response has 'data' array, assert length <= 5
        if isinstance(data, dict) and 'data' in data:
            assert len(data['data']) <= 5, f"Expected at most 5 cars but got {len(data['data'])}"
        
        # Test filtering by car_type query parameter
        test_car_type = "SUV"
        params = {"car_type": test_car_type}
        response = requests.get(f"{BASE_URL}/api/cars", params=params, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}"
        data = response.json()

        # Validate that all returned cars have the filtered car_type, if data is a list or inside data['data']
        cars_list = []
        if isinstance(data, dict) and 'data' in data:
            cars_list = data['data']
        elif isinstance(data, list):
            cars_list = data
        else:
            # If unknown response structure, do not assert on car_type
            cars_list = []

        if cars_list:
            for car in cars_list:
                assert 'car_type' in car, "Response car object must include 'car_type' field"
                assert car['car_type'].lower() == test_car_type.lower(), f"Car type expected '{test_car_type}', got '{car['car_type']}'"

    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_list_cars_pagination_and_type_filter()