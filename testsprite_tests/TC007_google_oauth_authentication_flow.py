import requests

def test_google_oauth_authentication_flow():
    base_url = "http://localhost:3001"
    timeout = 30

    try:
        # Step 1: Initiate Google OAuth flow
        signin_url = f"{base_url}/api/auth/signin/google"
        params = {"callbackUrl": "http://localhost:3001/dashboard"}
        resp_signin = requests.get(signin_url, params=params, allow_redirects=False, timeout=timeout)
        
        # Assert 302 redirect to Google OAuth endpoint
        assert resp_signin.status_code == 302, f"Expected 302 redirect from signin endpoint, got {resp_signin.status_code}"
        location_header = resp_signin.headers.get("Location")
        assert location_header is not None, "Redirect location header missing in signin response"
        # The location should be to Google OAuth, usually https://accounts.google.com or similar
        assert "accounts.google.com" in location_header or "oauth" in location_header.lower(), \
            f"Redirect location does not point to Google OAuth: {location_header}"

        # Step 2: Simulate callback from Google OAuth to the system
        # Since we cannot perform actual Google OAuth in test, we simulate a GET callback request.
        # Generally, the callback URL is hit by OAuth provider after authentication.
        callback_url = f"{base_url}/api/auth/callback/google"
        # For the test environment, send GET request without query parameters.
        resp_callback = requests.get(callback_url, allow_redirects=False, timeout=timeout)
        
        # Assert 302 redirect to default or provided callbackUrl
        assert resp_callback.status_code == 302, f"Expected 302 redirect from callback endpoint, got {resp_callback.status_code}"
        callback_location = resp_callback.headers.get("Location")
        assert callback_location is not None, "Redirect location header missing in callback response"
        # The redirect should be a relative path or absolute URL to home/dashboard or account page (as per app design)
        assert callback_location.startswith("http") or callback_location.startswith("/"), \
            f"Invalid redirect location from callback: {callback_location}"

    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_google_oauth_authentication_flow()