# 🚀 วิธี Deploy บน Vercel

## ข้อกำหนดเบื้องต้น

- บัญชี [Vercel](https://vercel.com)
- บัญชี [Supabase](https://supabase.com)
- Repository บน GitHub/GitLab/Bitbucket

---

## 📋 ขั้นตอนการ Deploy

### 1. เตรียม Supabase Database

1. สร้าง project ใหม่ใน [Supabase Dashboard](https://supabase.com/dashboard)
2. ไปที่ **SQL Editor** และรันไฟล์ `nextjs-app/supabase/schema.sql`
3. สร้าง Admin User แรก:
   ```sql
   INSERT INTO admins (email, password_hash, name, role, is_active)
   VALUES (
     'admin@example.com',
     '$2a$10$YourHashedPasswordHere',  -- ใช้ bcrypt hash
     'Admin User',
     'super_admin',
     true
   );
   ```

**สร้าง Password Hash:**
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10))"
```

### 2. ตั้งค่า Vercel Project

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. คลิก **"New Project"**
3. เลือก repository ของคุณ
4. ตั้งค่าดังนี้:

```
Framework Preset: Next.js
Root Directory: nextjs-app    👈 สำคัญมาก!
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Node.js Version: 18.x
```

### 3. เพิ่ม Environment Variables

ใน **Settings** → **Environment Variables** เพิ่ม:

#### 🔐 Supabase (จำเป็น)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**หา Keys ได้ที่:**  
Supabase Dashboard → Settings → API

#### 🔑 JWT Secret (จำเป็น)
```bash
JWT_SECRET=generate-a-random-32-character-string-here
```

**สร้าง JWT Secret:**
```bash
openssl rand -base64 32
```

#### 💳 Stripe (ถ้าใช้)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 📧 Resend (ถ้าใช้)
```bash
RESEND_API_KEY=re_...
```

### 4. Deploy!

1. คลิก **"Deploy"**
2. รอ build เสร็จ (ประมาณ 2-3 นาที)
3. เข้าไปทดสอบที่ URL ที่ได้

---

## 🧪 ทดสอบระบบ

### ทดสอบ Frontend
- เปิดหน้าเว็บ: `https://your-app.vercel.app`
- ลองเข้าหน้า Hotels: `https://your-app.vercel.app/hotels`
- ลองเข้าหน้า Cars: `https://your-app.vercel.app/cars`

### ทดสอบ Admin Login
1. เข้า: `https://your-app.vercel.app/admin/login`
2. ใส่ email และ password ที่สร้างไว้
3. ถ้า login สำเร็จจะเข้า Dashboard

### ทดสอบ API
```bash
# ทดสอบ API Hotels
curl https://your-app.vercel.app/api/hotels

# ทดสอบ API Cars
curl https://your-app.vercel.app/api/cars
```

---

## 🐛 แก้ปัญหาที่พบบ่อย

### ❌ Build Failed: "Root directory not found"
**วิธีแก้:** ตรวจสอบว่าตั้ง **Root Directory** เป็น `nextjs-app` แล้ว

### ❌ Runtime Error: "process.env.NEXT_PUBLIC_SUPABASE_URL is undefined"
**วิธีแก้:** ตรวจสอบว่าตั้ง Environment Variables ครบถ้วนแล้ว และ Redeploy

### ❌ Login ไม่ได้: "Invalid credentials"
**วิธีแก้:**
1. ตรวจสอบว่ามี admin user ในตาราง `admins` แล้ว
2. ตรวจสอบว่า password hash ถูกต้อง (ใช้ bcrypt)
3. ตรวจสอบว่า `is_active = true`

### ❌ 500 Internal Server Error
**วิธีแก้:**
1. เช็ค Vercel Logs: Dashboard → Deployments → View Function Logs
2. ตรวจสอบ Environment Variables
3. ตรวจสอบ Supabase connection

---

## 📱 ตั้งค่า Custom Domain (ถ้าต้องการ)

1. ไปที่ Vercel Project → Settings → Domains
2. เพิ่ม domain ของคุณ (เช่น `waygo-thailand.com`)
3. อัปเดต DNS records ตามคำแนะนำ
4. รอ SSL certificate ติดตั้งอัตโนมัติ (5-10 นาที)

---

## 🔄 การอัปเดต

เมื่อมีการเปลี่ยนแปลงโค้ด:

1. Push ไปที่ Git repository
2. Vercel จะ deploy อัตโนมัติ
3. ตรวจสอบสถานะใน Dashboard

---

## 📞 ติดต่อ Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

---

**สร้างโดย:** Waygo Thailand Team  
**อัปเดตล่าสุด:** 2024

