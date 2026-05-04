# Chiangrai Booking — Engineering Specification

**Purpose**: definitive reference for the system as it actually exists in the codebase — architecture, conventions, flows, deployment. If something here disagrees with the code, the code wins; please update this doc.

**Audience**: any engineer (or AI agent) joining the project.

**Last verified against**: commits up to `f9ad382` (Phase 13).

> Note: `spec.mb` is a separate, older pricing/scope document used for sales conversations. This file (`spec.md`) is the engineering spec.

---

## 1. Project overview

A bilingual (Thai / English) travel booking platform for Chiang Rai. Customers book hotel packages and rental cars; partners list inventory; admins moderate. The system is designed to:

1. Run end-to-end **without any external API keys** (mock mode), so dev work and QA never block on Stripe / Supabase / Resend access.
2. Flip to production cleanly the moment real keys are added — no code changes required.
3. Deploy as **two Vercel projects** (frontend + backend) sharing one Supabase database.

User roles: **guest**, **customer** (registered), **partner** (hotel/car owner), **admin**.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Same framework on both apps; route handlers replace a separate API server |
| Frontend hosting | Vercel | Edge cache, ISR, automatic image optimization |
| Backend hosting | Vercel (separate project) | Lets us scale function concurrency / timeouts independently from the SSR frontend |
| Language | TypeScript (strict) | Both apps |
| DB | Supabase (Postgres) with RLS | RLS is the security boundary; the backend uses service-role to bypass it |
| Auth | NextAuth v5 + custom JWT (jose) | Three cookies: `user_token`, `partner_token`, `admin_token` |
| Payment | Stripe (checkout sessions + webhooks) | THB / USD / EUR; PromptPay for THB |
| Email | Resend or Brevo (whichever env var is set) | Both clients live behind one wrapper |
| State on the client | React + minimal local hooks | No Redux / Zustand — the data layer is HTTP, the rest is component-local |
| Styling | Tailwind CSS | Utility-first, no CSS-in-JS runtime cost |
| Component icons | lucide-react | Tree-shakable; consistent stroke width |
| i18n | react-i18next | Switches via `?lng=th|en` and a navbar toggle |
| Validation | Zod | Single schema shape used by frontend + backend |
| Tests | Vitest | Backend has 224 tests across 10 files |

---

## 3. Repository layout

```
chiangrai-booking/
├── apps/
│   ├── frontend/                 # Customer + admin + partner UI (port 3000 in dev)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (frontend)/   # Customer-facing pages share this layout
│   │   │   │   ├── (admin)/      # Admin layout
│   │   │   │   ├── (partner)/    # Partner layout
│   │   │   │   ├── layout.tsx    # Root: fonts, metadata, JSON-LD
│   │   │   │   ├── manifest.ts   # PWA manifest
│   │   │   │   ├── robots.ts     # robots.txt
│   │   │   │   └── sitemap.ts    # sitemap.xml (static + dynamic)
│   │   │   ├── components/
│   │   │   │   ├── shared/       # Toast, Lightbox, BottomSheet, FilterSidebar, ...
│   │   │   │   ├── cards/        # HotelCard, CarCard
│   │   │   │   ├── ui/           # Button, Input, Skeleton, ...
│   │   │   │   ├── admin/        # AdminSidebar, PaymentTable
│   │   │   │   └── partner/      # PartnerSidebar
│   │   │   ├── hooks/            # useScrollReveal, useToast, useFocusTrap, useCurrentUser, ...
│   │   │   ├── lib/              # api.ts (apiFetch, getBackendUrl), blurPlaceholder.ts
│   │   │   └── i18n/             # client provider + locale json
│   │   └── public/               # Required assets — see public/README.md
│   │
│   └── backend/                  # API-only Next.js (port 3001 in dev)
│       └── src/
│           ├── app/api/          # Route handlers (one folder = one endpoint)
│           ├── lib/              # auth, authz, csrf, lockout, refund, cache, logger, ...
│           ├── services/         # notifications/* (email, partner, admin-inbox)
│           └── middleware.ts     # Request-id correlation, security headers
│
├── packages/shared/              # Cross-app helpers (types, utils, currency, constants)
│
├── supabase/
│   ├── schema.sql                # Initial schema
│   └── migrations/               # 0001_..0016_ (sequential)
│
├── docs/
│   ├── DEPLOYMENT.md
│   ├── PRODUCTION_CHECKLIST.md
│   └── SECRET_ROTATION.md
│
└── scripts/                      # CLI helpers (seed mock data, etc.)
```

