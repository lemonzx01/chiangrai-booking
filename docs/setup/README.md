# 🚀 Setup & Installation

เอกสารเกี่ยวกับการติดตั้งและตั้งค่าโปรเจกต์

## 📄 เอกสารในหมวดนี้

- [SETUP.md](./SETUP.md) - คู่มือการติดตั้งและตั้งค่าโปรเจกต์ฉบับสมบูรณ์
  - Mock Mode (Development/Demo) - **แนะนำสำหรับการพัฒนา**
  - Production Mode (Supabase)
  - Admin Login
  - Database Setup
  - Environment Variables
  - Troubleshooting

- [CHECK_MOCK_MODE.md](./CHECK_MOCK_MODE.md) - วิธีตรวจสอบ Mock Mode
  - วิธีตรวจสอบว่า Mock Mode ทำงานหรือไม่
  - Test Credentials
  - Troubleshooting

- [ENV_CHECK.md](./ENV_CHECK.md) - ตรวจสอบ Environment Variables
  - Required for Testing (Mock Mode)
  - Required for Google OAuth (Optional)
  - Test Credentials

## 🎯 Quick Start

### Mock Mode (แนะนำสำหรับ Development)

1. Clone repository และติดตั้ง dependencies
2. สร้าง `apps/backend/.env.local`:
   ```bash
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   JWT_SECRET=development-secret-key-minimum-32-characters-long
   # ไม่ต้องใส่ Supabase keys (จะใช้ Mock Mode อัตโนมัติ)
   ```
3. รัน development server:
   ```bash
   cd apps/backend && npm run dev
   cd apps/frontend && npm run dev
   ```
4. ใช้ test credentials:
   - Admin: `admin@gotjourneythailand.com` / `admin123`
   - User: `user@example.com` / `user123` หรือ `validUserPass123`

### Production Mode

1. ตั้งค่า Supabase project
2. รัน database migrations
3. ตั้งค่า environment variables (ดู [SETUP.md](./SETUP.md))

## 🔗 เอกสารที่เกี่ยวข้อง

- [FILE_STRUCTURE.md](../../FILE_STRUCTURE.md) - โครงสร้างไฟล์และโฟลเดอร์ (อยู่ใน root)
- [README.md](../../README.md) - ภาพรวมโปรเจกต์
- [CHANGELOG.md](../../CHANGELOG.md) - สรุปการแก้ไขและอัพเดท
