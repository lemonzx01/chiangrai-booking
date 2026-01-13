# Payment API Documentation

## Overview

API documentation สำหรับระบบชำระเงิน

---

## Endpoints

### 1. Create Checkout Session

**Endpoint:** `POST /api/checkout`

**Description:** สร้าง Stripe Checkout session สำหรับการชำระเงิน

**Request Body:**
```json
{
  "booking_id": "uuid-here",
  "success_url": "https://example.com/success?code=XXX", // optional
  "cancel_url": "https://example.com/cancel" // optional
}
```

**Response:**
```json
{
  "session_id": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

**Error Responses:**
- `400` - Invalid request data
- `404` - Booking not found
- `429` - Too many requests (rate limited)
- `500` - Internal server error

**Rate Limit:** 10 requests per minute per IP

---

### 2. Get Payment History

**Endpoint:** `GET /api/payments`

**Description:** ดึงรายการการชำระเงินทั้งหมด (Admin only)

**Query Parameters:**
- `limit` (optional) - จำนวนรายการต่อหน้า (default: 20)
- `offset` (optional) - ตำแหน่งเริ่มต้น (default: 0)
- `status` (optional) - Filter ตาม status (PENDING, SUCCEEDED, FAILED, REFUNDED)
- `start_date` (optional) - วันที่เริ่มต้น (YYYY-MM-DD)
- `end_date` (optional) - วันที่สิ้นสุด (YYYY-MM-DD)
- `booking_id` (optional) - Filter ตาม booking ID

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "booking_id": "uuid",
      "amount": 1000.00,
      "currency": "THB",
      "status": "SUCCEEDED",
      "paid_at": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "booking": {
        "booking_code": "BK-12345",
        "customer_name": "John Doe",
        "customer_email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Error Responses:**
- `401` - Unauthorized (not admin)
- `429` - Too many requests
- `500` - Internal server error

**Rate Limit:** 30 requests per minute per IP

---

### 3. Get Payment Statistics

**Endpoint:** `GET /api/payments/stats`

**Description:** ดึงสถิติการชำระเงิน (Admin only)

**Query Parameters:**
- `start_date` (optional) - วันที่เริ่มต้น (YYYY-MM-DD)
- `end_date` (optional) - วันที่สิ้นสุด (YYYY-MM-DD)

**Response:**
```json
{
  "totalRevenue": 100000.00,
  "totalCount": 100,
  "succeededCount": 90,
  "failedCount": 5,
  "pendingCount": 3,
  "refundedCount": 2,
  "successRate": 90.00,
  "currency": "THB"
}
```

**Error Responses:**
- `401` - Unauthorized (not admin)
- `429` - Too many requests
- `500` - Internal server error

---

### 4. Stripe Webhook

**Endpoint:** `POST /api/webhook/stripe`

**Description:** รับ webhook events จาก Stripe

**Headers:**
- `stripe-signature` - Stripe signature สำหรับ verify

**Events Handled:**
- `checkout.session.completed` - ชำระเงินสำเร็จ
- `checkout.session.expired` - Session หมดอายุ
- `payment_intent.payment_failed` - ชำระเงินล้มเหลว
- `account.updated` - Stripe Connect account อัพเดท

**Response:**
```json
{
  "received": true
}
```

---

## Payment Status

- `PENDING` - รอดำเนินการ
- `SUCCEEDED` - ชำระเงินสำเร็จ
- `FAILED` - ชำระเงินล้มเหลว
- `REFUNDED` - คืนเงินแล้ว

---

## Supported Payment Methods

- Credit/Debit Card (Visa, Mastercard, Amex, etc.)
- PayPal (ต้อง enable ใน Stripe Dashboard)
- PromptPay (Thailand)

---

## Supported Currencies

- THB (บาทไทย) - Default
- USD (ดอลลาร์สหรัฐ)
- EUR (ยูโร)
- JPY (เยนญี่ปุ่น)
- CNY (หยวนจีน)
- GBP (ปอนด์อังกฤษ)

---

## Rate Limiting

- `/api/checkout`: 10 requests per minute per IP
- `/api/payments`: 30 requests per minute per IP

Response headers:
- `X-RateLimit-Limit` - จำนวน requests ที่อนุญาต
- `X-RateLimit-Remaining` - จำนวน requests ที่เหลือ
- `X-RateLimit-Reset` - เวลาที่จะ reset
- `Retry-After` - จำนวนวินาทีที่ต้องรอก่อน retry

---

## Security

- Rate limiting สำหรับทุก endpoints
- Input validation
- SQL injection prevention
- XSS prevention
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)

---

## Error Handling

ทุก API จะส่งกลับ error ในรูปแบบ:
```json
{
  "error": "Error message here"
}
```

Error messages เป็น user-friendly และไม่เปิดเผยข้อมูล sensitive
