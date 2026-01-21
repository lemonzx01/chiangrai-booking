import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_list_hotels_pagination_and_filtering():
    # Test getting paginated list of active hotels without filter
    url = f"{BASE_URL}/api/hotels"
    params = {
        "limit": 5,
        "offset": 0
    }
    try:
        response = requests.get(url, params=params, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    
    data = response.json()
    assert "data" in data, "Response JSON missing 'data'"
    assert isinstance(data["data"], list), "'data' should be a list"
    assert "pagination" in data, "Response JSON missing 'pagination'"
    
    # Check pagination structure
    pagination = data["pagination"]
    assert isinstance(pagination, dict), "'pagination' should be a dict"
    
    # Test filtering by location parameter
    location = None
    # Try to obtain a location from the first hotel's address or location if exists
    if data["data"]:
        hotel = data["data"][0]
        # Try different possible location fields from hotel structure
        location = hotel.get("location") or hotel.get("address") or None
        if location and isinstance(location, dict):
            # If location is an object, try to get a city or name field
            location = location.get("city") or location.get("name") or None
    
    if location:
        params_with_location = {
            "limit": 5,
            "offset": 0,
            "location": location
        }
        try:
            filtered_response = requests.get(url, params=params_with_location, timeout=TIMEOUT)
            filtered_response.raise_for_status()
        except requests.RequestException as e:
            assert False, f"Request with location filter failed: {e}"
        
        filtered_data = filtered_response.json()
        assert "data" in filtered_data, "Response JSON missing 'data' in filtered response"
        assert isinstance(filtered_data["data"], list), "'data' should be a list in filtered response"
        
        for hotel in filtered_data["data"]:
            # The hotel should match the location filter in some way
            hotel_location = hotel.get("location") or hotel.get("address") or ""
            # If location is a string, just check substring inclusion ignoring case
            if isinstance(hotel_location, dict):
                hotel_location_str = hotel_location.get("city", "") or hotel_location.get("name", "")
            else:
                hotel_location_str = hotel_location
            assert location.lower() in str(hotel_location_str).lower(), f"Hotel location '{hotel_location_str}' does not match filter '{location}'"
    else:
        # If no location found in results, just pass as no filtering test possible
        pass

test_list_hotels_pagination_and_filtering()