---

## 4. Mock mode (the most important convention)

The single highest-leverage decision in this codebase: **every external dependency has a mock fallback that activates when its env var is missing**, so `npm run dev` with zero env vars must work end-to-end (browse → book → mock checkout → success → invoice PDF).

| Helper | Returns true when | Effect |
|---|---|---|
| `isMockMode()` | `SUPABASE_URL` is unset | `createAdminClient` returns the in-memory mock client (`apps/backend/src/lib/supabase/mock-client.ts`) |
| `isStripeMockMode()` | `STRIPE_SECRET_KEY` is unset | `getStripe()` returns a `MockStripe` shim (checkout sessions, webhooks, refunds, Connect) |
| `isEmailMockMode()` | Neither `RESEND_API_KEY` nor `BREVO_API_KEY` is set | Email functions log via `logger.info` and return `{messageId: 'mock-...'}` |

Every new feature MUST handle mock mode — that's how we avoid hard binds to remote services. The pattern:

```ts
if (isMockMode()) {
  // synthetic data path — log, don't throw
}
// real path
```

Mock checkout flow: the mock Stripe redirects users to `/checkout/mock?session=cs_mock_<id>`, which simulates payment by POSTing a synthetic `checkout.session.completed` event back to `/api/webhook/stripe`.

---

## 5. Authentication & authorization

Three cookies hold three independent JWTs (jose library, `JWT_SECRET` env, 24h expiry):

| Cookie | Issued at | Read by |
|---|---|---|
| `user_token` | `POST /api/auth/login`, `POST /api/auth/register`, NextAuth Google callback | `verifyUserToken()` |
| `partner_token` | `POST /api/auth/login` when role is partner | `verifyPartnerToken()` (admins also pass this check) |
| `admin_token` | `POST /api/admin/login` | `verifyAdminToken()` |

**Authorization helpers** (`apps/backend/src/lib/authz.ts`) — wrap the verifiers and return either `{ok: true, user}` or `{ok: false, response}`:

```ts
const auth = await requireAdmin()
if (!auth.ok) return auth.response
// auth.user.id is the admin id
```

Available: `requireAdmin`, `requirePartner`, `requireUser`, `requireResourceOwner(table, id)`, `requireBookingAccess(bookingId)`.

**CSRF**: `lib/csrf.ts` implements double-submit cookie. Every POST / PUT / DELETE on session-bearing routes calls `verifyCsrfToken(req)` first. Exceptions:
- `POST /api/webhook/stripe` (uses Stripe signature)
- Login / register / forgot-password (no session yet)

The frontend's `apiFetch()` helper auto-attaches `X-CSRF-Token` from the cookie for unsafe methods.

**Account lockout**: `lib/lockout.ts` records failed login attempts in `login_attempts`. Policy: 5 failures within 15 minutes → 30-minute block.

---

## 6. Database

### 6.1 Core tables

Always read `supabase/schema.sql` for the source of truth. The shape at the time of this writing:

