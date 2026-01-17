# Payment Testing Guide - คู่มือการทดสอบ Payment

## Overview

คู่มือการทดสอบ payment flow ด้วย Stripe Test Mode

---

## Prerequisites

- Stripe Account (Test Mode)
- Stripe Test API Keys
- Application running locally หรือ deployed

---

## 1. ตั้งค่า Test Environment

### Environment Variables

```bash
# ใช้ Test Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (จาก test webhook endpoint)

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2. Test Cards

### Success Cards

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Visa - Success |
| `5555 5555 5555 4444` | Mastercard - Success |
| `3782 822463 10005` | Amex - Success |

### Decline Cards

| Card Number | Description |
|-------------|-------------|
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |

### 3D Secure Cards

| Card Number | Description |
|-------------|-------------|
| `4000 0025 0000 3155` | Requires authentication |
| `4000 0027 6000 3184` | Requires authentication (declined) |

### Other Test Cards

| Card Number | Description |
|-------------|-------------|
| `4000 0000 0000 3220` | 3D Secure authentication required |
| `4000 0000 0000 3055` | 3D Secure authentication required (declined) |

**Test Card Details:**
- CVV: `123` (หรือตัวเลข 3 หลัก)
- Expiry: วันที่ในอนาคต (เช่น `12/25`)
- ZIP: `12345` (หรือตัวเลข 5 หลัก)

---

## 3. Testing Payment Flow

### Test Case 1: Successful Payment

1. สร้างการจอง
2. ไปที่หน้า checkout
3. กด "Pay Now"
4. ควร redirect ไป Stripe Checkout
5. ใช้ Test Card: `4242 4242 4242 4242`
6. กรอกข้อมูล:
   - Email: `test@example.com`
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`
7. คลิก "Pay"
8. ควร redirect กลับมาหน้า success
9. ตรวจสอบว่า:
   - Payment status เป็น `SUCCEEDED`
   - Booking status เป็น `PAID`
   - Webhook event ถูกส่งมา

### Test Case 2: Declined Payment

1. ทำตาม Test Case 1 แต่ใช้ Card: `4000 0000 0000 0002`
2. ควรแสดง error message
3. ตรวจสอบว่า:
   - Payment status เป็น `FAILED`
   - Booking status ยังเป็น `PENDING`

### Test Case 3: 3D Secure Authentication

1. ทำตาม Test Case 1 แต่ใช้ Card: `4000 0025 0000 3155`
2. ควรแสดงหน้า 3D Secure authentication
3. กรอก authentication code
4. ควร redirect กลับมาหน้า success

### Test Case 4: PayPal Payment

1. ทำตาม Test Case 1
2. เลือก PayPal เป็น payment method
3. ใช้ PayPal Sandbox Account
4. ตรวจสอบว่า payment สำเร็จ

### Test Case 5: Session Expired

1. สร้าง checkout session
2. รอให้ session หมดอายุ (24 ชั่วโมง)
3. ตรวจสอบว่า:
   - Payment status เป็น `FAILED`
   - Webhook event `checkout.session.expired` ถูกส่งมา

---

## 4. Testing Webhooks

### ใช้ Stripe CLI

1. ติดตั้ง Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhook/stripe`
4. Trigger test events: `stripe trigger checkout.session.completed`

### ตรวจสอบ Webhook Events

1. ไปที่ Stripe Dashboard > Webhooks
2. ดู Events ที่ส่งมา
3. ตรวจสอบว่า events ถูกส่งมาถึง endpoint หรือไม่
4. ตรวจสอบ logs ใน application

---

## 5. Testing Error Scenarios

### Test Case: Invalid Booking ID

1. ส่ง request ไป `/api/checkout` ด้วย booking_id ที่ไม่มีอยู่
2. ควรได้ response `404` พร้อม error message

### Test Case: Rate Limiting

1. ส่ง request ไป `/api/checkout` มากกว่า 10 ครั้งใน 1 นาที
2. ควรได้ response `429` พร้อม `Retry-After` header

### Test Case: Invalid Currency

1. สร้าง booking ด้วย currency ที่ไม่รองรับ
2. ควรได้ error message

### Test Case: Network Error

1. Disconnect internet
2. พยายามสร้าง checkout session
3. ควรแสดง network error message

---

## 6. Testing Currency Conversion

### Test Case: Convert THB to USD

1. สร้าง booking ด้วย currency = `USD`
2. ตรวจสอบว่า:
   - ราคาถูกแปลงเป็น USD
   - Stripe Checkout แสดงราคาใน USD

### Test Case: Exchange Rate Not Found

1. ใช้ currency ที่ไม่มีใน database
2. ควรใช้ค่า fallback หรือแสดง error

---

## 7. Testing Admin Features

### Test Case: View Payment History

1. Login เป็น Admin
2. ไปที่ `/admin/payments`
3. ตรวจสอบว่า:
   - แสดงรายการ payment ทั้งหมด
   - แสดงสถิติ (Total Revenue, Success Rate, etc.)

### Test Case: Filter Payments

1. ไปที่ `/admin/payments`
2. Filter ตาม status
3. ตรวจสอบว่าแสดงเฉพาะ payment ที่ตรงกับ filter

---

## 8. Testing Security

### Test Case: SQL Injection

1. ส่ง request ด้วย SQL injection payload
2. ควร reject request และแสดง error

### Test Case: XSS

1. ส่ง request ด้วย XSS payload
2. ควร sanitize input

### Test Case: Rate Limiting

1. ส่ง request มากเกิน limit
2. ควร block และแสดง `429` error

---

## 9. Checklist

- [ ] ทดสอบ payment flow ด้วย Test Cards
- [ ] ทดสอบ PayPal payment
- [ ] ทดสอบ 3D Secure authentication
- [ ] ทดสอบ declined payment
- [ ] ทดสอบ webhook events
- [ ] ทดสอบ currency conversion
- [ ] ทดสอบ error scenarios
- [ ] ทดสอบ rate limiting
- [ ] ทดสอบ security measures
- [ ] ทดสอบ admin payment history

---

## 10. Stripe Test Mode vs Live Mode

### Test Mode
- ใช้สำหรับ development และ testing
- ไม่มีการชำระเงินจริง
- ใช้ Test Cards
- Webhook events เป็น test events

### Live Mode
- ใช้สำหรับ production
- มีการชำระเงินจริง
- ใช้บัตรจริง
- Webhook events เป็น real events

**สำคัญ:** อย่าใช้ Live Keys ใน development environment!

---

## Additional Resources

- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe Webhooks Testing](https://stripe.com/docs/webhooks/test)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
