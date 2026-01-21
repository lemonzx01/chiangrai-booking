# Got Journey Thailand - File Structure Guide

**อัพเดทล่าสุด:** โครงสร้าง Monorepo - แยก Frontend และ Backend

## โครงสร้างโฟลเดอร์หลัก

```
chiangrai-booking/
├── apps/
│   ├── backend/            # Backend API (Next.js API Routes)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   └── api/    # API endpoints
│   │   │   ├── lib/        # Utilities, auth, validations
│   │   │   └── services/   # Email, notifications
│   │   └── .env.local      # Environment variables
│   │
│   └── frontend/           # Frontend (Next.js App Router)
│       ├── src/
│       │   ├── app/        # Pages (frontend, admin, partner)
│       │   ├── components/ # React components
│       │   ├── hooks/      # Custom hooks
│       │   ├── lib/        # API client, utils
│       │   └── i18n/       # Translations
│       └── .env.local
│
├── packages/
│   └── shared/             # Shared types & utilities
│       ├── types/          # TypeScript types
│       └── utils.ts
│
├── supabase/
│   ├── schema.sql          # Database schema
│   ├── migrations/         # Database migrations
│   └── seed-data.sql       # Seed data
│
├── docs/                   # Documentation
├── testsprite_tests/       # TestSprite test files
└── tests/                  # Test files
```

---

## 📄 หน้าเว็บ (Pages)

### Frontend (หน้าสำหรับลูกค้า)

| หน้า | ไฟล์ | URL |
|------|------|-----|
| **หน้าแรก** | `apps/frontend/src/app/(frontend)/page.tsx` | `/` |
| **หน้าแรก (Client)** | `apps/frontend/src/app/(frontend)/HomeClient.tsx` | `/` |
| **แพ็คเกจทริป** | `apps/frontend/src/app/(frontend)/hotels/page.tsx` | `/hotels` |
| **รายละเอียดแพ็คเกจ** | `apps/frontend/src/app/(frontend)/hotels/[id]/page.tsx` | `/hotels/[id]` |
| **รถเช่า** | `apps/frontend/src/app/(frontend)/cars/page.tsx` | `/cars` |
| **รายละเอียดรถ** | `apps/frontend/src/app/(frontend)/cars/[id]/page.tsx` | `/cars/[id]` |
| **ติดต่อเรา** | `apps/frontend/src/app/(frontend)/contact/page.tsx` | `/contact` |
| **จองสินค้า** | `apps/frontend/src/app/(frontend)/booking/page.tsx` | `/booking` |
| **จองสำเร็จ** | `apps/frontend/src/app/(frontend)/success/page.tsx` | `/success` |

### Admin (หน้าสำหรับแอดมิน)

| หน้า | ไฟล์ | URL |
|------|------|-----|
| **Login** | `apps/frontend/src/app/(admin)/admin/login/page.tsx` | `/admin/login` |
| **Dashboard** | `apps/frontend/src/app/(admin)/admin/dashboard/page.tsx` | `/admin/dashboard` |
| **จัดการแพ็คเกจ** | `apps/frontend/src/app/(admin)/admin/hotels/page.tsx` | `/admin/hotels` |
| **จัดการรถ** | `apps/frontend/src/app/(admin)/admin/cars/page.tsx` | `/admin/cars` |
| **จัดการการจอง** | `apps/frontend/src/app/(admin)/admin/bookings/page.tsx` | `/admin/bookings` |
| **จัดการการชำระเงิน** | `apps/frontend/src/app/(admin)/admin/payments/page.tsx` | `/admin/payments` |

---

## 🧩 Components

### Shared (ใช้ร่วมกัน)

| Component | ไฟล์ | ใช้ที่ |
|-----------|------|-------|
| **Navbar** | `src/components/shared/Navbar.tsx` | ทุกหน้า frontend |
| **Footer** | `src/components/shared/Footer.tsx` | ทุกหน้า frontend |
| **Language Switcher** | `src/components/shared/LanguageSwitcher.tsx` | Navbar |

### Cards

| Component | ไฟล์ | ใช้ที่ |
|-----------|------|-------|
| **Hotel Card** | `src/components/cards/HotelCard.tsx` | หน้า hotels, หน้าแรก |
| **Car Card** | `src/components/cards/CarCard.tsx` | หน้า cars, หน้าแรก |

### Admin

| Component | ไฟล์ | ใช้ที่ |
|-----------|------|-------|
| **Sidebar** | `src/components/admin/Sidebar.tsx` | ทุกหน้า admin |

### UI (Basic UI Components)

| Component | ไฟล์ |
|-----------|------|
| Button | `src/components/ui/Button.tsx` |
| Card | `src/components/ui/Card.tsx` |
| Input | `src/components/ui/Input.tsx` |
| Badge | `src/components/ui/Badge.tsx` |
| Skeleton | `src/components/ui/Skeleton.tsx` |
| DatePicker | `src/components/ui/CustomDatePicker.tsx` |

---

## ⚙️ Config และ Utilities