- `users` — customers + partners. Role = `'user'` | `'partner'`. `email_verified` boolean.
- `admins` — separate table; role = `'admin'` | `'superadmin'`.
- `partners` — partner profile + Stripe Connect fields (`stripe_account_id`, `onboarding_status`).
- `hotels` — `name_th/en`, `description_th/en`, `location`, `price_per_night`, `base_price_per_night` (canonical THB), `max_guests`, `star_rating`, `images jsonb[]`, `is_active`, `owner_id`.
- `room_types` — children of `hotels`, each carries its own `price_per_night` and `total_rooms` (capacity).
- `cars` — `name_th/en`, `description_th/en`, `car_type_th/en`, `price_per_day`, `base_price_per_day`, `max_passengers`, `images`, `owner_id`.
- `car_packages` — fixed-price car deals.
- `bookings` — `booking_code` (unique, format `XX{YYMMDD}-{4 chars}`), `status` (PENDING|CONFIRMED|PAID|CANCELLED|COMPLETED), customer info, `total_price`, `currency`, optional `room_type_id`, optional `coupon_code`, refund fields.
- `payments` — one per booking, joins via `booking_id`. `status` (PENDING|SUCCEEDED|FAILED|REFUNDED), `stripe_payment_intent_id`, `refund_amount`.
- `coupons` — `code`, `discount_type` (PERCENT|FIXED), `discount_value`, `min_spend`, `max_discount`, `applies_to` (ALL|HOTEL|CAR), `starts_at`, `expires_at`, `is_active`.
- `reviews` — `is_approved` for moderation; admins approve/reject; appears on detail pages once approved.
- `processed_webhooks` — `event_id` PK ensures idempotency.
- `login_attempts` — for account lockout (Phase 2 hardening).
- `availability_blocks` — partner-controlled blockout dates; XOR constraint on `hotel_id` / `car_id`; `room_type_id` optional and only with `hotel_id`.
- `admin_notifications` — admin inbox (in-app).
- `exchange_rates` — daily snapshot; falls back to env-baked rates if not seeded.

### 6.2 RLS policy summary

- Public read on `hotels` and `cars` filtered by `is_active = true`.
- `bookings` and `payments`: NO public access. Customers read their own via `customer_email = auth.jwt()->>'email'`. Partners read bookings for their owned listings. Admins use service-role and bypass RLS.
- `reviews`: public read where `is_approved = true`; users insert their own; admins moderate.

The backend is the only thing that talks to Supabase, and it always uses the service-role key (`createAdminClient`). RLS is the defensive net behind the service-role boundary, not the primary access control.

### 6.3 Atomic booking RPC

To prevent overbooking under concurrent requests, booking creation goes through `create_booking_atomic` (or `create_car_booking_atomic`) — Postgres functions that use `SELECT … FOR UPDATE` row locks to recheck capacity inside a transaction. Errors raised:

- `ROOM_FULL` / `CAR_FULL` — capacity exhausted between pre-check and insert.
- `DATES_BLOCKED` — partner has marked the dates as unavailable in `availability_blocks`.

The mock client implements both RPCs in-memory so dev keeps overbooking semantics.

### 6.4 Migrations

Sequential, numbered. Run them in order — `RUN_ALL_MIGRATIONS.sql` is convenience-only.

| # | Topic |
|---|---|
| 0001 | Stripe Connect on partners |
| 0002 | Partner onboarding status |
| 0003 | Car packages + assignment |
| 0004 | Exchange rates |
| 0006 | Users table |
| 0007 | Migrate partners to users |
| 0008 | Email verification, availability, cancellation, refund fields |
| 0009 | Reviews + coupons + discount metadata |
| 0010 | Tighten RLS (drop public access on bookings/payments) |
| 0011 | Webhook idempotency |
| 0012 | Login attempts (lockout) |
| 0013 | Atomic booking RPCs |
| 0014 | Reviews moderation |
| 0015 | Admin notifications |
| 0016 | Availability blocks (partner blockout calendar) |
| 0017 | Admin audit log (append-only paper trail) |
| 0018 | Email campaigns (marketing) |
| 0019 | Email unsubscribes (signed token, per-channel) |
| 0020 | Reviews spam_score (auto-moderation hint) |
| 0021 | User wishlist (cross-device persistence) |
| 0022 | Referrals (track who referred whom) |
| 0023 | Referral rewards (coupons.bound_to_email + source) |
| 0024 | Loyalty points (counter on users + ledger) |

---

## 7. Booking & payment flow

