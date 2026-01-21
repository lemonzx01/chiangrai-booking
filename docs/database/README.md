# 🗄️ Database

เอกสารเกี่ยวกับ Database และ Migrations

## 📄 เอกสารในหมวดนี้

- [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) - คู่มือการ Migration Database
  - Schema Overview
  - Migration Files
  - การรัน Migrations
  - Rollback

- [RUN_MIGRATIONS.md](./RUN_MIGRATIONS.md) - วิธีรัน Database Migrations
  - Prerequisites
  - ขั้นตอนการรัน
  - Troubleshooting

## 📁 ไฟล์ที่เกี่ยวข้อง

- `supabase/schema.sql` - Database Schema
- `supabase/seed-data.sql` - Seed Data
- `supabase/migrations/` - Migration Files

## 🎯 Quick Start

1. **สำหรับ Production Mode:** อ่าน [RUN_MIGRATIONS.md](./RUN_MIGRATIONS.md) เพื่อรัน migrations
2. **เข้าใจโครงสร้าง:** ดู [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) เพื่อเข้าใจโครงสร้าง database

## ⚠️ หมายเหตุ

- **Mock Mode:** ไม่ต้องรัน migrations - ระบบจะใช้ mock data อัตโนมัติ
- **Production Mode:** ต้องรัน migrations ก่อนใช้งาน
- ดู [SETUP.md](../setup/SETUP.md) สำหรับรายละเอียดเพิ่มเติม
