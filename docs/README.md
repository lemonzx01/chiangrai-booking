# 📚 เอกสารโครงการ Chiangrai Booking System

เอกสารทั้งหมดของโครงการจัดระเบียบตามหมวดหมู่

**อัพเดทล่าสุด:** แก้ไข TestSprite tests (TC005, TC008, TC009) แล้ว - 8/10 tests passing (80%)

---

## 📋 สารบัญ

### 🚀 [Setup & Installation](./setup/)
- [SETUP.md](./setup/SETUP.md) - คู่มือการติดตั้งและตั้งค่าโปรเจกต์
  - Mock Mode (Development/Demo)
  - Production Mode (Supabase)
  - Test Credentials
  - Environment Variables
- [CHECK_MOCK_MODE.md](./setup/CHECK_MOCK_MODE.md) - วิธีตรวจสอบ Mock Mode
- [ENV_CHECK.md](./setup/ENV_CHECK.md) - ตรวจสอบ Environment Variables

### 🔐 [Authentication](./authentication/)
- [GOOGLE_OAUTH_SETUP.md](./authentication/GOOGLE_OAUTH_SETUP.md) - วิธีตั้งค่า Google OAuth (แนะนำ)
- [GOOGLE_LOGIN_GUIDE.md](./authentication/GOOGLE_LOGIN_GUIDE.md) - คู่มือติดตั้ง Google Login ด้วย NextAuth.js (ฉบับละเอียด)
- [FIX_CALLBACK_URL.md](./authentication/FIX_CALLBACK_URL.md) - แก้ไข Callback URL ใน Google Cloud Console

### 💳 [Payment System](./payment/)
- [PAYMENT_SETUP.md](./payment/PAYMENT_SETUP.md) - วิธีตั้งค่าระบบชำระเงิน (Stripe)
- [PAYMENT_API.md](./payment/PAYMENT_API.md) - API Documentation สำหรับ Payment
- [PAYMENT_TESTING.md](./payment/PAYMENT_TESTING.md) - คู่มือการทดสอบ Payment (แนะนำ)

### 🗄️ [Database](./database/)
- [DATABASE_MIGRATION.md](./database/DATABASE_MIGRATION.md) - คู่มือการ Migration Database
- [RUN_MIGRATIONS.md](./database/RUN_MIGRATIONS.md) - วิธีรัน Database Migrations

### 🛠️ [Development](./development/)
- [PRODUCT_SPECIFICATION.md](./development/PRODUCT_SPECIFICATION.md) - Product Specification Document
- [QUESTIONS_FOR_CLIENT.md](./development/QUESTIONS_FOR_CLIENT.md) - คำถามสำหรับ Client

### 🚀 Deployment & Operations
- [DEPLOYMENT.md](./DEPLOYMENT.md) - คู่มือ deploy ไปยัง Vercel (two-project setup)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Pre-launch checklist (security, schema, monitoring)
- [SECRET_ROTATION.md](./SECRET_ROTATION.md) - วิธีหมุน secret (JWT, Supabase, Stripe, Google OAuth)
- [BACKUP.md](./BACKUP.md) - Backup & restore procedure
- [SENTRY.md](./SENTRY.md) - Error tracking integration
- [E2E.md](./E2E.md) - End-to-end smoke tests
- [API.md](./API.md) - API endpoint reference

---

## 📖 เอกสารหลัก

- [README.md](../README.md) - ภาพรวมโปรเจกต์ (อยู่ใน root)
- [CHANGELOG.md](../CHANGELOG.md) - สรุปการแก้ไขและอัพเดท
- [TODO.md](../TODO.md) - รายการสิ่งที่ต้องทำ
- [FILE_STRUCTURE.md](../FILE_STRUCTURE.md) - โครงสร้างไฟล์และโฟลเดอร์ (อยู่ใน root)

---

## 🧪 Testing & TestSprite

โปรเจคนี้ใช้ TestSprite สำหรับ automated testing:

- **Test Files:** `testsprite_tests/`
- **Test Report:** `testsprite_tests/testsprite-mcp-test-report.html`
- **Status:** 8/10 tests passing (80%)
- **Test Analysis:** [testsprite_tests/TEST_FAILURE_ANALYSIS.md](../testsprite_tests/TEST_FAILURE_ANALYSIS.md)

### Tests ที่ผ่าน (8/10)
- ✅ TC001 - List Hotels
- ✅ TC002 - Get Hotel Details
- ✅ TC003 - List Cars
- ✅ TC004 - Get Car Details
- ✅ TC005 - User Login (แก้ไขแล้ว)
- ✅ TC006 - User Registration
- ✅ TC008 - Create Booking (แก้ไขแล้ว)
- ✅ TC009 - Checkout Session (แก้ไขแล้ว)

### Tests ที่ต้อง configure (2/10)
- ⚠️ TC007 - Google OAuth (ต้อง configure Google OAuth credentials)
- ⚠️ TC010 - Stripe Webhook (ต้อง configure Stripe webhook secret)

---

## 🔍 ค้นหาเอกสาร

### ต้องการติดตั้งโปรเจกต์?
→ ดู [Setup & Installation](./setup/)

### ต้องการตั้งค่า Google Login?
→ ดู [Authentication](./authentication/)

### ต้องการตั้งค่าระบบชำระเงิน?
→ ดู [Payment System](./payment/)

### ต้องการจัดการ Database?
→ ดู [Database](./database/)

### ต้องการดูการแก้ไขล่าสุด?
→ ดู [CHANGELOG.md](../CHANGELOG.md)

---

## 📁 โครงสร้างโฟลเดอร์

```
docs/
├── README.md (ไฟล์นี้)
├── setup/
│   ├── README.md
│   ├── SETUP.md
│   ├── CHECK_MOCK_MODE.md
│   └── ENV_CHECK.md
├── authentication/
│   ├── README.md
│   ├── GOOGLE_OAUTH_SETUP.md (แนะนำ)
│   ├── GOOGLE_LOGIN_GUIDE.md (ฉบับละเอียด)
│   └── FIX_CALLBACK_URL.md
├── payment/
│   ├── README.md
│   ├── PAYMENT_SETUP.md
│   ├── PAYMENT_API.md
│   └── PAYMENT_TESTING.md (แนะนำ)
├── database/
│   ├── README.md
│   ├── DATABASE_MIGRATION.md
│   └── RUN_MIGRATIONS.md
└── development/
    ├── README.md
    ├── PRODUCT_SPECIFICATION.md
    └── QUESTIONS_FOR_CLIENT.md
```

---

## 📝 หมายเหตุ

- เอกสารทั้งหมดอยู่ในโฟลเดอร์ `docs/`
- เอกสารหลัก (README.md, CHANGELOG.md, TODO.md, FILE_STRUCTURE.md) อยู่ใน root directory
- ถ้ามีเอกสารใหม่ ให้เพิ่มในหมวดหมู่ที่เหมาะสม
- เอกสารที่ลบแล้ว: `TEST_PAYMENT.md` (รวมอยู่ใน PAYMENT_TESTING.md แล้ว)