```
┌─ Browse (cached at edge) ────────────────────────────────────┐
│  /hotels and /cars listings                                   │
│  → withPublicCache: s-maxage=60, SWR=300                      │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ Detail page ────────────────────────────────────────────────┐
│  /hotels/[id]   /cars/[id]                                    │
│  - ImageGallery + Lightbox                                    │
│  - StickyBookBar (mobile always, desktop after 600px scroll)  │
│  - useRecentlyViewed.track() on mount                         │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ Booking form ───────────────────────────────────────────────┐
│  /booking?type=HOTEL&id=…                                     │
│  - useCurrentUser auto-fills name/email/phone if logged in    │
│  - Date picker, guest count, currency, special requests       │
│  - Submit → POST /api/bookings (atomic RPC)                   │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ Checkout ───────────────────────────────────────────────────┐
│  /checkout?booking_id=…                                       │
│  - Coupon input (POST /api/coupons/validate)                  │
│  - Payment method select (card / paypal / promptpay)          │
│  - "Pay now" → POST /api/checkout                             │
│    creates a Stripe Checkout Session, returns its URL         │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ Stripe Hosted Checkout (or /checkout/mock in mock mode) ────┐
│  User pays                                                    │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ Webhook ────────────────────────────────────────────────────┐
│  POST /api/webhook/stripe                                     │
│  - Verify signature (or mock)                                 │
│  - Idempotency: insert event_id; 23505 → already processed    │
│  - checkout.session.completed: mark payment SUCCEEDED,        │
│    booking PAID, send confirmation emails, admin inbox        │
│  - charge.refunded: mark payment REFUNDED                     │
│  - charge.dispute.created: notify admin                       │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ Success page ───────────────────────────────────────────────┐
│  /success?code=…&email=…                                      │
│  - Booking summary                                            │
│  - Invoice PDF (jsPDF + Sarabun font for Thai)                │
└──────────────────────────────────────────────────────────────┘
```

### 7.1 Cancellation & refund

Customer initiates: `POST /api/bookings/[code]/cancel` → `lib/refund.ts` computes refund percentage from check-in proximity using `differenceInCalendarDays` (timezone-correct):

| Days until check-in | Refund |
|---|---|
| ≥ 7 | 100% |
| 3–6 | 50% |
| < 3 | 0% |

Admin override: `POST /api/admin/bookings/[code]/refund` accepts an explicit `amount` and `reason`; can refund any amount up to `payment.amount - already_refunded`.

### 7.2 Manual booking (admin off-platform)

`POST /api/admin/bookings` lets admins log a booking that was paid via cash / bank transfer / LINE Pay. Bypasses Stripe; inserts a synthetic `payments` row with `stripe_checkout_session_id = "manual:<method>:<ref>"` so we can trace origin. Still passes through the atomic RPC unless `force=true` is sent (emergency override).

### 7.3 Referral program (migrations 0022 + 0023)

Each registered user gets a lazy-generated 8-char code (`users.referral_code`). Sharing `?ref=CODE` to `/register` attributes the new signup; first-attribution-wins via `UNIQUE (referee_id)` on `referrals`.

Two side-effect emails fire on signup-with-ref:
1. **Signup notification** — to the referrer, sent inline by the register endpoint (per-referrer throttle: 5/24h to prevent inbox bombs)
2. **Reward issuance** — when the referee makes their first PAID booking, the Stripe webhook calls `qualifyAndIssueRewards`, which atomically claims `referrals.status: pending → qualified → rewarded`, inserts two email-bound coupons (`source='referral_referrer'` / `'referral_referee'`), and sends a reward email to each side.

Sharing UX: `/register?ref=CODE` has its own `generateMetadata` that points the OG image at `/api/og/referral?code=CODE` — a dynamic `next/og` route that renders a branded link preview. Pulls the discount % from `REFERRAL_REWARD_PERCENT` env so changing the program economics auto-updates the social card.

Admin: `/admin/referrals` lists with status filter; `POST /api/admin/referrals/[id]/void` flips to voided + writes an audit row. Voiding does NOT deactivate already-issued coupons (separate concern).

