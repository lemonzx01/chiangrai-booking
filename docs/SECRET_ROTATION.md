# 🔑 Secret Rotation Runbook

คู่มือหมุน secrets และ credentials — ทำเป็นรอบเวลา หรือ emergency เมื่อสงสัยว่า leak

---

## 📅 Rotation Schedule

| Secret | Rotation Frequency | Emergency Trigger |
|--------|-------------------|-------------------|
| `JWT_SECRET` | ทุก 6 เดือน | Leak, dev คนเก่าลาออก |
| `NEXTAUTH_SECRET` | ทุก 6 เดือน | เหมือน JWT_SECRET |
| `SUPABASE_SERVICE_ROLE_KEY` | ทุก 3 เดือน | Key ปรากฏใน log / public repo |
| `STRIPE_SECRET_KEY` | ทุก 12 เดือน | Stripe alert fraudulent usage |
| `STRIPE_WEBHOOK_SECRET` | ทุก 12 เดือน | Unusual webhook activity |
| `GOOGLE_CLIENT_SECRET` | ทุก 12 เดือน | OAuth app compromise |
| `RESEND_API_KEY` / `BREVO_API_KEY` | ทุก 6 เดือน | Spam report จาก provider |
| `KV_REST_API_TOKEN` | ทุก 6 เดือน | Unauthorized access ใน logs |
| **Admin passwords** (ในตาราง `admins`) | ทุก 3 เดือน | ลาออก, สงสัย compromise |

> 📌 **Best practice:** ตั้ง calendar reminder อัตโนมัติ 1 สัปดาห์ก่อนถึงกำหนด

---

## 🧰 Prerequisites

- เข้าถึง Vercel Dashboard (ทั้ง frontend + backend project)
- เข้าถึง Supabase Dashboard
- เข้าถึง Stripe Dashboard
- Git access สำหรับ push ถ้าต้องแก้ code
- **อย่า** rotate ตอน traffic peak (แนะนำช่วง 02:00-05:00 ตามเวลาไทย)

---

## 🔄 General Rotation Pattern (ZERO-DOWNTIME)

สำหรับ secret ที่ระบบรู้ว่าถูกต้อง "1 ตัว" เท่านั้น:
1. สร้างค่าใหม่
2. อัพเดท env ใน Vercel → redeploy
3. Revoke ค่าเก่าหลังจาก deploy สำเร็จ

สำหรับ secret ที่ต้องระยะซ้อน (เช่น JWT — user ยัง login ด้วย token เดิม):
1. รองรับ **ทั้ง 2 secrets** ชั่วคราว (ต้องแก้ code)
2. Deploy code ใหม่
3. รอจน token เก่าหมดอายุ (TTL)
4. Remove secret เก่า → deploy อีกครั้ง

---

## 🎯 Per-Secret Runbook

### 1️⃣ JWT_SECRET

**Impact:** User ที่มี session เก่าจะถูก logout ทันที (ต้อง login ใหม่)

#### Steps:
```bash
# 1. Generate new secret
openssl rand -base64 48
# → copy ค่าที่ได้
```

1. **Vercel Backend Project** → Settings → Environment Variables
   - Edit `JWT_SECRET` → paste ค่าใหม่
   - เลือก environment: Production (+ Preview ถ้าใช้)
   - Save

2. **Vercel Frontend Project** (ถ้าใช้ `JWT_SECRET` ที่ฝั่ง frontend ด้วย — ปกติไม่ใช้)

3. Redeploy backend:
   ```bash
   cd apps/backend
   vercel --prod
   ```

4. ทดสอบ:
   - เข้า `/login` → ต้อง login ใหม่ได้ปกติ
   - Admin panel login → ต้องใช้งานได้
   - Session เก่าจะ expired — expected behavior

5. **ประกาศ:** แจ้ง user ล่วงหน้า 1 ชั่วโมงว่าจะต้อง login ใหม่ (banner / email)

#### Rollback:
- ถ้าเกิดปัญหา กลับ env กลับเป็นค่าเก่า + redeploy

---

### 2️⃣ NEXTAUTH_SECRET

**Impact:** NextAuth sessions ทุก browser ต้อง re-authenticate

เหมือน JWT_SECRET — รันขั้นตอนเดียวกัน แต่ env key = `NEXTAUTH_SECRET`

> 💡 ปกติเราใช้ `NEXTAUTH_SECRET` เดียวกันกับ `JWT_SECRET` — rotate พร้อมกันได้

---

### 3️⃣ SUPABASE_SERVICE_ROLE_KEY

**Impact:** ทุก write operation ไปยัง DB ผ่าน backend (เช่น bookings, payments)

