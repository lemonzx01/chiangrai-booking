# Chiangrai Booking — Polish & Completeness Spec

> เอกสารนี้เป็นสเปคสำหรับรอบ "ทำให้สมบูรณ์ + สวยงาม + ใช้งานง่าย"
> spec.md ตัวเดิม = engineering reference (อย่าแตะ)
> ไฟล์นี้ = สรุปสิ่งที่ต้องทำในรอบนี้

**วันที่:** 2026-05-10
**Scope:** UI polish + UX consistency + missing-feature fill-ins
**ไม่ใช่:** rewrite, rearchitect, หรือ migration ครั้งใหญ่

---

## 1. หลักการออกแบบ (Design principles)

โปรเจคนี้มี "บุคลิก" ที่ตั้งใจทำไว้แล้ว — editorial / quiet luxury — ห้ามทำลาย:

| Element | ค่าปัจจุบัน | กฎ |
|---|---|---|
| สีหลัก | `slate-900` (text), `slate-50` (background), `amber-500` (rating only) | **ห้าม** เพิ่มสีจัด ๆ ใหม่ ห้ามใช้ indigo/purple gradient |
| Typography | Plus Jakarta Sans (body) + Fraunces italic (display headlines) | ใช้ `font-display italic` สำหรับ accent บน h1/h2 เท่านั้น |
| Animations | `animate-slide-up`, `animate-fade-in`, `Reveal` wrapper | ทุกอย่างต้องเคารพ `prefers-reduced-motion` |
| Border radius | `rounded-xl` (cards), `rounded-2xl` (large surfaces), `rounded-full` (pills + buttons) | อย่าเพิ่ม value ใหม่ — ใช้ scale ที่มี |
| Card hover | `card-premium` class (border darken only) | **ห้าม** translate-y / colored shadow / scale (ดู comment ใน globals.css L196) |
| CTA buttons | rounded-full, slate-900 fill, white outline บน hero | สอดคล้องตลอด |

> **ทางตัน (anti-pattern) ที่เคยถูกถอนออก:** card translate -6px + colored indigo shadow. อย่ากลับไปทำ — มันอ่านเหมือน Squarespace template

---

## 2. สิ่งที่ครบแล้ว (อย่าทำซ้ำ)

ตรวจกับโค้ดวันที่ 2026-05-10:

- [x] Customer flow: browse → detail → booking → checkout → success → invoice PDF
- [x] Auth: email+password, Google OAuth, forgot/reset password, email verification
- [x] Three-role login (user / partner / admin) with separate cookies
- [x] Mock mode สำหรับ Stripe/Supabase/Email — `npm run dev` ใช้งานครบ flow โดยไม่ต้องมี env
- [x] Coupons, Reviews (with moderation), Wishlist, Recently Viewed, Referrals, Loyalty (3-tier)
- [x] Partner dashboard: listings, bookings, payouts, blockout calendar
- [x] Admin dashboard: bookings, partners, payments, refund, audit log, manual booking, email campaigns
- [x] PWA (manifest + service worker), offline page
- [x] i18n th/en, language switcher, locale-aware fields (`name_th/en`)
- [x] SEO: metadataBase, sitemap, robots, JSON-LD, OG image generation, referral OG image
- [x] PDPA cookie consent
- [x] Trust signals, floating LINE contact, sticky book bar (mobile)
- [x] Skeletons, image lightbox, bottom sheet, focus trap
- [x] 224 tests, atomic booking RPC, CSRF, rate limit, account lockout

**สรุป:** ระบบใช้งานได้ครบ บทบาทครบ ไม่มี feature gap ที่ใหญ่

---

## 3. สิ่งที่จะปรับในรอบนี้ (Polish list)

ลำดับความสำคัญจากผลกระทบสูง → ต่ำ

### 3.1 Home page — hero & featured sections (ผลกระทบสูง)

