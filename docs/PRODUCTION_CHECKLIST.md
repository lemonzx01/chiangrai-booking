# ✅ Production Go-Live Checklist

ตรวจสอบทีละข้อก่อน launch production — ติ๊ก ✅ เมื่อผ่านแล้ว

> 💡 **Tip:** พิมพ์เอกสารนี้เก็บไว้ หรือ copy ไปสร้าง GitHub Issue tracking ก่อน launch

---

## 🔐 Security

### Secrets & Environment Variables
- [ ] `JWT_SECRET` ความยาว ≥ 32 ตัวอักษร และ **ไม่ซ้ำ** กับ dev/staging
- [ ] `NEXTAUTH_SECRET` ตั้งค่าใหม่ (ห้ามใช้ค่าตัวอย่างจาก README)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` อยู่ใน **backend project เท่านั้น** — ห้าม expose ไป frontend
- [ ] `STRIPE_SECRET_KEY` เปลี่ยนเป็น `sk_live_...` (ไม่ใช่ `sk_test_...`)
- [ ] ไม่มีไฟล์ `.env*` ถูก commit ลง repo (`git log --all -- .env`)
- [ ] ตรวจ `.gitignore` ครอบคลุม `.env*.local` และ `.env.production`
- [ ] ทุก secret ถูกใส่ผ่าน Vercel Dashboard (ไม่ hardcode ในไฟล์)

### Authentication & Authorization
- [ ] `bcrypt` cost ≥ 10 สำหรับ password hashing
- [ ] Session cookie ตั้ง `secure: true` ใน production (ตรวจ `NODE_ENV === 'production'`)
- [ ] Session cookie ตั้ง `httpOnly: true`
- [ ] Session cookie ตั้ง `sameSite: 'lax'` หรือ `'strict'`
- [ ] Admin endpoints ตรวจ role ใน backend (ไม่พึ่ง frontend guard อย่างเดียว)
- [ ] CSRF double-submit cookie enabled สำหรับ unsafe methods (POST/PUT/DELETE/PATCH)
- [ ] Rate limiting enabled สำหรับ auth endpoints (login, register, forgot-password)

### Input Validation
- [ ] ทุก API route ใช้ Zod schema validate body
- [ ] Email inputs sanitized ด้วย `escapeHtml()` ก่อนส่งอีเมล
- [ ] File uploads จำกัด MIME type + max size (ดู `/api/upload`)
- [ ] SQL injection: ใช้ Supabase parameterized queries อย่างเดียว (ไม่ใช้ raw SQL string concat)

### Supabase RLS
- [ ] **ทุกตาราง** มี RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Policy สำหรับ `authenticated`, `anon`, `service_role` ครบตาม use case
- [ ] ทดสอบ: `anon` key ไม่สามารถอ่าน `users.password_hash`, `admins`, `payments` ได้
- [ ] ทดสอบ: user A ไม่สามารถอ่าน booking ของ user B ได้
- [ ] `SECURITY DEFINER` functions limit search_path อย่างรัดกุม

### Headers & CORS
- [ ] `Strict-Transport-Security` header ตั้งแล้ว (ดู `vercel.json`)
- [ ] `X-Frame-Options: DENY` สำหรับ admin pages
- [ ] `X-Content-Type-Options: nosniff` ทุก response
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] CORS whitelist frontend domain เท่านั้น (ถ้าเปิด CORS)

---

## 💳 Payment (Stripe)

- [ ] เปลี่ยนจาก **Test mode** → **Live mode** ใน Stripe Dashboard
- [ ] ใส่ `STRIPE_SECRET_KEY=sk_live_...` ใน backend env
- [ ] ใส่ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` ใน frontend env
- [ ] สร้าง Webhook endpoint ใน Stripe → `https://<backend>/api/webhook/stripe`
- [ ] Copy `whsec_...` → `STRIPE_WEBHOOK_SECRET` ใน backend
- [ ] Subscribe events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- [ ] ทดสอบ webhook signature verification (ต้อง reject ถ้า signature ผิด)
- [ ] เปิด [Stripe Radar](https://stripe.com/radar) เพื่อป้องกัน fraud
- [ ] ตั้งค่า 3D Secure สำหรับ transaction > threshold
- [ ] Terms of Service + Privacy Policy มี link ชัดเจน (Stripe ต้องการ)
- [ ] ทดสอบ refund flow กับ test transaction
- [ ] Monitor dashboard คน 24/7 ใน 2 สัปดาห์แรก

---

## 🗄️ Database (Supabase)

### Schema
- [ ] Migrations ทั้งหมดถูก apply ตามลำดับ — ตรวจไฟล์ล่าสุดใน `supabase/migrations/` ตรงกับ DB
  - 0015 admin_notifications, 0016 availability_blocks, 0017 admin_audit_log
  - 0018 email_campaigns, 0019 email_unsubscribes, 0020 reviews_spam_score
  - 0021 user_wishlist, 0022 referrals, 0023 referral_rewards
  - 0024 loyalty_points, 0025 loyalty_tiers
- [ ] มี **admin user อย่างน้อย 1 คน** ใน `admins` table
- [ ] ลบ seed data ที่เป็น "test" / "demo" ออกหมดแล้ว
- [ ] ตรวจ foreign keys มี `ON DELETE` policy ที่ถูกต้อง (CASCADE หรือ SET NULL)

### Performance
- [ ] Indexes สำหรับ queries ที่ใช้บ่อย:
  - `bookings(booking_code)` — lookup ด้วย code
  - `bookings(customer_email, created_at DESC)` — user bookings list
  - `bookings(status, created_at DESC)` — admin filter
  - `admin_notifications(is_read, created_at DESC)` — inbox query
  - `reviews(is_approved, created_at DESC)` — public reviews
  - `hotels(is_published)` — catalog listing
- [ ] `EXPLAIN ANALYZE` query ช้าที่สุด — ไม่มี seq scan บน table ใหญ่

### Backup & Recovery
- [ ] Daily automatic backup enabled (Supabase → Settings → Database → Backups)
- [ ] ทดสอบ restore จาก backup อย่างน้อย 1 ครั้ง
- [ ] Backup retention ≥ 7 วัน (แนะนำ 30 วันสำหรับ production)
- [ ] Point-in-time recovery enabled (ถ้า plan รองรับ)

### Limits
- [ ] ดู Supabase plan limits — เหลือ headroom ≥ 50%
  - Database size
  - Bandwidth
  - Realtime connections
  - Storage
- [ ] ตั้ง alert เมื่อใช้ quota > 80%

---

## 📧 Email

- [ ] ใส่ `RESEND_API_KEY` หรือ `BREVO_API_KEY` ใน backend env
- [ ] Verify domain ใน provider (SPF, DKIM, DMARC records)
- [ ] `EMAIL_FROM_ADDRESS` ใช้ domain ที่ verify แล้ว (ไม่ใช่ `gmail.com`)
- [ ] Test ส่งอีเมลทั้ง templates:
  - [ ] Email verification (register)
  - [ ] Password reset
  - [ ] Booking confirmation
  - [ ] Booking status update
  - [ ] Booking cancellation
  - [ ] Partner booking notification
  - [ ] Admin booking notification
  - [ ] Referral reward (referrer side)
  - [ ] Referral reward (referee side)
  - [ ] Email campaign (marketing) — ตรวจว่า unsubscribe link ทำงาน
- [ ] ตรวจ email ไม่เข้า spam folder (ทดสอบ Gmail, Outlook, Yahoo)
- [ ] ตรวจ user data ใน template ถูก escape (ลอง name = `<script>alert(1)</script>`)

---

## 🎨 Frontend

### Performance
- [ ] Build สำเร็จ (`npm run build` ใน `apps/frontend`)
- [ ] Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] `next/image` ใช้ทุกภาพ (ไม่ใช่ `<img>`)
- [ ] Font preload + `display: swap`
- [ ] Bundle size: ไม่มี duplicate package ใน `npm run build` output

