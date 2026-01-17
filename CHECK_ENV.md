# 🔍 วิธีตรวจสอบ Environment Variables

## 📍 ตำแหน่งไฟล์ `.env.local`

ไฟล์ `.env.local` ควรอยู่ที่:
- **Root directory**: `d:\code\try-doing-work\chiangrai-booking\.env.local`
- **Backend directory**: `d:\code\try-doing-work\chiangrai-booking\apps\backend\.env.local`

---

## 🔍 วิธีตรวจสอบ

### วิธีที่ 1: เปิดไฟล์ใน Editor

1. เปิด VS Code หรือ Editor ที่ใช้
2. เปิดไฟล์ `.env.local` ที่ root directory
3. ตรวจสอบว่ามีตัวแปรเหล่านี้:

```bash
# Google OAuth (คุณมีแล้ว)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# NextAuth Secret (สำคัญ! ต้องมี)
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars
# หรือ
JWT_SECRET=your-jwt-secret-key-min-32-chars

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Service (Optional - สำหรับ Forgot Password)
RESEND_API_KEY=re_your-resend-api-key
```

### วิธีที่ 2: ใช้ Terminal (PowerShell)

```powershell
# ตรวจสอบที่ root
cd d:\code\try-doing-work\chiangrai-booking
Get-Content .env.local

# หรือตรวจสอบที่ backend
cd d:\code\try-doing-work\chiangrai-booking\apps\backend
Get-Content .env.local
```

---

## ✅ สิ่งที่ต้องตรวจสอบ

### 1. `GOOGLE_CLIENT_ID` และ `GOOGLE_CLIENT_SECRET`
- ✅ คุณบอกว่ามีแล้ว
- ตรวจสอบว่า format ถูกต้อง:
  - `GOOGLE_CLIENT_ID` ควรจบด้วย `.apps.googleusercontent.com`
  - `GOOGLE_CLIENT_SECRET` ควรเป็น string ยาวๆ

### 2. `NEXTAUTH_SECRET` หรือ `JWT_SECRET` ⚠️
- **ต้องมีอย่างใดอย่างหนึ่ง** (หรือทั้งสองก็ได้)
- **ต้องมีความยาวอย่างน้อย 32 ตัวอักษร**
- ตัวอย่าง:
  ```bash
  NEXTAUTH_SECRET=my-super-secret-key-minimum-32-characters-long
  # หรือ
  JWT_SECRET=development-secret-key-12345678901234567890
  ```

### 3. `NEXT_PUBLIC_APP_URL`
- ควรเป็น: `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### 4. `RESEND_API_KEY` (Optional)
- **ไม่บังคับ** แต่แนะนำให้มีสำหรับ Forgot Password feature
- ถ้าไม่มี: ระบบจะยังทำงานได้ แต่จะไม่ส่งอีเมล (จะ log warning)
- วิธีสร้าง:
  1. ไปที่ https://resend.com
  2. สร้าง account และ API key
  3. คัดลอก API key มาใส่ใน `.env.local`

---

## 🔧 ถ้ายังไม่มี `NEXTAUTH_SECRET` หรือ `JWT_SECRET`

### สร้าง Secret Key ใหม่:

**วิธีที่ 1: ใช้ Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**วิธีที่ 2: ใช้ Online Generator**
- ไปที่ https://generate-secret.vercel.app/32
- คัดลอก secret ที่ได้มา

**วิธีที่ 3: ใช้ค่าคงที่ (สำหรับ Development)**
```bash
NEXTAUTH_SECRET=development-secret-key-minimum-32-characters-long-for-local-dev
```

### เพิ่มใน `.env.local`:

```bash
# เพิ่มบรรทัดนี้ใน .env.local
NEXTAUTH_SECRET=your-generated-secret-key-here-min-32-chars
```

---

## 📝 ตัวอย่าง `.env.local` ที่สมบูรณ์

```bash
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz

# NextAuth Secret (สำคัญ!)
NEXTAUTH_SECRET=development-secret-key-minimum-32-characters-long-for-local-dev

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT Secret (ถ้ามี)
JWT_SECRET=development-secret-key-12345678901234567890

# Email Service (Optional - สำหรับ Forgot Password)
# ถ้าไม่มี: ระบบจะยังทำงานได้ แต่จะไม่ส่งอีเมล
RESEND_API_KEY=re_your-resend-api-key-here
```

---

## ⚠️ หมายเหตุ

- ไฟล์ `.env.local` อาจจะซ่อนอยู่ (hidden file)
- ใน VS Code: กด `Ctrl+Shift+P` → พิมพ์ "Show Hidden Files"
- หรือเปิด File Explorer → View → Show hidden files

---

## ✅ หลังจากตรวจสอบแล้ว

1. ถ้ามีครบทุกตัว → ไปขั้นตอนถัดไป (Restart Backend Server)
2. ถ้ายังไม่มี `NEXTAUTH_SECRET` หรือ `JWT_SECRET` → สร้างใหม่ตามวิธีด้านบน
3. หลังจากเพิ่ม/แก้ไข → **ต้อง Restart Backend Server**