### 7.4 Loyalty points (migration 0024)

Earn rule: 1 point per `LOYALTY_RATE_THB_PER_POINT` THB (default 100). Awarded by the Stripe webhook the moment a booking flips to PAID. Idempotent at the DB layer — partial UNIQUE index on `loyalty_ledger(source_id) WHERE kind='earn' AND source_type='booking'` rejects duplicate earns from webhook retries.

Storage splits by purpose:
- `users.loyalty_points` — denormalized counter, fast O(1) read for the profile widget
- `loyalty_ledger` — signed-delta rows, one per change. `kind ∈ {earn, redeem, void, adjust}`. Source of truth for audit and (eventually) tier rebuilds.

Both written atomically by `awardPointsForBooking` / `redeemPointsForCoupon`; the counter is the cache, the ledger is correctness.

Redemption (phase 1.5): three fixed tiers in code constants — 100/300/500 pts → ฿100/350/600 off, all email-bound. Higher tiers give better value-per-point to encourage saving.

Frontend surfaces:
- `<LoyaltyCard>` on `/profile` — balance hero + redemption tiers + recent activity
- `<LoyaltyPointsPreview>` on hotel/car detail pages — "+N แต้ม" badge near each price (uses shared `pointsForAmountAtDefaultRate` so backend and frontend stay in sync without a config endpoint)

Out of scope for phase 1: tier system (Bronze/Silver/Gold), birthday bonuses, point expiry, point gifts. The ledger schema is shaped to support them when they ship.

---

## 8. Frontend conventions

### 8.1 File organization

- **Server component** = default. Any file that needs `'use client'` must declare it.
- Page-level data fetching happens in the server component (`page.tsx`); the client component receives data as props.
- Server components forward cookies when calling backend routes:
  ```ts
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
  await fetch(`${getBackendUrl()}/api/foo`, { headers: { cookie: cookieHeader } })
  ```

### 8.2 API calls (client side)

Always go through `apiFetch` / `apiJson` (`lib/api.ts`), never raw `fetch`. They:
- Inject `X-CSRF-Token` from cookie on unsafe methods
- Auto-stringify object bodies
- Set `credentials: 'include'`
- Throw on `!ok` (the JSON variant)

### 8.3 Foundation hooks

| Hook | Purpose |
|---|---|
| `useScrollReveal` | IntersectionObserver-driven entry animations |
| `useRecentlyViewed` | localStorage-backed history (12 items max) |
| `useMediaQuery` / `useIsMobile` / `usePrefersReducedMotion` | Reactive matchMedia |
| `useFocusTrap` | WCAG-compliant modal focus management |
| `useToast` | Non-blocking notifications (replaces window.alert) |
| `useCurrentUser` | Wraps `/api/auth/me`, returns `{ user, loading }` |
| `useLocalize` | `getField(obj, 'name')` returns `name_th` or `name_en` based on i18n |

### 8.4 Foundation components (shared/)

| Component | Purpose |
|---|---|
| `Toast` + `ToastProvider` | Bottom-right notification stack with role=alert/status |
| `Lightbox` | Full-screen image viewer, keyboard nav, swipe |
| `ImageGallery` | Hero + thumb grid (mobile horizontal scroll, desktop split grid), wired to Lightbox |
| `BottomSheet` | Mobile drawer / desktop modal in one component |
| `StickyBookBar` | Bottom CTA on detail pages |
| `Reveal` | Declarative scroll-reveal wrapper |
| `Skeletons` | Pre-shaped loaders matching real card layouts |
| `SkipLink` | First focusable, jumps past navbar (WCAG 2.4.1) |
| `FloatingContact` | Bottom-right LINE button |
| `TrustSignals` | Compact pill row + 4-up grid |
| `RecentlyViewed` | Horizontal scroller backed by `useRecentlyViewed` |
| `CouponInput` | Debounced live coupon validator |
| `FilterSidebar` | Sticky desktop sidebar; works with hotel + car listings |
| `SearchAutocomplete` | Typeahead with thumbnails |
| `PriceBreakdown` | Itemized order summary |
| `CookieConsent` | PDPA-compliant banner |