### SEO
- [ ] `metadata` ตั้งครบใน `layout.tsx` และ pages ที่สำคัญ
- [ ] `robots.txt` อยู่ที่ `public/robots.txt`
- [ ] `sitemap.xml` generate อัตโนมัติ (Next.js `sitemap.ts`)
- [ ] Open Graph tags: title, description, image ครบ
- [ ] Admin/Partner pages ตั้ง `X-Robots-Tag: noindex, nofollow` (ใน `vercel.json`)

### Accessibility
- [ ] ทุก form input มี `<label>`
- [ ] Color contrast ratio ≥ 4.5:1 สำหรับ text
- [ ] Focus indicator ชัดเจน (keyboard navigation)
- [ ] `aria-*` attributes ใน interactive components

### UX
- [ ] Loading states สำหรับ async actions
- [ ] Error messages เป็นภาษาไทย + มีแนะนำ action
- [ ] 404 page custom (มี link กลับหน้าแรก)
- [ ] 500 page custom (มี contact info)
- [ ] Mobile responsive ทุกหน้า (test บน iPhone + Android)

---

## 🔧 Backend

- [ ] Build สำเร็จ (`npm run build` ใน `apps/backend`)
- [ ] ไม่มี telemetry code หลงเหลือ (ตรวจ `grep -r "127.0.0.1:7242"` — ต้องได้ 0 results)
- [ ] ไม่มี `console.log` debug (ใช้ `logger` แทน)
- [ ] ไม่มี mock credentials ใน production build (ตรวจ `isMockMode()` return false)
- [ ] `/api/health` return `{ mock: false }` ใน production
- [ ] `/api/health` ไม่ leak env keys หรือ config
- [ ] Error messages ไม่ leak stack trace ใน production response

