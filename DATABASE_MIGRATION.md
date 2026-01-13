# 🗄️ Database Migration Guide - Multi-vendor System

คู่มือการอัพเดท Database สำหรับระบบ Multi-vendor และ Google Login

## 📋 Migration Files ที่ต้องรัน

มี 2 migration files ที่ต้องรันตามลำดับ:

1. **`0006_add_users_table.sql`** - สร้าง users table และ user_role enum
2. **`0007_migrate_partners_to_users.sql`** - migrate partners ไป users และเพิ่ม owner_id

---

## 🚀 วิธีรัน Migrations

### วิธีที่ 1: ใช้ Supabase Dashboard (แนะนำ)

1. **เปิด Supabase Dashboard**
   - ไปที่ [https://app.supabase.com](https://app.supabase.com)
   - เลือก Project ของคุณ

2. **เปิด SQL Editor**
   - คลิกที่ "SQL Editor" ในเมนูด้านซ้าย

3. **รัน Migration 1: สร้าง Users Table**
   - คลิก "New Query"
   - เปิดไฟล์ `supabase/migrations/0006_add_users_table.sql`
   - คัดลอกเนื้อหาทั้งหมด
   - วางใน SQL Editor
   - คลิก "Run" หรือกด `Ctrl+Enter`

4. **รัน Migration 2: Migrate Partners**
   - คลิก "New Query" อีกครั้ง
   - เปิดไฟล์ `supabase/migrations/0007_migrate_partners_to_users.sql`
   - คัดลอกเนื้อหาทั้งหมด
   - วางใน SQL Editor
   - คลิก "Run" หรือกด `Ctrl+Enter`

5. **ตรวจสอบผลลัพธ์**
   - ไปที่ "Table Editor"
   - ตรวจสอบว่ามี table `users` ปรากฏ
   - ตรวจสอบว่า `hotels` และ `cars` มี column `owner_id`

---

### วิธีที่ 2: ใช้ Supabase CLI (สำหรับ Advanced Users)

```bash
# ติดตั้ง Supabase CLI (ถ้ายังไม่มี)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# รัน migrations
supabase db push
```

---

## ✅ สิ่งที่ Migration จะทำ

### Migration 1: `0006_add_users_table.sql`

- ✅ สร้าง `user_role` enum (`admin`, `partner`, `user`)
- ✅ สร้าง `users` table พร้อม fields:
  - `id` (UUID)
  - `email` (unique)
  - `name`
  - `role` (user_role enum)
  - `google_id` (สำหรับ Google OAuth)
  - `password_hash` (สำหรับ email/password login)
  - `phone`
  - `is_active`
  - `created_at`, `updated_at`
- ✅ สร้าง indexes สำหรับ performance
- ✅ ตั้งค่า Row Level Security (RLS)

### Migration 2: `0007_migrate_partners_to_users.sql`

- ✅ Migrate ข้อมูลจาก `partners` table ไป `users` table (role='partner')
- ✅ เพิ่ม `owner_id` column ใน `hotels` table
- ✅ เพิ่ม `owner_id` column ใน `cars` table
- ✅ Migrate `partner_id` → `owner_id` (อัพเดทข้อมูลเดิม)
- ✅ สร้าง indexes สำหรับ `owner_id`

---

## 🔍 ตรวจสอบผลลัพธ์

### 1. ตรวจสอบ Users Table

```sql
-- ดู users ทั้งหมด
SELECT id, email, name, role, is_active FROM users;

-- ดู partners ที่ migrate แล้ว
SELECT id, email, name, role FROM users WHERE role = 'partner';
```

### 2. ตรวจสอบ Owner ID

```sql
-- ดู hotels ที่มี owner_id
SELECT id, name_th, owner_id FROM hotels WHERE owner_id IS NOT NULL;

-- ดู cars ที่มี owner_id
SELECT id, name_th, owner_id FROM cars WHERE owner_id IS NOT NULL;
```

### 3. ตรวจสอบ Foreign Key

```sql
-- ตรวจสอบว่า owner_id reference ไป users.id ถูกต้อง
SELECT 
  h.id as hotel_id,
  h.name_th,
  h.owner_id,
  u.email as owner_email,
  u.role as owner_role
FROM hotels h
LEFT JOIN users u ON h.owner_id = u.id
WHERE h.owner_id IS NOT NULL;
```

---

## ⚠️ หมายเหตุสำคัญ

1. **Backward Compatibility**
   - `partners` table ยังคงอยู่ (deprecated)
   - Code ยังรองรับ `partner_id` แต่ควรใช้ `owner_id` แทน

2. **Existing Data**
   - Migration จะ migrate ข้อมูลเดิมจาก `partners` ไป `users` อัตโนมัติ
   - `partner_id` ใน `hotels` และ `cars` จะถูก migrate ไป `owner_id`

3. **New Data**
   - หลังจาก migration แล้ว ควรใช้ `users` table และ `owner_id` เท่านั้น
   - ไม่ควรเพิ่มข้อมูลใหม่ใน `partners` table

---

## 🐛 Troubleshooting

### Error: "relation 'users' already exists"
- **สาเหตุ:** Migration 1 รันไปแล้ว
- **แก้ไข:** ข้าม Migration 1 ไปรัน Migration 2 เลย

### Error: "column 'owner_id' already exists"
- **สาเหตุ:** Migration 2 รันไปแล้ว
- **แก้ไข:** Migration ใช้ `IF NOT EXISTS` แล้ว ไม่มีปัญหา

### Error: "foreign key constraint violation"
- **สาเหตุ:** มี `owner_id` ที่ reference ไป `users.id` ที่ไม่มีอยู่
- **แก้ไข:** ตรวจสอบว่า migration 1 รันสำเร็จก่อน

### ไม่เห็นข้อมูลใน users table
- **สาเหตุ:** อาจยังไม่มี partners ในระบบ
- **แก้ไข:** สร้าง partner ใหม่ หรือ migrate ข้อมูล partners เอง

---

## 📝 หลัง Migration เสร็จ

1. **ทดสอบ Login**
   - ลอง login ด้วย Google OAuth
   - ลอง login ด้วย email/password

2. **ทดสอบ Partner Dashboard**
   - Login ด้วย partner account
   - ตรวจสอบว่าเห็นเฉพาะรถ/โรงแรมของตัวเอง

3. **ทดสอบ Admin Dashboard**
   - Login ด้วย admin account
   - ตรวจสอบว่าเห็นข้อมูลทั้งหมด

---

## 🔗 ไฟล์ที่เกี่ยวข้อง

- `supabase/migrations/0006_add_users_table.sql` - สร้าง users table
- `supabase/migrations/0007_migrate_partners_to_users.sql` - migrate partners
- `apps/backend/src/lib/auth/nextauth.ts` - NextAuth configuration
- `apps/backend/src/app/api/cars/route.ts` - Cars API with role filtering
- `apps/backend/src/app/api/hotels/route.ts` - Hotels API with role filtering
