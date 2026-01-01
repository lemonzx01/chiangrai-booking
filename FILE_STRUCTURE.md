# Got Journey Thailand - File Structure Guide

## โครงสร้างโฟลเดอร์หลัก

```
src/
├── app/                    # หน้าเว็บทั้งหมด (Next.js App Router)
├── components/             # Components ที่ใช้ซ้ำได้
├── hooks/                  # Custom React Hooks
├── i18n/                   # ไฟล์ภาษา (ไทย/อังกฤษ)
├── lib/                    # Utilities และ Config
├── services/               # Services (Email, Line)
├── styles/                 # CSS เพิ่มเติม
└── types/                  # TypeScript Types
```

---

## 📄 หน้าเว็บ (Pages)

### Frontend (หน้าสำหรับลูกค้า)

| หน้า | ไฟล์ | URL |
|------|------|-----|
| **หน้าแรก** | `src/app/(frontend)/page.tsx` | `/` |
| **หน้าแรก (Client)** | `src/app/(frontend)/HomeClient.tsx` | `/` |
| **แพ็คเกจทริป** | `src/app/(frontend)/hotels/page.tsx` | `/hotels` |
| **รายละเอียดแพ็คเกจ** | `src/app/(frontend)/hotels/[id]/page.tsx` | `/hotels/[id]` |
| **รถเช่า** | `src/app/(frontend)/cars/page.tsx` | `/cars` |
| **รายละเอียดรถ** | `src/app/(frontend)/cars/[id]/page.tsx` | `/cars/[id]` |
| **ติดต่อเรา** | `src/app/(frontend)/contact/page.tsx` | `/contact` |
| **จองสินค้า** | `src/app/(frontend)/booking/page.tsx` | `/booking` |
| **จองสำเร็จ** | `src/app/(frontend)/success/page.tsx` | `/success` |

### Admin (หน้าสำหรับแอดมิน)

| หน้า | ไฟล์ | URL |
|------|------|-----|
| **Login** | `src/app/(admin)/admin/login/page.tsx` | `/admin/login` |
| **Dashboard** | `src/app/(admin)/admin/dashboard/page.tsx` | `/admin/dashboard` |
| **จัดการแพ็คเกจ** | `src/app/(admin)/admin/hotels/page.tsx` | `/admin/hotels` |
| **จัดการรถ** | `src/app/(admin)/admin/cars/page.tsx` | `/admin/cars` |
| **จัดการการจอง** | `src/app/(admin)/admin/bookings/page.tsx` | `/admin/bookings` |

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
| Hotels | `src/app/api/hotels/route.ts` | GET, POST | ดึง/สร้างแพ็คเกจ |
| Hotel Detail | `src/app/api/hotels/[id]/route.ts` | GET, PUT, DELETE | จัดการแพ็คเกจ |
| Cars | `src/app/api/cars/route.ts` | GET, POST | ดึง/สร้างรถ |
| Car Detail | `src/app/api/cars/[id]/route.ts` | GET, PUT, DELETE | จัดการรถ |
| Bookings | `src/app/api/bookings/route.ts` | GET, POST | ดึง/สร้างการจอง |
| Booking Detail | `src/app/api/bookings/[code]/route.ts` | GET, PUT | จัดการการจอง |
| Checkout | `src/app/api/checkout/route.ts` | POST | สร้าง Stripe session |
| Stripe Webhook | `src/app/api/webhook/stripe/route.ts` | POST | รับ callback จาก Stripe |
| Admin Login | `src/app/api/admin/login/route.ts` | POST | เข้าสู่ระบบแอดมิน |
| Admin Auth | `src/app/api/admin/auth/route.ts` | GET | ตรวจสอบสถานะ login |

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
# รัน Development Server
npm run dev

# Build สำหรับ Production
npm run build

# รัน Production Server
npm start

# ตรวจสอบ ESLint
npm run lint
```