**ปัญหา:**
- Hero CTA buttons ดูเรียบเกินไป ไม่มี micro-interaction
- Featured hotel cards บนหน้าแรก **ไม่ใช้** `<HotelCard>` — เขียน inline ซ้ำ ทำให้ดีไซน์ไม่สอดคล้องกับหน้า /hotels
- Featured cars เหมือนกัน เขียน inline แทนที่จะใช้ `<CarCard>`
- Hero subtitle ไม่มี trust hook เร็ว ๆ (rating, จำนวนรีวิว, etc.)

**จะทำ:**
- ใช้ `<HotelCard>` และ `<CarCard>` บนหน้าแรกแทน inline grid → consistency ทันที
- เพิ่ม mini trust-pill row ใต้ hero CTA (e.g. "★ 4.9 · ปลอดภัย 100% · บริการเป็นไทย/อังกฤษ")
- ปรับ search bar mobile ให้เป็น single-column ที่อ่านง่ายขึ้น (label + input ในบรรทัดเดียว)
- เพิ่ม "How it works" section 3-step ก่อน trust signals — `Search → Book → Travel` แต่ใช้ icon style ที่เงียบ (slate, ไม่ใช่ gradient)

### 3.2 Listing pages — discoverability & empty states (ผลกระทบกลาง)

**ปัญหา:**
- Empty state เป็น text+button เปล่า ๆ — เพิ่ม illustration/icon เล็ก ๆ ให้ดูตั้งใจ
- ไม่มี "Popular destinations" entry-points — ผู้ใช้ที่ไม่รู้จะกรองอะไรเริ่มไม่ถูก

**จะทำ:**
- Empty state ได้ icon (search-x ที่เป็น stroke เบา ๆ) + คำพูดที่เป็นมิตรขึ้น
- เพิ่ม destination quick-chips ที่ส่วนบนของ listing (Chiang Rai, Chiang Mai, Phuket, Bangkok) คลิกแล้วกรองทันที

### 3.3 Auth pages — login/register desktop layout (ผลกระทบกลาง)

**ปัญหา:**
- Desktop เห็นเฉพาะกล่องฟอร์มเล็ก ๆ ตรงกลาง — เสียพื้นที่และเสียโอกาส branding
- Register form ไม่มี split layout

**จะทำ:**
- เพิ่ม 2-column layout ที่ ≥`lg`: ซ้าย = brand panel (background image + tagline + bullet list), ขวา = form
- Mobile = single-column เดิม
- เพิ่ม "Why register?" 3 bullets บน brand panel (loyalty points, faster checkout, wishlist sync)

### 3.4 Profile page — top-of-page summary (ผลกระทบกลาง)

**ปัญหา:**
- หน้า profile เริ่มด้วยฟอร์มแก้ชื่อ — สิ่งที่ผู้ใช้สนใจจริง ๆ คือ "ฉันมีกี่จองค้าง / กี่แต้ม / tier อะไร"
- LoyaltyCard และ Bookings list อยู่ลึกลงไป

**จะทำ:**
- เพิ่ม hero summary 3 cards ด้านบน: `Active bookings`, `Loyalty points + tier`, `Wishlist count`
- คลิกแต่ละ card → scroll ไปยัง section นั้น (anchor link) หรือไปยังหน้าที่เกี่ยวข้อง
- ย้ายฟอร์มแก้ชื่อ/เบอร์ลงล่างใต้ "Account settings" section heading

### 3.5 Loading / skeleton consistency (ผลกระทบต่ำ-กลาง)

**ปัญหา:**
- บางหน้าใช้ `Loader2` spinner ตรงกลาง บางหน้าใช้ skeleton — ไม่สอดคล้อง

**จะทำ:**
- หน้า profile/bookings/listing ใช้ skeleton ตรงเสมอ (มี `<Skeletons>` component อยู่แล้ว)
- เก็บ spinner ไว้สำหรับปุ่ม submit เท่านั้น

### 3.6 Footer — เพิ่มลิงก์ที่หายไป (ผลกระทบต่ำ)

**ปัญหา:**
- Footer ไม่มีลิงก์ไป profile/bookings/loyalty
- ไม่มี social links (แม้จะยังว่างก็ใส่ placeholder)
- ไม่มี newsletter signup

