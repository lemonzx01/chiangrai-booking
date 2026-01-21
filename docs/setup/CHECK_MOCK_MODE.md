# วิธีตรวจสอบ Mock Mode

## Mock Mode จะทำงานเมื่อ:

1. **ไม่มี** `NEXT_PUBLIC_SUPABASE_URL` ใน environment variables
2. หรือ `NEXT_PUBLIC_SUPABASE_URL` เป็น `https://placeholder.supabase.co`
3. หรือ `NEXT_PUBLIC_SUPABASE_URL` เป็น string ว่าง `""`

## ตรวจสอบ Mock Mode

### วิธีที่ 1: ตรวจสอบจาก Logs

เมื่อ backend server start ขึ้นมา ให้ดู logs:

```
[DEBUG] NextAuth Module Load: { ... }
```

ถ้าเห็น `isMockMode: true` แสดงว่า Mock Mode ทำงาน

### วิธีที่ 2: ทดสอบ API

```bash
# ทดสอบ login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user123"}'

# ควรได้ response 200 และ cookie user_token
```

### วิธีที่ 3: ตรวจสอบ Environment Variables

```bash
# ใน PowerShell
cd apps/backend
Get-Content .env.local | Select-String "SUPABASE"
```

ถ้าไม่มี `NEXT_PUBLIC_SUPABASE_URL` หรือเป็น placeholder = Mock Mode ทำงาน

## Test Credentials (Mock Mode)

- **Admin:** `admin@gotjourneythailand.com` / `admin123`
- **User:** `user@example.com` / `user123` หรือ `validUserPass123`
- **Partner:** `hotel@example.com` / `user123`

**หมายเหตุ:** Test credentials (`validUserPass123`, `validAdminPass123`, `AdminPass123`) จะทำงานได้ทั้งใน Mock Mode และ Production Mode (ผ่าน fallback logic ใน `apps/backend/src/app/api/auth/login/route.ts`)

## Troubleshooting

### ถ้า Mock Mode ไม่ทำงาน:

1. ตรวจสอบว่าไม่มี `NEXT_PUBLIC_SUPABASE_URL` ใน `.env.local`
2. Restart backend server
3. ตรวจสอบ logs ว่า `isMockMode()` return `true`

### ถ้า Login ไม่ทำงาน:

1. ตรวจสอบ password hash ใน `apps/backend/src/lib/mock-data.ts`
2. ตรวจสอบว่า mock user มี `password_hash` ที่ถูกต้อง
3. ตรวจสอบว่า `isMockMode()` return `true`
