# 🚀 วิธีรัน Database Migrations (Quick Guide)

## วิธีที่ 1: ใช้ไฟล์รวม (แนะนำ - ง่ายที่สุด)

1. **เปิด Supabase Dashboard**
   - ไปที่ [https://app.supabase.com](https://app.supabase.com)
   - เลือก Project ของคุณ

2. **เปิด SQL Editor**
   - คลิก "SQL Editor" ในเมนูด้านซ้าย
   - คลิก "New Query"

3. **Copy & Paste**
   - เปิดไฟล์ `supabase/migrations/RUN_ALL_MIGRATIONS.sql`
   - คัดลอกเนื้อหาทั้งหมด (Ctrl+A, Ctrl+C)
   - วางใน SQL Editor (Ctrl+V)

4. **รัน Migration**
   - คลิก "Run" หรือกด `Ctrl+Enter`
   - รอให้เสร็จ (ประมาณ 1-2 วินาที)

5. **ตรวจสอบผลลัพธ์**
   - ไปที่ "Table Editor"
   - ตรวจสอบว่ามี table `users` ปรากฏ
   - ตรวจสอบว่า `hotels` และ `cars` มี column `owner_id`

---

## วิธีที่ 2: รันทีละไฟล์

ถ้าต้องการรันทีละไฟล์:

1. **Migration 1:** `supabase/migrations/0006_add_users_table.sql`
2. **Migration 2:** `supabase/migrations/0007_migrate_partners_to_users.sql`

---

## ✅ ตรวจสอบผลลัพธ์

รัน SQL นี้ใน SQL Editor เพื่อตรวจสอบ:

```sql
-- ดู users ทั้งหมด
SELECT id, email, name, role, is_active FROM users ORDER BY created_at;

-- ดู partners ที่ migrate แล้ว
SELECT id, email, name, role FROM users WHERE role = 'partner';

-- ดู hotels ที่มี owner_id
SELECT id, name_th, owner_id FROM hotels WHERE owner_id IS NOT NULL LIMIT 10;

-- ดู cars ที่มี owner_id
SELECT id, name_th, owner_id FROM cars WHERE owner_id IS NOT NULL LIMIT 10;
```

---

## ⚠️ หมายเหตุ

- Migration ใช้ `IF NOT EXISTS` และ `ON CONFLICT DO NOTHING` แล้ว
- **ปลอดภัย** ต่อการรันซ้ำ (idempotent)
- ข้อมูลเดิมจะไม่หาย
- `partners` table ยังคงอยู่ (backward compatibility)

---

## 🐛 ถ้าเกิด Error

### Error: "relation 'users' already exists"
- ✅ **ไม่เป็นไร** - Migration ใช้ `IF NOT EXISTS` แล้ว
- ข้ามไปรันส่วนถัดไปได้เลย

### Error: "column 'owner_id' already exists"
- ✅ **ไม่เป็นไร** - Migration ตรวจสอบแล้ว
- ข้ามไปรันส่วนถัดไปได้เลย

### Error: "foreign key constraint violation"
- ตรวจสอบว่า Migration 1 รันสำเร็จก่อน
- ตรวจสอบว่ามี `users` table และมีข้อมูล partners ใน `users` table

---

## 📝 หลัง Migration เสร็จ

1. **ทดสอบ Login**
   - ลอง login ด้วย partner account
   - ตรวจสอบว่า redirect ไป `/partner/dashboard`

2. **ทดสอบ Partner Dashboard**
   - ตรวจสอบว่าเห็นเฉพาะรถ/โรงแรมของตัวเอง

3. **ทดสอบ Admin Dashboard**
   - ตรวจสอบว่าเห็นข้อมูลทั้งหมด

---

## 🔗 ไฟล์ที่เกี่ยวข้อง

- `supabase/migrations/RUN_ALL_MIGRATIONS.sql` - ไฟล์รวม (แนะนำ)
- `supabase/migrations/0006_add_users_table.sql` - Migration 1
- `supabase/migrations/0007_migrate_partners_to_users.sql` - Migration 2
- `DATABASE_MIGRATION.md` - คู่มือละเอียด
