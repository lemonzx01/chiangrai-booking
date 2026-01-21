
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** chiangrai-booking
- **Date:** 2026-01-21
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 list_hotels_pagination_and_filtering
- **Test Code:** [TC001_list_hotels_pagination_and_filtering.py](./TC001_list_hotels_pagination_and_filtering.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8b67b48d-6a70-48fb-864d-6167140100f7/da894e4f-a940-4962-b530-73a308bdd9bd
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 get_hotel_details_by_id
- **Test Code:** [TC002_get_hotel_details_by_id.py](./TC002_get_hotel_details_by_id.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8b67b48d-6a70-48fb-864d-6167140100f7/cdc8207e-cfe4-49e6-88c7-f3dbbe61943a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 list_cars_pagination_and_filtering
- **Test Code:** [TC003_list_cars_pagination_and_filtering.py](./TC003_list_cars_pagination_and_filtering.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8b67b48d-6a70-48fb-864d-6167140100f7/d80623e3-b6f2-4507-a406-ec744db32f94
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 get_car_details_by_id
- **Test Code:** [TC004_get_car_details_by_id.py](./TC004_get_car_details_by_id.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8b67b48d-6a70-48fb-864d-6167140100f7/a261168f-9564-417b-8e15-dc370fcb32d7
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 user_login_with_email_and_password
- **Test Code:** [TC005_user_login_with_email_and_password.py](./TC005_user_login_with_email_and_password.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 98, in <module>
  File "<string>", line 21, in test_user_login_with_email_and_password
AssertionError: Expected 200 for valid user login but got 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8b67b48d-6a70-48fb-864d-6167140100f7/630c8585-c7a1-4567-91e6-b1ca9f5be1ad
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 user_registration_with_validation
- **Test Code:** [TC006_user_registration_with_validation.py](./TC006_user_registration_with_validation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8b67b48d-6a70-48fb-864d-6167140100f7/f7aa95b9-42cc-442d-abf2-707a236eca9a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 google_oauth_authentication_flow
- **Test Code:** [TC007_google_oauth_authentication_flow.py](./TC007_google_oauth_authentication_flow.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 39, in <module>
  File "<string>", line 14, in test_google_oauth_authentication_flow
AssertionError: Expected 302 redirect from signin endpoint, got 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8b67b48d-6a70-48fb-864d-6167140100f7/65de840f-0155-4c21-b01b-e1a841ab5e2a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 create_booking_with_validation_and_price_calculation
- **Test Code:** [TC008_create_booking_with_validation_and_price_calculation.py](./TC008_create_booking_with_validation_and_price_calculation.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 165, in <module>
  File "<string>", line 108, in test_create_booking_with_validation_and_price_calculation
AssertionError: Booking creation failed: 400 {"error":"ข้อมูลไม่ถูกต้อง","details":"[\n  {\n    \"code\": \"invalid_value\",\n    \"values\": [\n      \"HOTEL\",\n      \"CAR\",\n      \"COMBO\"\n    ],\n    \"path\": [\n      \"booking_type\"\n    ],\n    \"message\": \"Invalid option: expected one of \\\"HOTEL\\\"|\\\"CAR\\\"|\\\"COMBO\\\"\"\n  },\n  {\n    \"expected\": \"string\",\n    \"code\": \"invalid_type\",\n    \"path\": [\n      \"check_in_date\"\n    ],\n    \"message\": \"Invalid input: expected string, received undefined\"\n  },\n  {\n    \"expected\": \"string\",\n    \"code\": \"invalid_type\",\n    \"path\": [\n      \"check_out_date\"\n    ],\n    \"message\": \"Invalid input: expected string, received undefined\"\n  },\n  {\n    \"expected\": \"number\",\n    \"code\": \"invalid_type\",\n    \"path\": [\n      \"number_of_guests\"\n    ],\n    \"message\": \"Invalid input: expected number, received undefined\"\n  },\n  {\n    \"expected\": \"string\",\n    \"code\": \"invalid_type\",\n    \"path\": [\n      \"customer_name\"\n    ],\n    \"message\": \"Invalid input: expected string, received undefined\"\n  },\n  {\n    \"expected\": \"string\",\n    \"code\": \"invalid_type\",\n    \"path\": [\n      \"customer_email\"\n    ],\n    \"message\": \"Invalid input: expected string, received undefined\"\n  },\n  {\n    \"expected\": \"string\",\n    \"code\": \"invalid_type\",\n    \"path\": [\n      \"customer_phone\"\n    ],\n    \"message\": \"Invalid input: expected string, received undefined\"\n  },\n  {\n    \"origin\": \"string\",\n    \"code\": \"invalid_format\",\n    \"format\": \"uuid\",\n    \"pattern\": \"/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/\",\n    \"path\": [\n      \"room_type_id\"\n    ],\n    \"message\": \"Invalid UUID\"\n  }\n]"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8b67b48d-6a70-48fb-864d-6167140100f7/084f5354-2e64-48bc-b4d7-c0d41af55567
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 create_stripe_checkout_session
- **Test Code:** [TC009_create_stripe_checkout_session.py](./TC009_create_stripe_checkout_session.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 108, in <module>
  File "<string>", line 21, in test_create_stripe_checkout_session
AssertionError: Login failed with status 401: {"error":"อีเมลหรือรหัสผ่านไม่ถูกต้อง"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8b67b48d-6a70-48fb-864d-6167140100f7/12387e72-7ef4-43b2-804a-066291f2f62f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 stripe_webhook_event_handling
- **Test Code:** [TC010_stripe_webhook_event_handling.py](./TC010_stripe_webhook_event_handling.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 82, in <module>
  File "<string>", line 54, in test_stripe_webhook_event_handling
AssertionError: Expected 200 OK for valid webhook, got 400

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8b67b48d-6a70-48fb-864d-6167140100f7/f9407b75-d2ed-40ad-8720-0bf54ca26d4b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **50.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---