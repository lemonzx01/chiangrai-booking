# 🌏 Got Journey Thailand - Travel Booking Platform

Next.js fullstack application สำหรับจองแพ็คเกจท่องเที่ยว รถเช่า และที่พัก

## ✨ Features

- 🏨 **Hotel Booking** - จองแพ็คเกจที่พักพร้อมรถเช่า
- 🚗 **Car Rental** - เช่ารถหรูสำหรับทริป
- 💳 **Payment Integration** - ระบบชำระเงินผ่าน Stripe (รองรับ PayPal, Credit Card, PromptPay)
- 🌐 **Multi-language** - รองรับภาษาไทยและอังกฤษ
- 🔐 **Admin Dashboard** - ระบบจัดการหลังบ้าน
- 📧 **Email Notifications** - แจ้งเตือนผ่าน email
- 📱 **LINE Notify** - แจ้งเตือนผ่าน LINE

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
cd chiangrai-booking/nextjs-app
\`\`\`

### 2. ติดตั้ง Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ \`.env.local\`:

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

# Email (optional)
RESEND_API_KEY=re_...

# LINE (optional)
LINE_NOTIFY_TOKEN=your-token
\`\`\`

### 4. Setup Database

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
npm run dev
\`\`\`

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

\`\`\`
nextjs-app/
├── src/
│   ├── app/
│   │   ├── (frontend)/      # หน้าเว็บหลัก
│   │   │   ├── page.tsx     # Home
│   │   │   ├── hotels/      # Hotels listing & detail
│   │   │   ├── cars/        # Cars listing
│   │   │   ├── booking/     # Booking form
│   │   │   └── success/     # Success page
│   │   │
│   │   ├── (admin)/         # Admin panel
│   │   │   └── admin/
│   │   │       ├── login/   # Admin login
│   │   │       ├── dashboard/
│   │   │       ├── hotels/  # Manage hotels
│   │   │       ├── cars/    # Manage cars
│   │   │       └── bookings/ # Manage bookings
│   │   │
│   │   └── api/             # Backend APIs
│   │       ├── hotels/      # Hotels CRUD
│   │       ├── cars/        # Cars CRUD
│   │       ├── bookings/    # Bookings CRUD
│   │       ├── checkout/    # Payment
│   │       └── admin/       # Admin auth
│   │
│   ├── components/
│   │   ├── cards/           # Reusable cards
│   │   ├── forms/           # Form components
│   │   ├── shared/          # Navbar, Footer
│   │   └── ui/              # UI components
│   │
│   ├── hooks/
│   │   ├── useAuth.ts       # Authentication
│   │   └── useLocalize.ts   # i18n helper
│   │
│   ├── lib/
│   │   ├── supabase/        # Database client
│   │   ├── stripe.ts        # Payment
│   │   └── utils.ts         # Utilities
│   │
│   └── i18n/                # Translations
│       └── locales/
│           ├── en/
│           └── th/
│
└── supabase/
    └── schema.sql           # Database schema
\`\`\`

## 🔐 Admin Access

- **URL:** \`/admin/login\`
- **Default:** ดูใน database (ตาราง \`admins\`)
- **Features:**
  - Dashboard with statistics
  - Manage hotels & packages
  - Manage cars
  - View & update bookings
  - View customer data

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

### Test Frontend
\`\`\`bash
# Home page
curl http://localhost:3000

# Hotels API
curl http://localhost:3000/api/hotels

# Cars API
curl http://localhost:3000/api/cars
\`\`\`

### Test Admin Login
1. Go to \`http://localhost:3000/admin/login\`
2. Enter credentials
3. Should redirect to \`/admin/dashboard\`

## 💳 Payment System

### Features
- รองรับ PayPal, Credit Card, และ PromptPay
- รองรับหลายสกุลเงิน (THB, USD, EUR, JPY, CNY, GBP)
- Database สำหรับอัตราแลกเปลี่ยน
- Payment History สำหรับ Admin
- Error Handling และ Security

### Documentation
- [Payment Setup Guide](docs/PAYMENT_SETUP.md) - วิธีตั้งค่า Stripe
- [Payment API Documentation](docs/PAYMENT_API.md) - API documentation
- [Payment Testing Guide](docs/PAYMENT_TESTING.md) - คู่มือการทดสอบ

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
