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

## 🔑 Authentication Features

### Login Methods
- **Email/Password Login** - ใช้ credentials provider
- **Google OAuth Login** - ใช้ NextAuth.js v5 beta.30

### Password Management
- **Forgot Password** - ขอรีเซ็ตรหัสผ่านผ่านอีเมล
  - Endpoint: `POST /api/auth/forgot-password`
  - Rate limiting: 3 requests per hour per IP
  - Email service: Resend API (optional)
  
- **Reset Password** - รีเซ็ตรหัสผ่านด้วย token
  - Endpoint: `POST /api/auth/reset-password`
  - Token validation: `GET /api/auth/validate-reset-token`
  - Token expiration: 1 hour

### Security Features
- Password hashing with bcrypt (12 rounds)
- JWT token for password reset (1 hour expiration)
- Rate limiting to prevent spam
- Email validation
- Token validation before reset

## 📋 Required Environment Variables

### Required
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `NEXTAUTH_SECRET` or `JWT_SECRET` - JWT signing secret (min 32 chars)
- `NEXT_PUBLIC_APP_URL` - App URL (e.g., http://localhost:3000)

### Optional
- `RESEND_API_KEY` - For email service (forgot password feature)
  - If not set: System will work but emails won't be sent (warning logged)

## 🎯 Quick Start

1. อ่าน [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) เพื่อตั้งค่า Google OAuth
2. ถ้ามีปัญหา redirect_uri_mismatch → ดู [FIX_CALLBACK_URL.md](./FIX_CALLBACK_URL.md)
3. สำหรับรายละเอียดการใช้งาน → ดู [GOOGLE_LOGIN_GUIDE.md](./GOOGLE_LOGIN_GUIDE.md)
4. สำหรับ Forgot Password → ตั้งค่า `RESEND_API_KEY` (optional)

## 🐛 Troubleshooting

### Google OAuth 404 Error
- ตรวจสอบว่า backend server รันอยู่ (port 3001)
- ตรวจสอบว่า NextAuth handlers ถูก export ถูกต้อง
- ดู console logs ใน backend terminal

### Forgot Password ไม่ส่งอีเมล
- ตรวจสอบว่า `RESEND_API_KEY` ถูกตั้งค่าใน `.env.local`
- ตรวจสอบ backend logs สำหรับ error messages
- ระบบจะยัง return success เพื่อความปลอดภัย (ไม่เปิดเผยว่าอีเมลมีในระบบหรือไม่)

### Reset Password Token Invalid
- Token หมดอายุใน 1 ชั่วโมง
- ตรวจสอบว่า token ถูกต้องและยังไม่หมดอายุ
- ใช้ `/api/auth/validate-reset-token` เพื่อตรวจสอบ token
