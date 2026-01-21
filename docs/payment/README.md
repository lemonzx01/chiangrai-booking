# 💳 Payment System

เอกสารเกี่ยวกับระบบชำระเงินด้วย Stripe

## 📄 เอกสารในหมวดนี้

- [PAYMENT_SETUP.md](./PAYMENT_SETUP.md) - วิธีตั้งค่าระบบชำระเงิน (Stripe)
  - สร้าง Stripe Account
  - ตั้งค่า Stripe Connect
  - Environment Variables
  - Webhook Configuration

- [PAYMENT_API.md](./PAYMENT_API.md) - API Documentation สำหรับ Payment
  - API Endpoints
  - Request/Response Format
  - Error Handling

- [PAYMENT_TESTING.md](./PAYMENT_TESTING.md) - คู่มือการทดสอบ Payment (แนะนำ)
  - Test Cards
  - Test Scenarios
  - Debugging
  - Webhook Testing

## 🎯 Quick Start

1. **ตั้งค่า:** อ่าน [PAYMENT_SETUP.md](./PAYMENT_SETUP.md) เพื่อตั้งค่า Stripe
2. **API:** ดู [PAYMENT_API.md](./PAYMENT_API.md) เพื่อเข้าใจ API
3. **ทดสอบ:** ใช้ [PAYMENT_TESTING.md](./PAYMENT_TESTING.md) สำหรับการทดสอบ

## ⚠️ TestSprite Test TC010

- **สถานะ:** ⚠️ ต้อง configure Stripe webhook secret
- **Test:** TC010 - Stripe Webhook (400 Error → ต้อง configure)
- **วิธีแก้ไข:** ดู [PAYMENT_SETUP.md](./PAYMENT_SETUP.md) - ส่วน Webhook Configuration
- **หมายเหตุ:** Stripe Webhook เป็น optional feature - ถ้าไม่ต้องการใช้ก็ไม่จำเป็นต้อง configure
