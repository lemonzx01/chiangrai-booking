# Payment Setup Guide - คู่มือการตั้งค่า Stripe

## Overview

คู่มือการตั้งค่า Stripe Payment Gateway สำหรับระบบจองโรงแรมและรถเช่า

## Prerequisites

- มี Stripe Account แล้ว
- มี Stripe API Keys (Secret Key และ Publishable Key)

---

## 1. สร้าง Stripe Account

1. ไปที่ [https://stripe.com](https://stripe.com)
2. สร้าง Account ใหม่ (ถ้ายังไม่มี)
3. เลือกประเทศ: Thailand
4. กรอกข้อมูลธุรกิจ

---

## 2. ดึง Stripe API Keys

### Test Mode (สำหรับทดสอบ)

1. ไปที่ Stripe Dashboard: [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. คัดลอก **Publishable key** (เริ่มต้นด้วย `pk_test_...`)
3. คัดลอก **Secret key** (เริ่มต้นด้วย `sk_test_...`)

### Live Mode (สำหรับ Production)

1. ไปที่ Stripe Dashboard: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. เปลี่ยนเป็น **Live mode** (สลับที่มุมขวาบน)
3. คัดลอก **Publishable key** (เริ่มต้นด้วย `pk_live_...`)
4. คัดลอก **Secret key** (เริ่มต้นด้วย `sk_live_...`)

---

## 3. Enable PayPal ใน Stripe

1. ไปที่ Stripe Dashboard: [https://dashboard.stripe.com/settings/payment_methods](https://dashboard.stripe.com/settings/payment_methods)
2. คลิกที่ **PayPal**
3. คลิก **Enable** หรือ **Activate**
4. กรอกข้อมูลที่จำเป็น (ถ้ามี)
5. รอให้ Stripe approve (อาจใช้เวลาหลายวัน)

**หมายเหตุ:** PayPal ต้อง enable ใน Stripe Dashboard ก่อนใช้งาน

---

## 4. ตั้งค่า Stripe Webhook

### สร้าง Webhook Endpoint

1. ไปที่ Stripe Dashboard: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. คลิก **Add endpoint**
3. ใส่ **Endpoint URL**: `https://your-domain.com/api/webhook/stripe`
4. เลือก Events ที่ต้องการ:
   - `checkout.session.completed` - เมื่อชำระเงินสำเร็จ
   - `checkout.session.expired` - เมื่อ session หมดอายุ
   - `payment_intent.payment_failed` - เมื่อชำระเงินล้มเหลว
   - `account.updated` - เมื่อ Stripe Connect account อัพเดท
5. คลิก **Add endpoint**

### ดึง Webhook Secret

1. หลังจากสร้าง webhook endpoint แล้ว
2. คลิกที่ endpoint ที่สร้าง
3. คัดลอก **Signing secret** (เริ่มต้นด้วย `whsec_...`)

---

## 5. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` หรือตั้งค่าใน deployment platform:

```bash
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... หรือ pk_live_...
STRIPE_SECRET_KEY=sk_test_... หรือ sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (สำหรับ webhook และ redirect)
NEXT_PUBLIC_APP_URL=http://localhost:3000 หรือ https://your-domain.com
```

---

## 6. ทดสอบการตั้งค่า

### ทดสอบด้วย Stripe Test Mode

1. ใช้ Test API Keys
2. ใช้ Test Card Numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`
3. ใช้ CVV: `123`
4. ใช้ Expiry: วันที่ในอนาคต (เช่น `12/25`)
5. ใช้ ZIP: `12345`

### ทดสอบ PayPal

1. ใช้ PayPal Sandbox Account
2. สร้าง Sandbox Account ที่ [https://developer.paypal.com](https://developer.paypal.com)
3. ใช้ Sandbox Account เพื่อทดสอบ

---

## 7. ตรวจสอบการทำงาน

### ตรวจสอบ Payment Flow

1. สร้างการจอง
2. ไปที่หน้า checkout
3. กด "Pay Now"
4. ควร redirect ไป Stripe Checkout
5. ทดสอบชำระเงิน
6. ตรวจสอบว่า webhook ทำงานถูกต้อง

### ตรวจสอบ Webhook

1. ไปที่ Stripe Dashboard > Webhooks
2. ดู Events ที่ส่งมา
3. ตรวจสอบว่า events ถูกส่งมาถึง endpoint หรือไม่
4. ตรวจสอบ logs ใน application

---

## Troubleshooting

### ปัญหา: PayPal ไม่แสดงใน Stripe Checkout

**สาเหตุ:**
- PayPal ยังไม่ enable ใน Stripe Dashboard
- PayPal ยังไม่ผ่านการ approve จาก Stripe

**วิธีแก้:**
1. ตรวจสอบว่า PayPal enable แล้วหรือยัง
2. รอให้ Stripe approve (อาจใช้เวลาหลายวัน)
3. ตรวจสอบว่าใช้ payment_method_types: ['paypal'] ใน checkout session

### ปัญหา: Webhook ไม่ทำงาน

**สาเหตุ:**
- Webhook endpoint URL ไม่ถูกต้อง
- Webhook secret ไม่ถูกต้อง
- SSL certificate ไม่ถูกต้อง (สำหรับ production)

**วิธีแก้:**
1. ตรวจสอบว่า webhook endpoint URL ถูกต้อง
2. ตรวจสอบว่า STRIPE_WEBHOOK_SECRET ถูกต้อง
3. ตรวจสอบว่า webhook endpoint มี SSL (สำหรับ production)
4. ทดสอบ webhook ด้วย Stripe CLI

### ปัญหา: Payment ไม่สำเร็จ

**สาเหตุ:**
- Stripe API Keys ไม่ถูกต้อง
- Card ถูก decline
- Network error

**วิธีแก้:**
1. ตรวจสอบว่า Stripe API Keys ถูกต้อง
2. ตรวจสอบ logs ใน Stripe Dashboard
3. ตรวจสอบ error messages ใน application

---

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [PayPal in Stripe](https://stripe.com/docs/payments/paypal)