### 8.5 Animation policy

- All entry animations go through `<Reveal>` so reduced-motion is respected globally.
- CSS animations live in `globals.css` (`animate-fade-in`, `animate-slide-up`, `animate-scale-up`, `animate-shimmer`, `animate-float`, `animate-pulse-glow`).
- `@media (prefers-reduced-motion: reduce)` short-circuits all animations and transitions to ~1ms.

### 8.6 Accessibility baseline

- `<SkipLink>` mounted in `(frontend)/layout.tsx`
- Toast emits `role=alert` (errors/warnings) or `role=status` (success/info)
- Modals/dialogs use `useFocusTrap` and have `role=dialog aria-modal=true`
- Icon-only buttons must have `aria-label`
- Native form inputs preferred; custom dropdowns expose ARIA combobox attributes

### 8.7 SEO & metadata

- `app/layout.tsx` sets `metadataBase`, `title.template`, OG/Twitter card defaults, alternate languages, canonical, JSON-LD (Organization, TravelAgency, WebSite).
- `app/robots.ts` blocks admin/partner/api/checkout/profile.
- `app/sitemap.ts` emits static routes + dynamic hotel/car detail pages (best-effort fetch from backend).
- `app/manifest.ts` for PWA install.
- Required asset paths documented in `public/README.md` (favicon, og-image, icon-192/512/maskable).

---

## 9. Backend conventions

### 9.1 Route handler pattern

Every endpoint that mutates state follows this exact order:

```ts
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // 1. CSRF
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  // 2. Auth
  const auth = await requireAdmin()  // or requirePartner() / requireUser()
  if (!auth.ok) return auth.response

  // 3. Parse + validate body with Zod
  let validated
  try {
    validated = mySchema.parse(await request.json())
  } catch (err) { /* 400 */ }

  // 4. Authorization (resource ownership) if needed
  // 5. Business logic
  // 6. Audit log via createAdminNotification
  // 7. Return JSON
}
```

### 9.2 Response shape

Success: `{ data, ...metadata }` or just the resource object. List endpoints return `{ data: [...], total, limit, offset }`.

Errors: `{ error: 'thai message' }` with appropriate HTTP status. The frontend's `apiJson` extracts the message automatically.

### 9.3 Logging

Use `lib/logger.ts` — never `console.*`. Production emits one-line JSON; dev pretty-prints. PII fields (`password`, `customer_email`, `customer_phone`, `stripe_secret`, `token`) are auto-redacted by the `sanitize` helper.

### 9.4 Caching

`lib/cache.ts` provides:
- `withPublicCache(res)` — `s-maxage=60, stale-while-revalidate=300, public`. Use on public listing endpoints.
- `withPrivateNoStore(res)` — `private, no-store, max-age=0`. Use on auth-bearing endpoints to defensively block any cache layer.

Listings detect role and apply the right helper: admins/partners get `no-store`, public callers get cacheable.

### 9.5 Error correlation

`middleware.ts` generates `crypto.randomUUID()` per request and sets it on the `x-request-id` request + response header. The logger reads it from the request context and binds it to every log line, so a stack trace in Vercel logs maps cleanly to the response the user saw.

---

## 10. Performance budget

### 10.1 Frontend

- `next/font` with `display: 'swap'` and `adjustFontFallback: true` — eliminates FOIT and prevents layout shift.
- `next/image` everywhere; `formats: ['avif', 'webp']`; explicit `sizes` on every responsive image.
- Cards use `placeholder="blur"` with a shared 16×16 SVG data-URL (`lib/blurPlaceholder.ts`) — ~150 bytes inline.
- `compiler.removeConsole` in production (keeps `error`/`warn`).
- `productionBrowserSourceMaps: false`.
- Cache-Control on PWA icons (24h) and manifest/robots/sitemap (1h).
- Reduced-motion media query short-circuits all animations.

### 10.2 Backend

