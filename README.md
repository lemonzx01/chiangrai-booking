# 🌏 Got Journey Thailand - Travel Booking Platform

Next.js fullstack application สำหรับจองแพ็คเกจท่องเที่ยว รถเช่า และที่พัก

## ✨ Features

- 🏨 **Hotel Booking** - จองแพ็คเกจที่พักพร้อมรถเช่า
- 🚗 **Car Rental** - เช่ารถหรูสำหรับทริป
- 💳 **Payment Integration** - ระบบชำระเงินผ่าน Stripe (รองรับ PayPal, Credit Card, PromptPay)
- 🌐 **Multi-language** - รองรับภาษาไทยและอังกฤษ
- 🔐 **Admin Dashboard** - ระบบจัดการหลังบ้าน
- 📧 **Email Notifications** - แจ้งเตือนผ่าน email

## 🛠 Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TailwindCSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT (jose)
- **Payment:** Stripe
- **Email:** Resend
- **Deployment:** Vercel

## 🚀 Local Development

### 1. Clone Repository

\`\`\`bash
git clone <repository-url>
cd chiangrai-booking
\`\`\`

### 2. ติดตั้ง Dependencies

\`\`\`bash
# ติดตั้ง dependencies ทั้งหมด
npm install

# หรือติดตั้งแยกตาม app
cd apps/backend && npm install
cd ../frontend && npm install
\`\`\`

### 3. ตั้งค่า Environment Variables

#### สำหรับ Mock Mode (Development/Demo - แนะนำ)

สร้างไฟล์ \`apps/backend/.env.local\`:

\`\`\`bash
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT Secret (ต้องมีความยาวอย่างน้อย 32 ตัวอักษร)
JWT_SECRET=development-secret-key-minimum-32-characters-long

# ไม่ต้องใส่ Supabase keys (จะใช้ Mock Mode อัตโนมัติ)
# NEXT_PUBLIC_SUPABASE_URL=  # ปล่อยว่างหรือไม่ใส่เลย
\`\`\`

#### สำหรับ Production Mode (Supabase)

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# Stripe (optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# Email (optional)
RESEND_API_KEY=re_...
\`\`\`

### 4. Setup Database (สำหรับ Production Mode เท่านั้น)

1. สร้าง Supabase project
2. รัน SQL จาก \`supabase/schema.sql\`
3. สร้าง Admin user:

\`\`\`sql
-- สร้าง password hash
-- node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10))"

INSERT INTO admins (email, password_hash, name, role, is_active)
VALUES (
  'admin@gotjourneythailand.com',
  '$2a$10$xxx...your-hash-here',
  'Admin',
  'super_admin',
  true
);
\`\`\`

### 5. รัน Development Server

\`\`\`bash
# รัน backend (port 3001)
cd apps/backend
npm run dev

# รัน frontend (port 3000) - ใน terminal อื่น
cd apps/frontend
npm run dev
\`\`\`

เปิดเบราว์เซอร์ที่:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001](http://localhost:3001)

### 6. Test Credentials (Mock Mode)

เมื่อใช้ Mock Mode สามารถใช้ credentials เหล่านี้:

- **Admin:** `admin@gotjourneythailand.com` / `admin123`
- **User:** `user@example.com` / `user123` หรือ `validUserPass123`
- **Partner:** `hotel@example.com` / `user123`

## 📁 Project Structure

\`\`\`
chiangrai-booking/
├── apps/
│   ├── backend/             # Backend API (Next.js API Routes)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   └── api/     # API endpoints
│   │   │   ├── lib/         # Utilities, auth, validations
│   │   │   └── services/    # Email, notifications
│   │   └── .env.local       # Environment variables
│   │
│   └── frontend/            # Frontend (Next.js App Router)
│       ├── src/
│       │   ├── app/
│       │   │   ├── (frontend)/  # Public pages
│       │   │   ├── (admin)/     # Admin panel
│       │   │   └── (partner)/   # Partner dashboard
│       │   ├── components/     # React components
│       │   ├── hooks/           # Custom hooks
│       │   ├── lib/             # API client, utils
│       │   └── i18n/            # Translations
│       └── .env.local
│
├── packages/
│   └── shared/              # Shared types & utilities
│       ├── types/           # TypeScript types
│       └── utils.ts
│
├── supabase/
│   ├── schema.sql           # Database schema
│   ├── migrations/          # Database migrations
│   └── seed-data.sql        # Seed data
│
├── docs/                    # Documentation
│   ├── authentication/      # Auth guides
│   ├── database/            # Database docs
│   ├── payment/             # Payment docs
│   └── setup/               # Setup guides
│
└── testsprite_tests/        # TestSprite test files
\`\`\`

## 🔐 Admin Access

- **URL:** \`/admin/login\`
- **Mock Mode Credentials:** `admin@gotjourneythailand.com` / `admin123`
- **Production Mode:** ดูใน database (ตาราง \`admins\`)
- **Features:**
  - Dashboard with statistics
  - Manage hotels & packages
  - Manage cars
  - View & update bookings
  - View customer data
  - Payment management

## 🌐 API Endpoints

### Public APIs
- \`GET /api/hotels\` - List all hotels
- \`GET /api/hotels/[id]\` - Hotel detail
- \`GET /api/cars\` - List all cars
- \`GET /api/cars/[id]\` - Car detail
- \`POST /api/bookings\` - Create booking
- \`GET /api/bookings/[code]\` - Get booking by code
- \`POST /api/checkout\` - Create payment session
- \`GET /api/payments\` - Get payment history (Admin only)
- \`GET /api/payments/stats\` - Get payment statistics (Admin only)

### Admin APIs (Protected)
- \`POST /api/admin/login\` - Admin login
- \`GET /api/admin/auth\` - Check auth status
- \`POST /api/hotels\` - Create hotel
- \`PUT /api/hotels/[id]\` - Update hotel
- \`DELETE /api/hotels/[id]\` - Delete hotel
- (Similar for cars and bookings)

## 🧪 Testing

### Test API Endpoints
\`\`\`bash
# Hotels API
curl http://localhost:3001/api/hotels

# Cars API
curl http://localhost:3001/api/cars

# User Login (Mock Mode)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user123"}'
\`\`\`

### Test Admin Login
1. Go to \`http://localhost:3000/admin/login\`
2. Enter credentials:
   - **Mock Mode:** `admin@gotjourneythailand.com` / `admin123`
   - **Production:** ใช้ credentials จาก database
3. Should redirect to \`/admin/dashboard\`

### TestSprite Tests

โปรเจคนี้ใช้ TestSprite สำหรับ automated testing:

- **Test Files:** `testsprite_tests/`
- **Test Report:** `testsprite_tests/testsprite-mcp-test-report.html`
- **Status:** 8/10 tests passing (80%)

ดูรายละเอียดเพิ่มเติมใน [testsprite_tests/TEST_FAILURE_ANALYSIS.md](./testsprite_tests/TEST_FAILURE_ANALYSIS.md)

## 💳 Payment System

### Features
- รองรับ PayPal, Credit Card, และ PromptPay
- รองรับหลายสกุลเงิน (THB, USD, EUR, JPY, CNY, GBP)
- Database สำหรับอัตราแลกเปลี่ยน
- Payment History สำหรับ Admin
- Error Handling และ Security

### Documentation
- [Setup Guide](docs/setup/SETUP.md) - คู่มือการติดตั้งและใช้งาน
- [Payment Setup Guide](docs/payment/PAYMENT_SETUP.md) - วิธีตั้งค่า Stripe
- [Payment API Documentation](docs/payment/PAYMENT_API.md) - API documentation
- [Payment Testing Guide](docs/payment/PAYMENT_TESTING.md) - คู่มือการทดสอบ
- [Google OAuth Setup](docs/authentication/GOOGLE_OAUTH_SETUP.md) - วิธีตั้งค่า Google OAuth
- [Database Migration](docs/database/DATABASE_MIGRATION.md) - คู่มือการ migrate database
- [Product Specification](docs/development/PRODUCT_SPECIFICATION.md) - Product Specification Document
- [Check Mock Mode](docs/setup/CHECK_MOCK_MODE.md) - วิธีตรวจสอบ Mock Mode
- [Environment Variables Check](docs/setup/ENV_CHECK.md) - ตรวจสอบ Environment Variables

### Quick Start
1. ตั้งค่า Stripe Account (ดู [PAYMENT_SETUP.md](docs/PAYMENT_SETUP.md))
2. Enable PayPal ใน Stripe Dashboard
3. ตั้งค่า Webhook endpoint
4. ตั้งค่า Environment Variables
5. รัน migration สำหรับ exchange_rates table

## 📦 Deployment

ดูรายละเอียดใน [DEPLOYMENT.md](../DEPLOYMENT.md)

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: \`git checkout -b feature/my-feature\`
3. Commit changes: \`git commit -am 'Add feature'\`
4. Push to branch: \`git push origin feature/my-feature\`
5. Submit Pull Request

## 📝 License

MIT License - see LICENSE file

## 📞 Support

- Email: support@gotjourneythailand.com
- Documentation: /docs
- Issues: GitHub Issues

---

Made with ❤️ by Got Journey Thailand Team
\`\`\`
