import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30


def test_list_hotels_pagination_and_location_filter():
    url = f"{BASE_URL}/api/hotels"
    params = {
        "limit": 5,
        "offset": 0,
        "location": "Chiang Rai"
    }

    try:
        response = requests.get(url, params=params, timeout=TIMEOUT)
    except requests.RequestException as err:
        assert False, f"Request failed: {err}"

    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"

    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate presence of 'data' and 'pagination'
    assert "data" in json_data, "'data' field missing in response"
    assert "pagination" in json_data, "'pagination' field missing in response"

    hotels = json_data["data"]
    pagination = json_data["pagination"]

    # Validate hotels is a list and pagination is a dict
    assert isinstance(hotels, list), "'data' should be a list"
    assert isinstance(pagination, dict), "'pagination' should be a dict"

    # Validate that number of hotels returned is <= limit
    assert len(hotels) <= params["limit"], f"Number of hotels returned ({len(hotels)}) exceeds limit ({params['limit']})"

    # Validate that each hotel is active and matches location filter
    for hotel in hotels:
        # 'active' property is expected in hotel data based on description "active hotels"
        active = hotel.get("active", None)
        assert active is True, "Hotel found that is not active"

        hotel_location = hotel.get("location", "")
        assert isinstance(hotel_location, str)
        # Check location filter substring case-insensitive match
        assert params["location"].lower() in hotel_location.lower(), f"Hotel location '{hotel_location}' does not match filter '{params['location']}'"

    # Validate pagination properties (common ones like limit, offset, total)
    expected_pagination_keys = {"limit", "offset", "total"}
    missing_keys = expected_pagination_keys - pagination.keys()
    assert not missing_keys, f"Pagination missing keys: {missing_keys}"


test_list_hotels_pagination_and_location_filter()