- Public listings cached at the Vercel edge (60s fresh, 5min SWR).
- Atomic RPC means database transactions are short and fail-fast.
- Webhook handler has a 60s `maxDuration` in `vercel.json`.
- Invoice PDF route has 30s.

---

## 11. Deployment (Vercel, two projects)

```
            user
              │
              ▼
   frontend.example.com (Next.js)
   /api/* → next.config.mjs rewrite
              │
              ▼
   backend.example.com (Next.js, API only)
              │
              ▼
        Supabase Postgres
```

### 11.1 Required environment variables

**Frontend:**
- `BACKEND_URL` — full URL of the backend project. Without it, /api/* returns 404.
- `NEXT_PUBLIC_SITE_URL` — used by sitemap, robots, OG tags
- `NEXT_PUBLIC_LINE_OA` — LINE Official Account URL for FloatingContact (optional)

**Backend:**
- `JWT_SECRET` — same value as frontend if it ever needs to read tokens
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — omit to enable mock mode
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — omit for mock Stripe
- `RESEND_API_KEY` or `BREVO_API_KEY` — omit for mock email
- `NEXTAUTH_SECRET`, Google OAuth client/secret — for Google sign-in
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` — optional; promotes rate limiter from in-memory to Vercel KV

### 11.2 Build commands

Already configured in `apps/{frontend,backend}/vercel.json` — both run from the workspace root so the shared package gets built.

### 11.3 Running migrations

Apply `supabase/migrations/0001_…0016_*.sql` in numeric order via the Supabase SQL editor or `supabase db push`. `RUN_ALL_MIGRATIONS.sql` is a single-file convenience for fresh setups.

---

## 12. Testing

### 12.1 Backend (Vitest)

```bash
cd apps/backend && npm test
# → 224 tests across 10 files, ~2s
```

Coverage:
- `lib/auth.test.ts` — JWT verification, mock-mode toggles
- `lib/security.test.ts` — sanitize / redact helpers
- `lib/refund.test.ts` — refund tier boundary cases incl. midnight crossing
- `lib/utils.test.ts` — formatting, code generation
- `lib/validations.test.ts` — every Zod schema's edge cases
- `lib/currency.test.ts` — exchange rate fallbacks
- `api/auth-login.test.ts` + `api/auth-register.test.ts` — account creation, lockout, weak passwords
- `api/webhook-idempotency.test.ts` — duplicate event handling
- `middleware/rate-limit.test.ts` — token-bucket behaviour

### 12.2 What the tests guard

- Mock-mode parity: every external service mock returns plausible data without throwing
- RLS bypass via service-role
- CSRF flow on every mutating endpoint
- Atomic booking under concurrent requests (race tests)
- Refund timezone correctness

### 12.3 Adding a test

Prefer `__tests__/lib/*.test.ts` for pure functions, `__tests__/api/*.test.ts` for route handlers. Mock the env to force mock mode (`vi.stubEnv('SUPABASE_URL', '')`) so tests don't accidentally hit real services.

---

## 13. Coding standards

### 13.1 General

- TypeScript strict mode is non-negotiable. `any` only when justified by a comment.
- File-level header comments are bilingual (Thai context + English technical). Existing style — match it.
- Errors thrown to users are in Thai; errors logged for engineers can be English.

### 13.2 Frontend

- Server components by default; `'use client'` only when needed (state, browser APIs).
- Tailwind utility classes; avoid inline `style` except for dynamic values.
- Image: always `next/image` with explicit `sizes` for responsive images.
- Forms: controlled state, Zod validation client + server side.

### 13.3 Backend

- Every route handler: CSRF → auth → validate → business → respond.
- Mutating routes return `{ success: true, data }` or `{ error }`.
- Never log PII without `logger.sanitize` (built into the logger; just use it).
- Never bypass the atomic RPC for booking creation; if you need a different concurrency model, add a new RPC.

### 13.4 Mock mode discipline

When you add anything that talks to a third party:
1. Wrap the client call in an `if (isXMockMode())` short-circuit.
2. Make the mock return realistic-shaped data.
3. Add a test for both branches.

If you can't test mock mode, you've broken the dev experience — go fix it before merging.

---

## 14. Common workflows

### 14.1 Add a new admin endpoint

1. `apps/backend/src/app/api/admin/<feature>/route.ts` with the standard handler scaffold (§ 9.1).
2. Use `requireAdmin()` first.
3. If it mutates: emit `createAdminNotification` so the inbox shows it.
4. Add backend tests in `__tests__/api/`.

### 14.2 Add a new public listing field

1. Add column via a new migration: `supabase/migrations/00NN_add_<thing>.sql`.
2. Update the type in `packages/shared/src/types/`.
3. Update Zod schema in `apps/backend/src/lib/validations.ts`.
4. Mock client: extend the in-memory table in `mock-client.ts`.
5. Frontend cards / filter sidebar / detail page.

### 14.3 Add a new partner-only page

1. `apps/frontend/src/app/(partner)/partner/<page>/page.tsx` — server component, fetches from backend with cookie forwarding, redirects to `/login` on 401.
2. Client subcomponent for interactivity.
3. Add link to `apps/frontend/src/components/partner/Sidebar.tsx`.

### 14.4 Track a new "viewed listing"

Already automatic on hotel/car detail pages via `useRecentlyViewed.track()`. No work needed.

---

## 15. Out of scope (deliberately)

- No real-time channels (websockets / SSE). Stripe webhooks are pull-based.
- No mobile app. Site is responsive + PWA-installable.
- No Sentry yet. Logger is abstracted so it can be swapped in one file when desired.
- No GraphQL / tRPC — REST + Zod is enough.
- No queue / background jobs — emails are best-effort fire-and-forget.
- No multi-tenancy. One database per deploy.

If a request lands in any of these areas, it's a separate proposal.

---

## 16. Risk register

| Risk | Mitigation |
|---|---|
| Mock supabase missing a method some new code uses | Grep for every supabase method touched in `apps/backend/src` after each big PR; extend mock-client |
| Webhook idempotency in mock mode | Mock client returns `{code:'23505'}` from in-memory map for duplicate inserts |
| Atomic RPC breaks tests | `checkRoomAvailability` stays as a read-only helper for tests; only POST handler switches to RPC |
| RLS migration locks out API | API uses service role which bypasses RLS — smoke-tested with anon key only |
| Thai font bloats serverless bundle | Sarabun base64 imported only inside the invoice route, tree-shaken from the rest |
| Vercel function timeout on webhook | `maxDuration: 60` set explicitly in backend `vercel.json` |
| Double rewrite loop if `BACKEND_URL` = frontend URL | Runtime check in `next.config.mjs` + DEPLOYMENT.md warning |
| PII leakage in logs | `logger.sanitize` runs by default; PR review checks for `console.*` |

---

## 17. Glossary

- **Atomic booking**: booking creation that uses `SELECT FOR UPDATE` to enforce capacity under concurrency.
- **CSRF double-submit**: a token sits in both a cookie and a header; the server requires both to match.
- **FOIT**: Flash of Invisible Text — when a custom font hides text until loaded. We avoid this with `font-display: swap`.
- **Mock mode**: any/every external service returns plausible synthetic data when its env var is unset.
- **PDPA**: Thailand's Personal Data Protection Act (B.E. 2562 / 2019). Cookie consent and privacy policy are written for this.
- **Service role**: Supabase's god-mode key that bypasses RLS. Only the backend has it.
- **SWR (HTTP)**: stale-while-revalidate — the CDN can serve a stale response immediately while fetching a fresh one in the background.

---

## 18. Where to find more

- `docs/DEPLOYMENT.md` — Vercel project setup, env reference, flow diagram
- `docs/PRODUCTION_CHECKLIST.md` — pre-deploy verification list
- `docs/SECRET_ROTATION.md` — how to rotate credentials safely
- `apps/frontend/public/README.md` — required public asset checklist
- `CHANGELOG.md` — feature timeline
- `spec.mb` — sales/scope-pricing doc (separate audience)