**จะทำ:**
- เพิ่มคอลัมน์ "บัญชี" → Profile, My bookings, Loyalty, Wishlist
- เพิ่ม mini newsletter signup (email-only, single row) — POST `/api/email/subscribe` (ถ้ามี endpoint แล้ว)
- ลิงก์ social = icon-only row ที่ตอนนี้ disable (แต่ render เพื่อ layout)

### 3.7 ความสอดคล้องของ UI (housekeeping)

- ทุก rounded-2xl shadow-xl card ใน profile → เปลี่ยนเป็น `rounded-2xl border border-slate-200 shadow-sm` ให้สอดคล้องกับ card-premium pattern (shadow-xl เป็น "ฟุ้ง" — ขัดกับ editorial)
- Toast / banner success colors ปัจจุบันเป็น `green-50/600` — เก็บไว้ (ใช้ green เฉพาะ status ตอบรับเท่านั้น คล้ายกับ amber สำหรับ warning)

---

## 4. สิ่งที่ **ไม่** ทำในรอบนี้ (out of scope)

จัดเก็บไว้ก่อน — ถ้าทำจะเกิน "polish":

- เพิ่ม dark mode (ต้องแก้ทุกหน้า)
- เปลี่ยน design system (Tailwind tokens) — ระบบที่มีก็พอแล้ว
- Real-time chat / websocket ระหว่างผู้ใช้กับพาร์ทเนอร์
- Mobile native app
- เปลี่ยน Stripe ↔ Omise/2C2P
- Sentry integration (มี hook เตรียมไว้แล้ว ใส่ key เมื่อพร้อม)

---

## 5. Definition of Done

แต่ละ section ใน §3 ถือว่าเสร็จเมื่อ:

1. โค้ดผ่าน `tsc --noEmit` ที่ frontend (no type errors)
2. ไม่มี console error/warning ใหม่ตอน hydration
3. ทดสอบ visual บน viewport 360px / 768px / 1280px
4. เคารพ `prefers-reduced-motion` (ถ้าเพิ่ม animation ใหม่)
5. Bilingual (th + en) ทุก string ใหม่ผ่าน `t()` หรือ `lang === 'th' ? '…' : '…'`
6. ไม่ทำลาย route group `(admin)` / `(partner)` (ห้ามแสดง Navbar/Footer ในนั้น)

---

## 6. Quick checklist (ระหว่างทำงานจริง)

- [ ] §3.1 Home: ใช้ HotelCard + CarCard, trust pills, How it works section
- [ ] §3.2 Listings: empty state มี icon, destination quick-chips
- [ ] §3.3 Auth: 2-column layout ที่ desktop
- [ ] §3.4 Profile: summary cards บนสุด
- [ ] §3.5 Loading: skeleton consistency
- [ ] §3.6 Footer: account links + newsletter
- [ ] §3.7 Housekeeping: shadow-xl → shadow-sm บน profile cards
- [ ] ตรวจ build (frontend) ก่อน commit

---

## 7. ไฟล์ที่จะถูกแตะ (คาดการณ์)

```
apps/frontend/src/
├── app/(frontend)/
│   ├── HomeClient.tsx              # §3.1
│   ├── hotels/HotelsClient.tsx     # §3.2
│   ├── cars/CarsClient.tsx         # §3.2
│   ├── login/page.tsx              # §3.3
│   ├── register/RegisterClient.tsx # §3.3
│   └── profile/page.tsx            # §3.4 + §3.7
├── components/
│   ├── shared/
│   │   ├── Footer.tsx              # §3.6
│   │   ├── HowItWorks.tsx          # NEW (§3.1)
│   │   ├── DestinationChips.tsx    # NEW (§3.2)
│   │   ├── BrandPanel.tsx          # NEW (§3.3)
│   │   └── ProfileSummary.tsx      # NEW (§3.4)
│   └── ui/
│       └── EmptyState.tsx          # NEW (§3.2)
└── app/globals.css                 # may add 1-2 new utilities
```

จบสเปค.