#### Steps:
1. เข้า [Supabase Dashboard](https://supabase.com/dashboard) → Project → Settings → API
2. คลิก **"Reset service_role key"** ใต้ **Project API keys**
3. Confirm → copy key ใหม่ (จะแสดงครั้งเดียว)
4. **Vercel Backend** → อัพเดท `SUPABASE_SERVICE_ROLE_KEY` → Save
5. Redeploy backend → ทดสอบ booking creation + admin actions
6. Key เก่าจะ invalid ทันทีที่ reset — **ไม่มี grace period**

#### Rollback:
- ไม่สามารถ rollback ได้ (key เก่าถูก revoke ถาวร)
- ถ้าเกิดปัญหา: `vercel rollback <previous-deployment>` แล้วใส่ key ใหม่กลับเข้า

---

### 4️⃣ NEXT_PUBLIC_SUPABASE_ANON_KEY

**Impact:** Frontend และ public API calls — ปกติ **ไม่ต้อง rotate** บ่อย เพราะเป็น public key (RLS ปกป้องแล้ว)

#### Steps (ถ้าจำเป็น):
1. Supabase Dashboard → Settings → API → **"Reset anon key"**
2. Copy key ใหม่
3. อัพเดท env ใน **ทั้ง backend และ frontend** projects
4. Redeploy ทั้ง 2 project พร้อมกัน

---

### 5️⃣ STRIPE_SECRET_KEY

**Impact:** Payment creation, refund, webhook verify — ระวังมาก

#### Steps (Rolling Rotation — Zero Downtime):

1. [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → **Create restricted key** หรือ **Roll secret key**
2. ถ้าเลือก "Roll" — Stripe จะให้ grace period 12 ชั่วโมงให้ key เก่ายังใช้ได้
3. Copy key ใหม่ (`sk_live_...`)
4. **Vercel Backend** → อัพเดท `STRIPE_SECRET_KEY` → Save
5. Redeploy backend
6. ทดสอบ:
   - สร้าง test booking → redirect Stripe Checkout → payment succeeds
   - ทดสอบ refund ใน admin panel
7. หลัง verify ว่า deploy ใหม่ทำงาน → Stripe Dashboard → **Revoke old key**

#### Rollback:
- ภายใน grace period (12 ชั่วโมง): revert env + redeploy → key เก่ายังใช้ได้

---

### 6️⃣ STRIPE_WEBHOOK_SECRET

**Impact:** Webhook verification — ถ้าผิด webhook จะถูก reject (401)

#### Steps:
1. [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) → เลือก endpoint ของเรา
2. คลิก **"Roll secret"** → confirm
3. Copy `whsec_...` ใหม่
4. **Vercel Backend** → อัพเดท `STRIPE_WEBHOOK_SECRET` → Save
5. Redeploy backend
6. Stripe Dashboard → Webhooks → **"Send test webhook"** → ตรวจว่า received 200

#### Rollback:
- Stripe Dashboard → Webhooks → **"Roll secret"** อีกครั้งจะ revoke ทั้งคู่ — ต้องระวัง

---

### 7️⃣ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

**Impact:** Frontend Stripe Elements — public key ปกติไม่ต้อง rotate

ถ้าจำเป็น:
1. Stripe Dashboard → API keys → Generate publishable key ใหม่
2. อัพเดทใน **Vercel Frontend** project
3. Redeploy frontend

---

### 8️⃣ GOOGLE_CLIENT_SECRET

**Impact:** Google OAuth login — existing users login ปกติ (ไม่ต้อง re-auth), login ใหม่ต้องใช้ secret ใหม่

#### Steps:
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → เลือก OAuth Client
2. คลิก **"Reset secret"** → Confirm
3. Copy secret ใหม่
4. **Vercel Backend** → อัพเดท `GOOGLE_CLIENT_SECRET` → Save
5. Redeploy backend
6. ทดสอบ Google login flow

> ⚠️ Google ให้ grace period ~1 ชั่วโมงสำหรับ secret เก่า

---

### 9️⃣ RESEND_API_KEY / BREVO_API_KEY

**Impact:** Email ส่งไม่ออกถ้า key ผิด — user ไม่ได้รับ verify email, password reset

#### Resend:
1. [Resend Dashboard](https://resend.com/api-keys) → สร้าง key ใหม่
2. อัพเดท `RESEND_API_KEY` ใน backend env → Save → Redeploy
3. ส่ง test email → ตรวจว่าได้รับ
4. กลับ Resend Dashboard → revoke key เก่า

#### Brevo:
1. [Brevo → SMTP & API](https://app.brevo.com/settings/keys/api) → สร้าง key ใหม่
2. Repeat เหมือน Resend

---

### 🔟 KV_REST_API_TOKEN (Vercel KV / Upstash)

**Impact:** Rate limiter fallback to in-memory — ยังทำงานได้แต่ไม่ distributed

#### Steps:
1. [Upstash Console](https://console.upstash.com) → เลือก database
2. REST API tab → **"Rotate Token"**
3. Copy token ใหม่
4. อัพเดท `KV_REST_API_TOKEN` ใน backend → Save → Redeploy
5. ทดสอบ rate limit: login ผิด 10 ครั้งติดกัน → response 429

---

### 1️⃣1️⃣ Admin Passwords (in `admins` table)

**Impact:** Admin คนนั้นต้อง login ด้วย password ใหม่

#### Steps:
```bash
# 1. Generate new password hash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NEW_PASSWORD_HERE', 10))"
# → copy hash ที่ได้
```

```sql
-- 2. Update ใน Supabase SQL Editor
UPDATE admins
SET password_hash = '$2a$10$...NEW_HASH...',
    updated_at = NOW()
WHERE email = 'admin@yourdomain.com';
```

3. Test login ที่ `/admin/login` ด้วย password ใหม่
4. แจ้ง admin คนนั้นผ่านช่องทางที่ปลอดภัย (ไม่ใช่ email)

#### เมื่อ admin ลาออก:
```sql
-- Option 1: Deactivate
UPDATE admins SET is_active = false WHERE email = 'former-admin@...';

-- Option 2: Delete (ไม่แนะนำ — เสีย audit trail)
DELETE FROM admins WHERE email = 'former-admin@...';
```

---

## 🚨 Emergency Rotation (Suspected Leak)

### Scenario: Public commit leaked a secret

#### Immediate Actions (ทำภายใน 15 นาที):
1. **Revoke** ใน provider dashboard ทันที (ก่อนเปลี่ยน env)
2. Rotate secret ตาม runbook ข้างบน
3. ตรวจ audit logs ใน provider:
   - Supabase → Logs → API requests ตั้งแต่เวลา commit
   - Stripe → Dashboard → Developers → Logs
4. ถ้าพบ unauthorized usage → ติดต่อ support ของ provider
5. สร้าง incident report:
   - Secret อะไรที่ leak
   - เวลา leak + เวลา revoke
   - ผลกระทบ (ถ้ามี)
   - วิธีป้องกันซ้ำ

#### Cleanup Git History:
```bash
# ถ้า secret อยู่ใน commit ที่ push แล้ว
git log --all -- path/to/secret/file

# ใช้ BFG Repo-Cleaner ลบ
bfg --replace-text passwords.txt

# Force push (⚠️ ทำลาย history — แจ้งทุก collaborator)
git push --force --all
```

> ⚠️ **หลัง force push** ทุกคนต้อง `git fetch && git reset --hard origin/main` ใหม่

---

## 📋 Audit Log Template

บันทึกทุกครั้งที่ rotate ใน `docs/ROTATION_LOG.md` (แนะนำสร้างไฟล์นี้):

```markdown
## 2026-04-17 — Routine Rotation
- **Secret:** JWT_SECRET
- **Reason:** 6-month scheduled rotation
- **Performed by:** @username
- **Downtime:** 0 (all users re-authenticated)
- **Notes:** No incidents

## 2026-04-15 — Emergency Rotation
- **Secret:** STRIPE_SECRET_KEY
- **Reason:** Suspected leak in public Slack channel
- **Performed by:** @username
- **Revoked at:** 14:32 ICT
- **New key active at:** 14:38 ICT
- **Downtime:** 6 minutes
- **Unauthorized usage:** None detected (verified Stripe logs)
```

---

## 🛡️ Preventive Measures

### ใน repo:
- [ ] `.gitignore` ครอบคลุม `.env*.local`, `.env.production`, `*.pem`
- [ ] Pre-commit hook ตรวจ secrets (ใช้ `gitleaks` หรือ `trufflehog`):
  ```bash
  # .husky/pre-commit
  gitleaks protect --staged
  ```
- [ ] GitHub → Settings → Secret scanning: enabled
- [ ] GitHub → Settings → Push protection: enabled

### ใน Vercel:
- [ ] Env vars marked as **"Sensitive"** (ไม่แสดงค่าใน dashboard)
- [ ] Team members มี role ถูกต้อง (ไม่ใช่ทุกคนเป็น admin)
- [ ] Enable **Log Drains** เพื่อตรวจ env access

### ใน Provider Dashboards:
- [ ] 2FA enabled สำหรับทุก account
- [ ] Restricted keys แทน full secret keys (Stripe รองรับ)
- [ ] IP allowlist (ถ้า provider รองรับ)

---

## 📚 Related Documents

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Initial deployment
- [`PRODUCTION_CHECKLIST.md`](./PRODUCTION_CHECKLIST.md) — Go-live checklist
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
