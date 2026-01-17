# 📚 เอกสารโครงการ Chiangrai Booking System

เอกสารทั้งหมดของโครงการจัดระเบียบตามหมวดหมู่

---

## 📋 สารบัญ

### 🚀 [Setup & Installation](./setup/)
- [SETUP.md](./setup/SETUP.md) - คู่มือการติดตั้งและตั้งค่าโปรเจกต์
- [FILE_STRUCTURE.md](../FILE_STRUCTURE.md) - โครงสร้างไฟล์และโฟลเดอร์ (อยู่ใน root)

### 🔐 [Authentication](./authentication/)
- [GOOGLE_LOGIN_GUIDE.md](./authentication/GOOGLE_LOGIN_GUIDE.md) - คู่มือติดตั้ง Google Login ด้วย NextAuth.js
- [GOOGLE_OAUTH_SETUP.md](./authentication/GOOGLE_OAUTH_SETUP.md) - วิธีตั้งค่า Google OAuth
- [FIX_CALLBACK_URL.md](./authentication/FIX_CALLBACK_URL.md) - แก้ไข Callback URL ใน Google Cloud Console

### 💳 [Payment System](./payment/)
- [PAYMENT_SETUP.md](./payment/PAYMENT_SETUP.md) - วิธีตั้งค่าระบบชำระเงิน (Stripe)
- [PAYMENT_API.md](./payment/PAYMENT_API.md) - API Documentation สำหรับ Payment
- [PAYMENT_TESTING.md](./payment/PAYMENT_TESTING.md) - คู่มือการทดสอบ Payment
- [TEST_PAYMENT.md](./payment/TEST_PAYMENT.md) - วิธีทดสอบ Payment System

### 🗄️ [Database](./database/)
- [DATABASE_MIGRATION.md](./database/DATABASE_MIGRATION.md) - คู่มือการ Migration Database
- [RUN_MIGRATIONS.md](./database/RUN_MIGRATIONS.md) - วิธีรัน Database Migrations

### 🛠️ [Development](./development/)
- [QUESTIONS_FOR_CLIENT.md](./development/QUESTIONS_FOR_CLIENT.md) - คำถามสำหรับ Client

---

## 📖 เอกสารหลัก

- [README.md](../README.md) - ภาพรวมโปรเจกต์ (อยู่ใน root)
- [FILE_STRUCTURE.md](../FILE_STRUCTURE.md) - โครงสร้างไฟล์และโฟลเดอร์ (อยู่ใน root)

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

---

## 📁 โครงสร้างโฟลเดอร์

```
docs/
├── README.md (ไฟล์นี้)
├── setup/
│   ├── README.md
│   └── SETUP.md
├── authentication/
│   ├── README.md
│   ├── GOOGLE_LOGIN_GUIDE.md
│   ├── GOOGLE_OAUTH_SETUP.md
│   └── FIX_CALLBACK_URL.md
├── payment/
│   ├── README.md
│   ├── PAYMENT_SETUP.md
│   ├── PAYMENT_API.md
│   ├── PAYMENT_TESTING.md
│   └── TEST_PAYMENT.md
├── database/
│   ├── README.md
│   ├── DATABASE_MIGRATION.md
│   └── RUN_MIGRATIONS.md
└── development/
    ├── README.md
    └── QUESTIONS_FOR_CLIENT.md
```

---

## 📝 หมายเหตุ

- เอกสารทั้งหมดอยู่ในโฟลเดอร์ `docs/`
- เอกสารหลัก (README.md, FILE_STRUCTURE.md) ยังอยู่ใน root directory
- ถ้ามีเอกสารใหม่ ให้เพิ่มในหมวดหมู่ที่เหมาะสม
