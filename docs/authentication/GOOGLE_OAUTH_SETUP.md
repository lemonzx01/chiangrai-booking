# 🔐 Google OAuth Setup Guide

คู่มือการตั้งค่า Google OAuth สำหรับระบบล็อกอินผ่าน Google

## 📋 สิ่งที่ต้องมี

1. **Google Cloud Console Project**
2. **OAuth 2.0 Client ID และ Secret**
3. **Authorized Redirect URIs**

---

## 🚀 ขั้นตอนการตั้งค่า

### 1. สร้าง Google Cloud Project

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่หรือเลือก Project ที่มีอยู่
3. เปิดใช้งาน **Google+ API** (ถ้ายังไม่ได้เปิด)

### 2. สร้าง OAuth 2.0 Credentials

1. ไปที่ **APIs & Services** > **Credentials**
2. คลิก **Create Credentials** > **OAuth client ID**
3. เลือก **Web application**
4. ตั้งชื่อ (เช่น: "Chiangrai Booking")
5. **Authorized redirect URIs** - ใส่ URI ต่อไปนี้:

#### สำหรับ Development (Local)
```
http://localhost:3001/api/auth/callback/google
```

#### สำหรับ Production (ถ้ามี)
```
https://your-backend-domain.com/api/auth/callback/google
```

**หมายเหตุ:** 
- Backend รันที่ port **3001** (ไม่ใช่ 3000)
- NextAuth callback route อยู่ที่ `/api/auth/callback/google`
- Frontend (port 3000) จะ redirect ไปยัง backend (port 3001) อัตโนมัติ

### 3. คัดลอก Client ID และ Secret

หลังจากสร้าง OAuth client แล้ว:
- **Client ID**: คัดลอกมาใส่ใน `.env.local`
- **Client Secret**: คัดลอกมาใส่ใน `.env.local`

---

## 🔑 Environment Variables

### Backend `.env.local` (apps/backend/.env.local หรือ root .env.local)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth Secret (ใช้สำหรับ sign JWT tokens)
NEXTAUTH_SECRET=your-nextauth-secret-key-min-32-chars
# หรือใช้ JWT_SECRET แทนได้
JWT_SECRET=your-jwt-secret-key-min-32-chars

# App URL (สำหรับสร้าง callback URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Frontend `.env.local` (ถ้าต้องการ)

```bash
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend URL (สำหรับ proxy API calls)
BACKEND_URL=http://localhost:3001
```

---

## ✅ ตรวจสอบการตั้งค่า

### 1. ตรวจสอบ Environment Variables

```bash
# ใน backend directory
cd apps/backend
# ตรวจสอบว่า GOOGLE_CLIENT_ID และ GOOGLE_CLIENT_SECRET ถูกตั้งค่าแล้ว
```

### 2. รัน Development Servers

```bash
# จาก root directory
npm run dev
```

หรือรันแยก:

```bash
# Terminal 1: Backend (port 3001)
cd apps/backend
npm run dev

# Terminal 2: Frontend (port 3000)
cd apps/frontend
npm run dev
```

### 3. ทดสอบ Google Login

1. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000/login`
2. คลิกปุ่ม "เข้าสู่ระบบด้วย Google"
3. ควรจะ redirect ไปยัง Google login page
4. หลังจาก login สำเร็จ จะ redirect กลับมาที่ `/profile`

---

## 🔍 Troubleshooting

### ❌ ปัญหา: "redirect_uri_mismatch"

**สาเหตุ:** Redirect URI ใน Google Cloud Console ไม่ตรงกับที่ NextAuth ใช้

**แก้ไข:**
1. ตรวจสอบว่าใส่ redirect URI ถูกต้องใน Google Cloud Console:
   - Development: `http://localhost:3001/api/auth/callback/google`
   - Production: `https://your-backend-domain.com/api/auth/callback/google`
2. ตรวจสอบว่า backend รันที่ port 3001
3. รอสักครู่ (Google อาจใช้เวลาในการอัพเดท redirect URIs)

### ❌ ปัญหา: "invalid_client"

**สาเหตุ:** Client ID หรือ Client Secret ไม่ถูกต้อง

**แก้ไข:**
1. ตรวจสอบว่า `GOOGLE_CLIENT_ID` และ `GOOGLE_CLIENT_SECRET` ถูกตั้งค่าใน backend `.env.local`
2. ตรวจสอบว่าไม่มี space หรือ newline ใน environment variables
3. Restart backend server หลังจากแก้ไข `.env.local`

### ❌ ปัญหา: Frontend ไม่ redirect ไป Google

**สาเหตุ:** Frontend ไม่สามารถเรียก backend API ได้

**แก้ไข:**
1. ตรวจสอบว่า backend รันอยู่ที่ port 3001
2. ตรวจสอบว่า frontend มี `BACKEND_URL=http://localhost:3001` ใน `.env.local`
3. หรือแก้ไข frontend ให้เรียก backend โดยตรง:
   ```typescript
   // ใน login/page.tsx
   const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
   window.location.href = `${backendUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`
   ```

### ❌ ปัญหา: "NEXTAUTH_SECRET is not set"

**สาเหตุ:** ไม่ได้ตั้งค่า `NEXTAUTH_SECRET` หรือ `JWT_SECRET`

**แก้ไข:**
1. เพิ่ม `NEXTAUTH_SECRET` หรือ `JWT_SECRET` ใน backend `.env.local`
2. Secret ต้องมีความยาวอย่างน้อย 32 ตัวอักษร
3. Restart backend server

---

## 📝 หมายเหตุสำคัญ

1. **Backend Port**: Backend รันที่ port **3001** (ไม่ใช่ 3000)
2. **Redirect URI**: ต้องใช้ backend URL (port 3001) ไม่ใช่ frontend URL
3. **Environment Variables**: ต้องตั้งค่าใน **backend** `.env.local` (ไม่ใช่ frontend)
4. **NextAuth Secret**: ใช้สำหรับ sign JWT tokens ต้องมีความยาวอย่างน้อย 32 ตัวอักษร

---

## 🔗 Links ที่เกี่ยวข้อง

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