---

## 🌐 Infrastructure

### Vercel
- [ ] Frontend + Backend deployed เป็น 2 project แยก
- [ ] `BACKEND_URL` ใน frontend ชี้ไป backend URL ถูกต้อง
- [ ] Custom domain (ถ้ามี) ตั้ง DNS + SSL auto-generate แล้ว
- [ ] Function regions: `sin1` (Singapore) สำหรับ user ในไทย
- [ ] Function `maxDuration` ตั้งถูกต้อง (ดู `vercel.json`)
- [ ] Deploy hook disabled สำหรับ `feature/*` branches (production only)

### Rate Limiting
- [ ] Vercel KV / Upstash Redis ตั้งแล้ว (สำหรับ distributed rate limit)
- [ ] `KV_REST_API_URL` + `KV_REST_API_TOKEN` set ใน backend env
- [ ] ทดสอบ rate limit ทำงาน (spam login 10 ครั้ง → 429)

### Monitoring & Alerts
- [ ] Uptime monitor (UptimeRobot / Pingdom) ping `/api/health` ทุก 5 นาที
- [ ] Slack/Discord webhook alert เมื่อ downtime
- [ ] Sentry / Rollbar รับ error events
- [ ] Log aggregator (Axiom / Datadog) รับ `stdout` ทุก function

---

## ⭐ Loyalty Program

- [ ] Decide on the earning rate — default is 1 point per ฿100.
      Override via `LOYALTY_RATE_THB_PER_POINT` env BEFORE first
      paying customer (changing it later still works but means
      early customers are on a different rate than later ones —
      OK if intentional).
- [ ] Decide on redemption tiers. Defaults are 100/300/500 pts →
      ฿100/350/600 off, all bound to email, 90-day expiry. To
      change: edit `apps/backend/src/lib/loyalty.ts` `REDEEM_TIERS`
      and redeploy. There's no DB-driven config (yet).
- [ ] Manually test the full loop in staging:
  - [ ] User books and pays (mock or real Stripe)
  - [ ] Webhook flips booking → PAID
  - [ ] User's `loyalty_points` increments by `floor(price/rate)`
  - [ ] Ledger row appears with kind='earn', source_type='booking'
  - [ ] LoyaltyCard on /profile shows the new balance + history
  - [ ] User redeems 100 pts → coupon code generated +
        balance drops by 100 + ledger row with kind='redeem'
  - [ ] User C cannot apply User B's redeemed coupon (bound_to_email)
  - [ ] Re-firing the SAME `checkout.session.completed` event
        does NOT double-credit (idempotency check)
- [ ] Hotel/car detail pages show "+N แต้ม" badge near each price
- [ ] Confirm guests (no account) don't earn — only registered
      users with a matching `customer_email`

---

## 🎁 Referral Program

