# 🚀 Deployment Guide — Vercel (Two-Project Setup)

คู่มือ deploy โปรเจคไปยัง Vercel แบบ "สองโปรเจคแยกกัน" (frontend + backend)

---

## 📐 Architecture Overview

```
          ┌──────────────────────┐          ┌───────────────────────┐
  user ──▶│  frontend.vercel.app │────▶─────│  backend.vercel.app   │
          │  (Next.js App Router)│   BACKEND_URL                    │
          │  port 3000           │  rewrite  │  API routes only      │
          └──────────────────────┘          │  port 3001            │
                       │                     └──────────┬────────────┘
                       │                                │
                       ▼                                ▼
              ┌────────────────┐              ┌────────────────────┐
              │  Static assets │              │  Supabase Postgres │
              │  Admin UI      │              │  Stripe            │
              │  Partner UI    │              │  Resend / Brevo    │
              └────────────────┘              └────────────────────┘
```

- **Frontend** (`apps/frontend`) — ทุกหน้า UI + Admin + Partner dashboard
- **Backend** (`apps/backend`) — API routes ล้วนๆ (ไม่มี pages)
- Browser เรียก `/api/*` ผ่าน frontend → Next.js rewrite proxy ไป backend
- Server Components ใน frontend เรียก backend ตรงผ่าน `getBackendUrl()`

---

## 🧰 Prerequisites

