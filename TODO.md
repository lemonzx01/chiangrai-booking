# ✅ TODO - สิ่งที่ต้องทำตอนนี้

## 🔥 สำคัญ - ต้องทำก่อน

### 1. ✅ แก้ไข Callback URL ใน Google Cloud Console

**สถานะ:** ✅ เสร็จแล้ว

**สิ่งที่ต้องทำ:**
- [ ] ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
- [ ] ไปที่ **APIs & Services** > **Credentials**
- [ ] คลิกที่ OAuth 2.0 Client ID ของคุณ
- [ ] ในส่วน **Authorized redirect URIs**:
  - ลบ: `http://localhost:3000/api/auth/callback/google` ❌
  - เพิ่ม: `http://localhost:3001/api/auth/callback/google` ✅
- [ ] คลิก **Save**
- [ ] รอสักครู่ (Google อาจใช้เวลาในการอัพเดท)

**เอกสาร:** [docs/authentication/FIX_CALLBACK_URL.md](./docs/authentication/FIX_CALLBACK_URL.md)

---

### 2. ✅ ตรวจสอบ Environment Variables

**สถานะ:** ✅ เสร็จแล้ว

**สิ่งที่ต้องทำ:**
- [ ] ตรวจสอบว่า `.env.local` มี `GOOGLE_CLIENT_ID` และ `GOOGLE_CLIENT_SECRET` แล้ว
- [ ] ตรวจสอบว่ามี `NEXTAUTH_SECRET` หรือ `JWT_SECRET` (ต้องมีความยาวอย่างน้อย 32 ตัวอักษร)
- [ ] ตรวจสอบว่า `NEXT_PUBLIC_APP_URL=http://localhost:3000`

**ตัวอย่าง `.env.local`:**
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# NextAuth Secret (สำคัญ!)
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars
# หรือ
JWT_SECRET=your-jwt-secret-key-min-32-chars

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**เอกสาร:** [docs/authentication/GOOGLE_OAUTH_SETUP.md](./docs/authentication/GOOGLE_OAUTH_SETUP.md)

---

### 3. ✅ Restart Backend Server

**สถานะ:** ⚠️ ต้องทำหลังจากแก้ไข `.env.local`

**สิ่งที่ต้องทำ:**
- [ ] หยุด backend server (ถ้ารันอยู่)
- [ ] รัน backend server ใหม่:
  ```bash
  cd apps/backend
  npm run dev
  ```
- [ ] ตรวจสอบว่า backend รันที่ port 3001

---

### 4. ✅ ทดสอบ Google Login

**สถานะ:** ⚠️ ต้องทดสอบ

**สิ่งที่ต้องทำ:**
- [ ] เปิดเบราว์เซอร์ไปที่ `http://localhost:3000/login`
- [ ] คลิกปุ่ม "เข้าสู่ระบบด้วย Google"
- [ ] ตรวจสอบว่า redirect ไปยัง Google login page
- [ ] Login ด้วย Google account
- [ ] ตรวจสอบว่า redirect กลับมาที่ `/profile` หรือหน้าที่กำหนด

**ถ้ามีปัญหา:**
- ดู [docs/authentication/GOOGLE_LOGIN_GUIDE.md](./docs/authentication/GOOGLE_LOGIN_GUIDE.md) - ส่วน Troubleshooting

---

## 📋 Checklist สรุป

- [x] แก้ไข Callback URL ใน Google Cloud Console เป็น `http://localhost:3001/api/auth/callback/google`
- [x] ตรวจสอบ Environment Variables ใน `.env.local`
- [ ] Restart backend server
- [ ] ทดสอบ Google Login

---

## 📚 เอกสารที่เกี่ยวข้อง

- [docs/authentication/GOOGLE_OAUTH_SETUP.md](./docs/authentication/GOOGLE_OAUTH_SETUP.md) - วิธีตั้งค่า Google OAuth
- [docs/authentication/GOOGLE_LOGIN_GUIDE.md](./docs/authentication/GOOGLE_LOGIN_GUIDE.md) - คู่มือติดตั้ง Google Login
- [docs/authentication/FIX_CALLBACK_URL.md](./docs/authentication/FIX_CALLBACK_URL.md) - แก้ไข Callback URL
- [docs/setup/SETUP.md](./docs/setup/SETUP.md) - คู่มือการติดตั้งโปรเจกต์

---

## 🎯 เป้าหมาย

หลังจากทำครบทุกขั้นตอน:
- ✅ Google Login ทำงานได้ปกติ
- ✅ User สามารถ login ด้วย Google account ได้
- ✅ ระบบสร้าง user ใน database อัตโนมัติ
- ✅ User สามารถเข้าถึงหน้า profile ได้
