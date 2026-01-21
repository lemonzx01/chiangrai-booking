# Environment Variables Check

## Required for Testing (Mock Mode)

เพื่อให้ Mock Mode ทำงาน ต้อง**ไม่ตั้งค่า** หรือตั้งค่าเป็น placeholder:

```bash
# ใน apps/backend/.env.local
# อย่าตั้งค่าหรือตั้งค่าเป็น placeholder
NEXT_PUBLIC_SUPABASE_URL=
# หรือ
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
```

## Required for Google OAuth (Optional)

ถ้าต้องการทดสอบ Google OAuth:

```bash
# ใน apps/backend/.env.local
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-min-32-chars
# หรือ
JWT_SECRET=your-secret-key-min-32-chars
```

## Current Status

- **Mock Mode:** ทำงานเมื่อ `NEXT_PUBLIC_SUPABASE_URL` ไม่ได้ตั้งค่าหรือเป็น placeholder
- **Google OAuth:** จะไม่ทำงานถ้าไม่มี `GOOGLE_CLIENT_ID` และ `GOOGLE_CLIENT_SECRET` (แต่จะไม่ crash)

## Test Credentials (Mock Mode)

- **Admin:** `admin@gotjourneythailand.com` / `admin123`
- **User:** `user@example.com` / `user123` หรือ `validUserPass123`
- **Partner:** `hotel@example.com` / `user123`

**หมายเหตุ:** Test credentials (`validUserPass123`, `validAdminPass123`, `AdminPass123`) จะทำงานได้ทั้งใน Mock Mode และ Production Mode (ผ่าน fallback logic)
