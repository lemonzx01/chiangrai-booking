import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30


def test_list_cars_pagination_and_filtering():
    try:
        # Test: GET /api/cars - default pagination (limit=10, offset=0)
        url = f"{BASE_URL}/api/cars"
        params = {"limit": 10, "offset": 0}
        response = requests.get(url, params=params, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
        data = response.json()
        # Expect data to be a list or contain a list of cars; the PRD does not specify full structure so check type
        assert isinstance(data, (list, dict)), "Response data should be a list or dict"
        # If dict, try to locate 'data' key for list of cars or accept list directly
        cars_list = None
        if isinstance(data, dict):
            # sometimes APIs wrap list data in 'data' or similar; if so, get it; else assume dict is a list
            if "data" in data:
                cars_list = data["data"]
            else:
                cars_list = data
        else:
            cars_list = data
        assert isinstance(cars_list, list), "Cars list should be a list"
        # Check number of cars returned is at most 10 (limit)
        assert len(cars_list) <= 10, "Number of cars returned should be at most the limit (10)"

        # If no cars returned just end here as filtering test not possible
        if len(cars_list) == 0:
            return

        # Pick a car_type from the first car if available
        first_car = cars_list[0]
        car_type = None
        if isinstance(first_car, dict):
            # try to find a "car_type" field
            for key in first_car:
                if "car_type" == key:
                    car_type = first_car[key]
                    break
                # some APIs might use another naming like "type" or "category", try "type" as fallback
                if key == "type":
                    car_type = first_car[key]
            # fallback: if no car_type key, try 'carType'
            if car_type is None and "carType" in first_car:
                car_type = first_car["carType"]
            # If still None, try 'category'
            if car_type is None and "category" in first_car:
                car_type = first_car["category"]

        # If cannot determine a car_type, skip filtering test
        if car_type is None or not isinstance(car_type, str) or car_type == "":
            return

        # Test: GET /api/cars with car_type filter
        params = {"limit": 10, "offset": 0, "car_type": car_type}
        f_response = requests.get(url, params=params, timeout=TIMEOUT)
        assert f_response.status_code == 200, f"Expected 200 OK but got {f_response.status_code} for filtered request"
        f_data = f_response.json()
        f_cars_list = None
        if isinstance(f_data, dict):
            if "data" in f_data:
                f_cars_list = f_data["data"]
            else:
                f_cars_list = f_data
        else:
            f_cars_list = f_data
        assert isinstance(f_cars_list, list), "Filtered cars list should be a list"

        # All returned cars should have the requested car_type if car_type is a property
        for car in f_cars_list:
            if isinstance(car, dict):
                car_car_type = None
                if "car_type" in car:
                    car_car_type = car["car_type"]
                elif "type" in car:
                    car_car_type = car["type"]
                elif "carType" in car:
                    car_car_type = car["carType"]
                elif "category" in car:
                    car_car_type = car["category"]
                # If car_car_type found, assert it matches filter
                if car_car_type is not None:
                    assert car_car_type == car_type, f"Car's car_type {car_car_type} does not match filter {car_type}"
    except requests.Timeout:
        assert False, "Request timed out"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_list_cars_pagination_and_filtering()