1. Vercel account พร้อม [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
2. GitHub repo ที่เชื่อมโยงกับโปรเจคนี้
3. Supabase project (สำหรับ production — mock mode ไม่ต้องมี)
4. Stripe account (ถ้าเปิด payments จริง)
5. Resend หรือ Brevo account (ถ้าส่ง email จริง)

---

## 📦 Step 1 — Create Backend Project

### 1.1 Import ใน Vercel Dashboard
1. ไปที่ **New Project** → เลือก GitHub repo → **Import**
2. **Project Name:** `chiangrai-backend` (หรือชื่อที่คุณต้องการ)
3. **Root Directory:** `apps/backend`  ← สำคัญมาก
4. **Framework Preset:** Next.js (Vercel จะ detect ให้อัตโนมัติ)
5. กด **Deploy** ได้เลย แต่จะ fail — เราจะเพิ่ม env ก่อน deploy จริง

### 1.2 ตั้งค่า Environment Variables

ไปที่ **Project Settings → Environment Variables** แล้วเพิ่มตัวแปรต่อไปนี้:

#### ✅ จำเป็น (ทุก environment: Production + Preview + Development)

| Key | Value | หมายเหตุ |
|-----|-------|---------|
| `JWT_SECRET` | ค่าสุ่ม ≥ 32 ตัวอักษร | `openssl rand -base64 48` |
| `NEXTAUTH_SECRET` | ค่าสุ่ม ≥ 32 ตัวอักษร | สำหรับ NextAuth (ใช้ค่าเดียวกันกับ JWT_SECRET ได้) |
| `NEXT_PUBLIC_APP_URL` | `https://<frontend>.vercel.app` | URL ของ frontend project |
| `NEXT_PUBLIC_FRONTEND_URL` | `https://<frontend>.vercel.app` | เหมือนกัน (ใช้ใน Stripe Connect) |

#### 🟡 Production Mode (ใส่ถ้าอยากเปิด DB จริง)

| Key | Value | หมายเหตุ |
|-----|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | **Server-side only — ห้าม expose** |

> ⚠️ **Mock Mode:** ถ้าเว้นตัวแปร Supabase ว่าง backend จะทำงานใน **mock mode** อัตโนมัติ — ใช้ credentials ตามที่ `README.md` ระบุ

#### 🟣 Stripe (Optional — ใส่ถ้าเปิด payment)

| Key | Value | หมายเหตุ |
|-----|-------|---------|
| `STRIPE_SECRET_KEY` | `sk_live_...` หรือ `sk_test_...` | **Server-side only** |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ได้จาก Stripe Dashboard → Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | ปลอดภัยที่จะ expose |

#### 📧 Email (ใส่ 1 ใน 2 provider)

| Key | Value |
|-----|-------|
| `RESEND_API_KEY` | `re_...` |
| หรือ `BREVO_API_KEY` | `xkeysib-...` |
| `EMAIL_FROM_ADDRESS` | `noreply@yourdomain.com` |
| `EMAIL_FROM_NAME` | `Got Journey Thailand` |

> 💡 ถ้าไม่ใส่ทั้ง 2 ตัว email จะทำงาน mock mode (log ลง console)

#### 🔐 Google OAuth (Optional)

| Key | Value |
|-----|-------|
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` |
| `NEXTAUTH_URL` | `https://<backend>.vercel.app` |

#### 🚦 Rate Limiting (Optional, แนะนำ production)

| Key | Value | หมายเหตุ |
|-----|-------|---------|
| `KV_REST_API_URL` | `https://xxx.upstash.io` | จาก Vercel KV / Upstash |
| `KV_REST_API_TOKEN` | `...` | Token จาก provider |

> ถ้าไม่ตั้ง backend จะใช้ in-memory rate limiter (reset เมื่อ cold start)

#### 🎁 Referral Program (Optional — มีค่า default)

| Key | Default | คำอธิบาย |
|-----|---------|----------|
| `REFERRAL_REWARD_PERCENT` | `10` | % ส่วนลดของคูปองที่ออกให้ทั้ง 2 ฝ่าย |
| `REFERRAL_REWARD_MAX_THB` | `500` | เพดานส่วนลดต่อ 1 คูปอง (บาท) |
| `REFERRAL_REWARD_DAYS` | `90` | วันหมดอายุของคูปองนับจากวันออก |

> ปรับค่าเศรษฐศาสตร์ของระบบแนะนำเพื่อนได้โดยไม่ต้อง redeploy
> — แค่อัปเดต env แล้ว Vercel จะ pick up อัตโนมัติ
>
> คูปองที่ออกไปแล้ว **ไม่ retroactive** — ค่าใหม่ใช้กับคูปองรอบถัดไปเท่านั้น

### 1.3 Deploy Backend
```bash
# ถ้าใช้ Vercel CLI
cd apps/backend
vercel --prod

# หรือกด "Redeploy" ใน Dashboard หลังใส่ env ครบ
```

### 1.4 จด URL ของ backend
หลัง deploy สำเร็จจะได้ URL เช่น `https://chiangrai-backend.vercel.app` — เก็บไว้ใช้ตั้ง `BACKEND_URL` ใน frontend

---

## 🎨 Step 2 — Create Frontend Project

### 2.1 Import ใน Vercel Dashboard
1. **New Project** → เลือก repo เดียวกัน → **Import**
2. **Project Name:** `chiangrai-frontend`
3. **Root Directory:** `apps/frontend`  ← สำคัญมาก
4. **Framework Preset:** Next.js

### 2.2 ตั้งค่า Environment Variables

| Key | Value | หมายเหตุ |
|-----|-------|---------|
| `BACKEND_URL` | `https://chiangrai-backend.vercel.app` | URL จาก step 1.4 (**ห้ามมี `/` ลงท้าย**) |
| `NEXT_PUBLIC_API_BASE` | `https://chiangrai-backend.vercel.app` | เหมือนกัน — ใช้โดย server components |
| `NEXT_PUBLIC_APP_URL` | `https://chiangrai-frontend.vercel.app` | URL ตัวเอง |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | ถ้าเปิด payments |
| `NEXTAUTH_URL` | `https://chiangrai-frontend.vercel.app` | สำหรับ NextAuth callback |
| `NEXTAUTH_SECRET` | เหมือน backend | ใช้ค่าเดียวกันกับ backend |

### 2.3 Deploy Frontend
```bash
cd apps/frontend
vercel --prod
```

---

## 🔁 Step 3 — Cross-link URLs

หลัง deploy ทั้ง 2 project เสร็จ:

### 3.1 อัพเดท Backend env
ไป backend project → Settings → Environment Variables:
- ตั้ง `NEXT_PUBLIC_APP_URL` = URL ของ frontend ที่ได้จาก step 2.3
- ตั้ง `NEXT_PUBLIC_FRONTEND_URL` = เหมือนกัน

กด **Redeploy** ใน backend project (Settings → Deployments → Redeploy latest)

### 3.2 อัพเดท Frontend env (ถ้าจำเป็น)
ถ้า `BACKEND_URL` เปลี่ยน (เช่น เปลี่ยนเป็น custom domain) ต้อง redeploy frontend เพื่อให้ rewrite ใหม่มีผล

---

## 🌐 Step 4 — Custom Domain (Optional)

### 4.1 Frontend custom domain
1. ไป frontend project → Settings → Domains
2. เพิ่ม `www.yourdomain.com` หรือ `yourdomain.com`
3. Vercel จะให้คุณตั้ง DNS record (CNAME หรือ A) — ตั้งตามคำแนะนำ
4. หลัง DNS propagate แล้ว (~5 นาที) จะใช้งานได้

### 4.2 Backend custom domain (แนะนำ subdomain)
1. เพิ่ม `api.yourdomain.com` ใน backend project
2. อัพเดท env ในทั้ง 2 project ให้ใช้ custom domain แทน `.vercel.app`
3. อัพเดท Stripe Webhook endpoint → `https://api.yourdomain.com/api/webhook/stripe`
4. อัพเดท Google OAuth redirect URI → `https://api.yourdomain.com/api/auth/callback/google`

---

## 🪝 Step 5 — Stripe Webhook Setup

1. ไปที่ [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. **Add endpoint**
3. **Endpoint URL:** `https://<backend>.vercel.app/api/webhook/stripe`
4. **Events to listen:**
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy **Signing secret** (`whsec_...`) ไปตั้งเป็น `STRIPE_WEBHOOK_SECRET` ใน backend project
6. Redeploy backend

> 💡 Test ได้ด้วย Stripe CLI: `stripe listen --forward-to https://<backend>.vercel.app/api/webhook/stripe`

---

## 🗄️ Step 6 — Database Setup (Production)

### 6.1 สร้าง Supabase Project
1. [supabase.com](https://supabase.com) → New Project
2. เลือก region ใกล้ user ที่สุด (แนะนำ Singapore/Tokyo สำหรับไทย)

### 6.2 Run Migrations
```bash
# ใช้ Supabase CLI
supabase link --project-ref <your-project-ref>
supabase db push

# หรือ copy SQL จาก supabase/migrations/ ไป run ใน SQL Editor
```

### 6.3 Migration ที่สำคัญ (รันตามลำดับ)
- `0001_initial_schema.sql` — tables, RLS, triggers
- `0015_admin_notifications.sql` — admin inbox
- (ดูทั้งหมดใน `supabase/migrations/`)

### 6.4 สร้าง Admin User
```sql
INSERT INTO admins (email, password_hash, name, role, is_active)
VALUES (
  'admin@yourdomain.com',
  -- สร้าง hash ด้วย: node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 10))"
  '$2a$10$...',
  'Admin Name',
  'super_admin',
  true
);
```

---

## 🔍 Step 7 — Verify Deployment

### 7.1 Health Check
```bash
curl https://<backend>.vercel.app/api/health
# Expected: { "status": "ok", "jwt": true, "mock": false, ... }
```

### 7.2 Test Frontend
1. เปิด `https://<frontend>.vercel.app`
2. ลอง search hotel — ต้องเห็น list จาก DB
3. ลอง register + verify email — ต้องได้ email จริง
4. ลอง booking + payment — ต้อง redirect Stripe Checkout

### 7.3 Admin Panel
1. `https://<frontend>.vercel.app/admin/login`
2. login ด้วย credentials ใน `admins` table
3. ต้อง redirect ไป `/admin/dashboard`

### 7.4 Logs
- Vercel Dashboard → Project → Deployments → Select deployment → Functions → Logs
- หรือใช้ `vercel logs <deployment-url>` ใน CLI

---

## 🐛 Troubleshooting

### "500 Internal Server Error" ทุก API
- ตรวจว่า `JWT_SECRET` set แล้ว (ต้องยาว ≥ 32 chars)
- ตรวจว่า `NEXT_PUBLIC_SUPABASE_URL` ไม่เป็น `placeholder`

### "Cannot reach backend" จาก frontend
- ตรวจ `BACKEND_URL` (ห้ามมี `/` ลงท้าย)
- ดู Network tab — request ไปที่ `/api/*` ต้อง rewrite ไป backend
- ถ้า rewrite ไม่ทำงาน → redeploy frontend หลังตั้ง env แล้ว

### "CSRF token mismatch"
- Cookie `csrf_token` ถูก block เพราะ cross-domain
- Solution: ใช้ custom domain เดียวกัน (เช่น `app.yourdomain.com` + `api.yourdomain.com`) หรือ deploy frontend+backend ใน `.vercel.app` เดียวกัน (monolith mode)

### Stripe Webhook signature verify failed
- ตรวจ `STRIPE_WEBHOOK_SECRET` ตรงกับที่ Stripe Dashboard
- ตรวจว่า endpoint URL ใน Stripe ใช้ `https://` ไม่ใช่ `http://`

### Function timeout
- Default: 10s บน Hobby plan, 60s บน Pro
- ดู `apps/backend/vercel.json` → `functions` → maxDuration ถูกตั้งแล้ว
- Upgrade plan ถ้าต้อง > 60s

---

## 🔄 Redeploy Strategy

### Auto-deploy (แนะนำ)
- Push ไป `main` branch → Vercel deploy production อัตโนมัติ
- Push ไป `feature/*` → Vercel สร้าง preview deployment

### Manual redeploy
```bash
cd apps/backend && vercel --prod
cd ../frontend && vercel --prod
```

### Rollback
- Dashboard → Deployments → เลือก deployment เก่า → **Promote to Production**
- หรือ `vercel rollback <deployment-url>`

---

## 📊 Monitoring

### Built-in
- **Analytics:** Dashboard → Analytics
- **Speed Insights:** Dashboard → Speed Insights (ต้อง enable)
- **Logs:** Dashboard → Deployments → Functions

### External (แนะนำ)
- **Sentry** — error tracking
- **Axiom** / **Datadog** — logs aggregation
- **UptimeRobot** — ping `/api/health` ทุก 5 นาที

---

## 🎯 Next Steps

หลัง deploy สำเร็จ:
1. ดู [`PRODUCTION_CHECKLIST.md`](./PRODUCTION_CHECKLIST.md) เพื่อตรวจงาน go-live
2. ดู [`SECRET_ROTATION.md`](./SECRET_ROTATION.md) เพื่อตั้งตารางหมุน secret
3. ตั้ง backup DB อัตโนมัติใน Supabase (Settings → Database → Backups)
4. เปิด **Vercel Firewall** (Pro plan) เพื่อป้องกัน DDoS

---

## 📚 Reference Links

- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Monorepo](https://vercel.com/docs/monorepos)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Stripe Going Live Checklist](https://stripe.com/docs/development/checklist)