| ไฟล์ | หน้าที่ |
|------|--------|
| `src/lib/constants.ts` | **ค่าคงที่ทั้งหมด** - ชื่อแอป, เมนู, ข้อมูลติดต่อ, Mock Data |
| `src/lib/stripe.ts` | เชื่อมต่อ Stripe สำหรับชำระเงิน |
| `src/lib/supabase/client.ts` | Supabase Client (Browser) |
| `src/lib/supabase/server.ts` | Supabase Client (Server) |
| `src/lib/utils.ts` | Helper functions |
| `src/lib/validations.ts` | Validation schemas (Zod) |

---

## 🌐 API Routes

| API | ไฟล์ | Method | หน้าที่ |
|-----|------|--------|--------|
| Hotels | `apps/backend/src/app/api/hotels/route.ts` | GET, POST | ดึง/สร้างแพ็คเกจ |
| Hotel Detail | `apps/backend/src/app/api/hotels/[id]/route.ts` | GET, PUT, DELETE | จัดการแพ็คเกจ |
| Cars | `apps/backend/src/app/api/cars/route.ts` | GET, POST | ดึง/สร้างรถ |
| Car Detail | `apps/backend/src/app/api/cars/[id]/route.ts` | GET, PUT, DELETE | จัดการรถ |
| Bookings | `apps/backend/src/app/api/bookings/route.ts` | GET, POST | ดึง/สร้างการจอง |
| Booking Detail | `apps/backend/src/app/api/bookings/[code]/route.ts` | GET, PUT | จัดการการจอง |
| Checkout | `apps/backend/src/app/api/checkout/route.ts` | POST | สร้าง Stripe session |
| Stripe Webhook | `apps/backend/src/app/api/webhook/stripe/route.ts` | POST | รับ callback จาก Stripe |
| Auth Login | `apps/backend/src/app/api/auth/login/route.ts` | POST | เข้าสู่ระบบ (User/Admin) |
| Auth Register | `apps/backend/src/app/api/auth/register/route.ts` | POST | สมัครสมาชิก |
| Admin Login | `apps/backend/src/app/api/admin/login/route.ts` | POST | เข้าสู่ระบบแอดมิน |
| Admin Auth | `apps/backend/src/app/api/admin/auth/route.ts` | GET | ตรวจสอบสถานะ login |

---

## 🌍 ภาษา (i18n)

| ไฟล์ | หน้าที่ |
|------|--------|
| `src/i18n/locales/th/common.json` | ข้อความภาษาไทย |
| `src/i18n/locales/en/common.json` | ข้อความภาษาอังกฤษ |
| `src/i18n/client.tsx` | i18n Provider |
| `src/i18n/index.ts` | i18n Config |

---

## 🎨 Layout Files

| ไฟล์ | หน้าที่ |
|------|--------|
| `src/app/layout.tsx` | **Root Layout** - Font, Metadata หลัก |
| `src/app/(frontend)/layout.tsx` | Layout สำหรับหน้า frontend (มี Navbar, Footer) |
| `src/app/(admin)/layout.tsx` | Layout สำหรับหน้า admin (มี Sidebar) |
| `src/app/globals.css` | Global CSS + Tailwind |

---

## 🔧 Config Files (Root)

| ไฟล์ | หน้าที่ |
|------|--------|
| `package.json` | Dependencies และ Scripts |
| `next.config.mjs` | Next.js Config |
| `tailwind.config.ts` | Tailwind CSS Config |
| `tsconfig.json` | TypeScript Config |
| `.env.example` | ตัวอย่าง Environment Variables |
| `middleware.ts` | Next.js Middleware (Auth check) |

---

## 📝 วิธีแก้ไขชื่อแบรนด์

ถ้าต้องการเปลี่ยนชื่อแบรนด์ ให้แก้ไฟล์เหล่านี้:

1. **`src/lib/constants.ts`** - APP_NAME, CONTACT_INFO, SOCIAL_LINKS
2. **`src/app/layout.tsx`** - metadata title
3. **`src/components/shared/Navbar.tsx`** - Logo text
4. **`src/components/shared/Footer.tsx`** - Footer brand name
5. **`src/components/admin/Sidebar.tsx`** - Admin sidebar brand

---

## 🚀 คำสั่งที่ใช้บ่อย

```bash
# รัน Development Server (Backend - port 3001)
cd apps/backend
npm run dev

# รัน Development Server (Frontend - port 3000)
cd apps/frontend
npm run dev

# Build สำหรับ Production
cd apps/backend && npm run build
cd apps/frontend && npm run build

# ตรวจสอบ ESLint
cd apps/backend && npm run lint
cd apps/frontend && npm run lint
```

## 🧪 Test Credentials (Mock Mode)

เมื่อใช้ Mock Mode สามารถใช้ credentials เหล่านี้:

- **Admin:** `admin@gotjourneythailand.com` / `admin123`
- **User:** `user@example.com` / `user123` หรือ `validUserPass123`
- **Partner:** `hotel@example.com` / `user123`

**หมายเหตุ:** Test credentials (`validUserPass123`, `validAdminPass123`) จะทำงานได้ทั้งใน Mock Mode และ Production Mode (ผ่าน fallback logic)

## 📚 เอกสารที่เกี่ยวข้อง

- [README.md](./README.md) - ภาพรวมโปรเจกต์
- [CHANGELOG.md](./CHANGELOG.md) - สรุปการแก้ไขและอัพเดท
- [docs/setup/SETUP.md](./docs/setup/SETUP.md) - คู่มือการติดตั้ง
