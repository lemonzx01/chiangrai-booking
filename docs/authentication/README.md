# 🔐 Authentication

เอกสารเกี่ยวกับระบบ Authentication และ Google OAuth

## 📄 เอกสารในหมวดนี้

- [GOOGLE_LOGIN_GUIDE.md](./GOOGLE_LOGIN_GUIDE.md) - คู่มือติดตั้ง Google Login ด้วย NextAuth.js ฉบับสมบูรณ์
  - Environment Variables
  - NextAuth Configuration
  - หน้า Login พร้อมปุ่ม Google
  - การเช็คสถานะ Login และแสดงข้อมูล User
  - API Endpoints
  - Troubleshooting

- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - วิธีตั้งค่า Google OAuth
  - สร้าง Google Cloud Project
  - สร้าง OAuth 2.0 Credentials
  - ตั้งค่า Environment Variables
  - ตรวจสอบการตั้งค่า

- [FIX_CALLBACK_URL.md](./FIX_CALLBACK_URL.md) - แก้ไข Callback URL ใน Google Cloud Console
  - ปัญหาและวิธีแก้ไข
  - เหตุผลที่ต้องใช้ port 3001

## 🎯 Quick Start

1. อ่าน [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) เพื่อตั้งค่า Google OAuth
2. ถ้ามีปัญหา redirect_uri_mismatch → ดู [FIX_CALLBACK_URL.md](./FIX_CALLBACK_URL.md)
3. สำหรับรายละเอียดการใช้งาน → ดู [GOOGLE_LOGIN_GUIDE.md](./GOOGLE_LOGIN_GUIDE.md)
