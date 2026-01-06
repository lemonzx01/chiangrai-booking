# Setup Guide - Chiangrai Booking System

คู่มือการติดตั้งและใช้งานระบบจองโรงแรมและรถเช่า

## 📋 สารบัญ

- [Mock Mode (Development/Demo)](#mock-mode-developmentdemo)
- [Production Mode (Supabase)](#production-mode-supabase)
- [Admin Login](#admin-login)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Mock Mode (Development/Demo)

**เหมาะสำหรับ:** การพัฒนา, การทดสอบ, การ Demo

### ขั้นตอนการติดตั้ง

1. **Clone repository และติดตั้ง dependencies**
   ```bash
   npm install
   ```

2. **คัดลอกไฟล์ environment variables**
   ```bash
   cp .env.example .env.local
   ```

3. **แก้ไข `.env.local`** (หรือใช้ค่าที่มีอยู่แล้ว)
   ```bash
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   JWT_SECRET=development-secret-key-12345
   # ไม่ต้องใส่ Supabase keys
   ```

4. **รัน development server**
   ```bash
   npm run dev
   ```

5. **เปิดเบราว์เซอร์**
   ```
   http://localhost:3000
   ```

### ✅ สิ่งที่ได้ใน Mock Mode

- ✅ ระบบทำงานได้ทันทีโดยไม่ต้องตั้งค่า Supabase
- ✅ มี Mock Data พร้อมใช้งาน (Hotels, Cars, Bookings)
- ✅ Admin Login ใช้งานได้
- ✅ Dashboard แสดงข้อมูล Mock
- ✅ ทุกหน้าทำงานได้ปกติ

### 🔑 Admin Login (Mock Mode)

- **Email:** `admin@gotjourneythailand.com`
- **Password:** `admin123`

---

## 🏭 Production Mode (Supabase)

**เหมาะสำหรับ:** Production, การใช้งานจริง

### ขั้นตอนการติดตั้ง

1. **สร้าง Supabase Project**
   - ไปที่ [https://app.supabase.com](https://app.supabase.com)
   - สร้าง Project ใหม่
   - รอให้ Project พร้อมใช้งาน

2. **ตั้งค่า Database**
   - ไปที่ SQL Editor ใน Supabase Dashboard
   - รันไฟล์ `supabase/schema.sql` (สร้าง tables)
   - รันไฟล์ `supabase/seed-data.sql` (ใส่ข้อมูลตัวอย่าง)

3. **ดึง API Keys**
   - ไปที่ Settings > API
   - คัดลอก:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

4. **ตั้งค่า Environment Variables**
   - สร้างไฟล์ `.env.local` (หรือแก้ไขใน Vercel/Deployment platform)
   - ใส่ค่าตาม `.env.example`:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     JWT_SECRET=your-super-secret-key-change-this
     ```

5. **สร้าง Admin User**
   - รันคำสั่ง:
     ```bash
     node scripts/create-admin.js
     ```
   - คัดลอก SQL ที่ได้
   - รันใน Supabase SQL Editor

6. **Deploy**
   ```bash
   npm run build
   npm start
   ```

### ✅ สิ่งที่ได้ใน Production Mode

- ✅ ใช้ Supabase Database จริง
- ✅ ข้อมูลถูกเก็บใน Database จริง
- ✅ รองรับการขยายตัว
- ✅ มี Row Level Security (RLS)

---

## 🔐 Admin Login

### Mock Mode
- **Email:** `admin@gotjourneythailand.com`
- **Password:** `admin123`

### Production Mode
- ใช้ Admin ที่สร้างใน Supabase (ตามที่กำหนดใน `seed-data.sql` หรือ SQL ที่รันเอง)

### เปลี่ยน Password

1. **สร้าง Password Hash ใหม่**
   ```bash
   node scripts/create-admin.js
   ```

2. **อัพเดทใน Database**
   ```sql
   UPDATE admins 
   SET password_hash = 'your-new-hash-here'
   WHERE email = 'admin@gotjourneythailand.com';
   ```

---

## 🗄️ Database Setup

### Schema Structure

- **hotels** - ข้อมูลโรงแรม/แพ็คเกจ
- **cars** - ข้อมูลรถเช่า
- **bookings** - การจอง
- **payments** - การชำระเงิน
- **admins** - ผู้ดูแลระบบ

### สร้าง Admin User ใหม่

```bash
# สร้าง hash สำหรับ password
node scripts/create-admin.js

# รัน SQL ใน Supabase
INSERT INTO admins (email, password_hash, name, role, is_active) 
VALUES ('your-email@example.com', 'hash-from-script', 'Your Name', 'admin', true);
```

---

## 🔧 Environment Variables

### จำเป็น (Required)

| Variable | Description | Mock Mode | Production |
|----------|-------------|-----------|------------|
| `NEXT_PUBLIC_APP_URL` | URL ของแอป | ✅ | ✅ |
| `JWT_SECRET` | Secret สำหรับ JWT | ✅ | ✅ |

### Supabase (Production Only)

| Variable | Description | Mock Mode | Production |
|----------|-------------|-----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | ❌ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | ❌ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | ❌ | ✅ |

### Optional (Services)

| Variable | Description | Required |
|----------|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe Secret Key | ❌ |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret | ❌ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | ❌ |
| `LINE_NOTIFY_TOKEN` | Line Notify Token | ❌ |
| `RESEND_API_KEY` | Resend API Key | ❌ |

---

## 🐛 Troubleshooting

### ปัญหา: Login ไม่ได้

**Mock Mode:**
- ตรวจสอบว่าใช้ Email/Password ที่ถูกต้อง: `admin@gotjourneythailand.com` / `admin123`
- ตรวจสอบว่า `JWT_SECRET` ตั้งค่าแล้ว

**Production Mode:**
- ตรวจสอบว่า Admin user ถูกสร้างใน Supabase แล้ว
- ตรวจสอบว่า Password hash ถูกต้อง
- ตรวจสอบว่า `SUPABASE_SERVICE_ROLE_KEY` ตั้งค่าแล้ว

### ปัญหา: ไม่มีข้อมูลแสดง

**Mock Mode:**
- ตรวจสอบว่า Mock Client ทำงาน (ดู console log)
- ควรเห็น: `⚠️ Supabase not configured - using mock client`

**Production Mode:**
- ตรวจสอบว่า Schema และ Seed Data รันแล้ว
- ตรวจสอบว่า Supabase keys ถูกต้อง
- ตรวจสอบ Network tab ใน DevTools

### ปัญหา: Build Error

- ตรวจสอบว่า TypeScript types ถูกต้อง
- รัน `npm run lint` เพื่อตรวจสอบ errors
- ตรวจสอบว่า dependencies ติดตั้งครบ: `npm install`

### ปัญหา: Vercel Deployment

1. ตั้งค่า Root Directory เป็น `.` (root)
2. ตั้งค่า Environment Variables ใน Vercel Dashboard
3. ตรวจสอบ Build Logs

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

---

## 💡 Tips

1. **Development:** ใช้ Mock Mode เพื่อความเร็วในการพัฒนา
2. **Testing:** ใช้ Mock Mode เพื่อทดสอบ UI/UX
3. **Production:** ใช้ Supabase เพื่อความเสถียรและความปลอดภัย
4. **Password:** เปลี่ยน Password ทันทีเมื่อ Deploy Production
5. **Secrets:** อย่า commit `.env.local` เข้า Git

---

## 📞 Support

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ Troubleshooting section
2. ตรวจสอบ Console Logs
3. ตรวจสอบ Network Requests

---

**Happy Coding! 🚀**


