- [ ] Decide on the reward economics — defaults are 10% / max ฿500 / 90 days.
      Override via `REFERRAL_REWARD_PERCENT` / `REFERRAL_REWARD_MAX_THB` /
      `REFERRAL_REWARD_DAYS` env vars BEFORE first paying customer
      (changing them later doesn't retroactively update issued coupons).
- [ ] Manually test the full loop in staging:
  - [ ] User A copies their code from `/profile`
  - [ ] User B signs up at `/register?ref=<CODE>` — green banner appears
  - [ ] User B books and pays
  - [ ] Both A and B receive reward emails
  - [ ] Both coupon codes appear in `/admin/referrals` row
  - [ ] User B can apply their coupon at the next checkout
  - [ ] User C cannot apply User B's coupon (bound_to_email check)
- [ ] Admin verifies `/admin/referrals` filters work (pending/qualified/rewarded/voided)
- [ ] Admin tests void flow — confirms it writes to `admin_audit_log`
- [ ] Confirm self-referral is rejected (sign up with `?ref=` of one's own code)
- [ ] Confirm second sign-up using the same email is rejected at register step

---

## 📱 Legal & Compliance

- [ ] **Terms of Service** page published (`/terms`)
- [ ] **Privacy Policy** page published (`/privacy`)
- [ ] **Cookie consent banner** (ถ้าเก็บ analytics cookies)
- [ ] **Refund policy** ชัดเจน (มีใน booking confirmation email)
- [ ] **Contact info** (email + phone) อยู่ใน footer
- [ ] **Business registration** info (เลขทะเบียนพาณิชย์ ถ้ารับชำระเงิน)
- [ ] **PDPA compliance** (ไทย):
  - [ ] Privacy notice แจ้งวัตถุประสงค์เก็บข้อมูล
  - [ ] User request เรียกดู/ลบข้อมูลตัวเองได้
  - [ ] Data retention policy กำหนดชัดเจน

---

## 🧪 Testing

- [ ] Run unit tests: `npm test --workspaces` → all pass
- [ ] Manual E2E scenarios ผ่าน:
  - [ ] Register → Verify email → Login → Book hotel → Pay → Receive email
  - [ ] Admin login → Approve pending review → Update booking status
  - [ ] Partner login → See booking notification → Confirm booking
  - [ ] Forgot password → Reset → Login with new password
  - [ ] Cancel booking → Refund → Admin notification received
- [ ] Payment test:
  - [ ] ทดสอบด้วย Stripe test card ก่อนเปลี่ยน `pk_live_*`
  - [ ] ทดสอบ webhook retry (ปิด backend ชั่วคราว → Stripe retry 3 ครั้ง)
- [ ] Load test (ถ้ามี traffic คาดการณ์):
  - [ ] `k6` หรือ `vegeta` จำลอง 100 concurrent users
  - [ ] Response time < 500ms สำหรับ catalog endpoints

---

## 📊 Analytics & Business

- [ ] Google Analytics 4 / Plausible installed
- [ ] Conversion tracking setup (booking complete event)
- [ ] Stripe Dashboard → Revenue report ทำงาน
- [ ] Admin dashboard แสดง KPI ถูกต้อง (bookings count, revenue, pending reviews)

---

## 🚨 Incident Response

- [ ] มี **runbook** เขียนขั้นตอนเมื่อเกิดปัญหา:
  - [ ] Site down → ใช้ Vercel Rollback
  - [ ] DB compromise → revoke SUPABASE_SERVICE_ROLE_KEY, restore from backup
  - [ ] Stripe key leak → rotate immediately (ดู `SECRET_ROTATION.md`)
  - [ ] User complains → ค้น booking ด้วย email ใน admin panel
- [ ] เบอร์ติดต่อ emergency contact ของ developer + business owner
- [ ] Status page (optional): statuspage.io หรือ better-stack.com

---

## 🎯 Post-Launch (First 48 Hours)

- [ ] Monitor `/api/health` ทุก 5 นาที
- [ ] Monitor Vercel function error rate — ต้อง < 1%
- [ ] Monitor Stripe payment success rate — ต้อง > 95%
- [ ] Monitor email delivery rate — ต้อง > 98%
- [ ] ตอบ feedback/complaint ภายใน 2 ชั่วโมง
- [ ] Daily standup ตรวจ admin inbox (`/admin/notifications`)

---

## 📝 Sign-off

- [ ] **Developer:** ________________________ Date: __________
- [ ] **Product Owner:** ________________________ Date: __________
- [ ] **Business Owner:** ________________________ Date: __________

---

## 📚 Related Documents

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — วิธี deploy
- [`SECRET_ROTATION.md`](./SECRET_ROTATION.md) — รอบหมุน secret
- [`setup/SETUP.md`](./setup/SETUP.md) — local setup
