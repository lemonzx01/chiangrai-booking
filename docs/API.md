# API reference

Catalog of every backend route in `apps/backend/src/app/api/`. Source-of-truth is the route handlers themselves; this doc is meant to be a quick scan when you need to remember "wait, what's the body shape for X".

**Base URL** (production): `BACKEND_URL` env, e.g. `https://backend.gotjourneythailand.com`. Browser calls use the rewrite at `frontend.gotjourneythailand.com/api/*` so customers never see the backend URL directly.

**Auth conventions**:
| Cookie | Issued by | Read by |
|---|---|---|
| `user_token` | login / register / Google OAuth | `verifyUserToken` |
| `partner_token` | login w/ partner role | `verifyPartnerToken` |
| `admin_token` | `/api/admin/login` | `verifyAdminToken` |

**CSRF**: every POST / PUT / PATCH / DELETE on session-bearing routes calls `verifyCsrfToken(req)` first. Frontend's `apiFetch()` helper auto-attaches `X-CSRF-Token` from the cookie. Exceptions: `/api/webhook/stripe` (uses Stripe signature), and login / register / forgot-password (no session yet).

**Response shapes**:
- Success: `{ data, ...metadata }` or just the resource. List endpoints: `{ data: [...], total, limit, offset }`.
- Errors: `{ error: "thai message", details?: [...] }` with appropriate HTTP status.

---

## Public (unauthenticated)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | `{status:'ok', mockMode:{...}, version, timestamp}`. Wire to UptimeRobot. |
| GET | `/api/hotels` | List active hotels. CDN-cached 60s + SWR 300s for public callers. Filters: `q`, `location`, `min_price`, `max_price`, `min_star`, `sort` (`newest`/`price_asc`/`price_desc`/`star_desc`). |
| GET | `/api/hotels/[id]` | Single hotel. |
| GET | `/api/cars` | List active cars. Same caching/filters as hotels. Adds `car_type`, `min_passengers`. |
| GET | `/api/cars/[id]` | Single car. |
| GET | `/api/availability` | Check availability for a hotel/room/car + date range. |
| GET | `/api/room-types?hotel_id=…` | Room types under a hotel. |
| GET | `/api/reviews?hotel_id=…&car_id=…` | Approved reviews only. |
| POST | `/api/reviews` | Submit a review (queued for moderation, scored by `lib/spam.ts`). |
| POST | `/api/coupons/validate` | Live coupon check. Body: `{code, booking_type, total_price, customer_email?}`. `customer_email` is required when validating an email-bound (referral) coupon — unbound coupons ignore it. Returns `{valid, discount_amount, final_amount}` or `{valid:false, error}`. |
| GET | `/api/email-preferences?token=…` | Read unsubscribe status. Token = HMAC-signed email. |
| POST | `/api/email-preferences` | Toggle subscription. Body: `{token, unsubscribed, reason?}`. |
| POST | `/api/contact` | Contact form submission. |
| POST | `/api/webhook/stripe` | Stripe webhook (verified via signature). Idempotent — duplicate events return 200 `{duplicate:true}`. |
| GET | `/api/og/referral?code=ABCDEFGH` | Dynamic 1200×630 PNG (next/og + Satori, edge runtime) used as the link-preview image when a `/register?ref=CODE` URL is shared on LINE / Facebook / X. Renders the discount % from `REFERRAL_REWARD_PERCENT` env. Cache: 1-year immutable. |

## Booking flow

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/bookings` | optional | Create a booking. Atomic via `create_booking_atomic` / `create_car_booking_atomic` RPC. Returns 409 `DATES_BLOCKED` / `ROOM_FULL` / `CAR_FULL` on conflict. |
| GET | `/api/bookings/[code]` | mixed | Get booking by code. Logged-in user matched by email; guests pass `?email=…`. Admin sees anything. |
| PATCH | `/api/bookings/[code]` | admin | Update fields. Status transitions validated against `VALID_STATUS_TRANSITIONS`. |
| POST | `/api/bookings/[code]/cancel` | mixed | Cancel + automatic refund per tier (≥7d 100%, 3-6d 50%, <3d 0%). |
| GET | `/api/bookings/[code]/invoice` | mixed | PDF invoice (jsPDF + Sarabun font). |
| POST | `/api/bookings/[code]/modification-request` | customer | Customer asks admin to reschedule. Drops admin inbox entry. |
| POST | `/api/checkout` | customer | Create Stripe Checkout Session. Body: `{booking_id, payment_method, success_url, cancel_url, coupon_code?}`. |

## Customer (`user_token`)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` | Body: `{email, password, name, phone?}`. Min password 8. |
| POST | `/api/auth/login` | Lockout: 5 fails in 15 min → 30 min block. |
| POST | `/api/auth/logout` | |
| GET | `/api/auth/me` | Returns `{user}` or 401. |
| POST | `/api/auth/forgot-password` | Sends reset email (or no-op in mock mode). |
| POST | `/api/auth/reset-password` | Body: `{token, password}`. |
| GET | `/api/auth/validate-reset-token?token=…` | Pre-flight check. |
| POST | `/api/auth/verify-email` | Body: `{token}`. |
| POST | `/api/auth/resend-verification` | |
| GET / PUT | `/api/user/profile` | Read / update name + phone. |
| GET | `/api/user/bookings` | List of caller's bookings. |
| GET | `/api/user/wishlist` | Cross-device wishlist (hotels + cars). |
| POST / DELETE | `/api/user/wishlist` | Add / remove. Body: `{kind:'hotel'\|'car', id}`. |
| GET | `/api/user/referrals` | Caller's referral code, share URL, funnel counts, masked invitee list. Lazy-creates code on first call. |
| GET | `/api/user/loyalty` | `{ points, recent[10], redeemTiers[] }`. Powers the LoyaltyCard on /profile. Tiers are exposed so the UI doesn't hard-code them. |
| POST | `/api/user/loyalty/redeem` | Body: `{ points }`. Trades points for an email-bound coupon at one of the fixed tiers (100/300/500). Atomic at the DB layer. Returns `{ ok, couponCode, pointsRemaining, valueThb, expiresAt }`. Status: 400 invalid_tier, 402 insufficient_points, 409 race_lost. |

## Partner (`partner_token`; admin also passes)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/partner/resources` | `{hotels, cars, room_types}` for this partner. Admin sees all. |
| GET | `/api/partner/availability?hotel_id=…&start=…&end=…` | List blocks + bookings in window. |
| POST | `/api/partner/availability` | Create blockout. Body validated by `availabilityBlockSchema`. |
| DELETE | `/api/partner/availability/[id]` | Remove blockout (must own resource). |
| GET | `/api/partner/stats?days=30` | KPIs: revenue, bookings, occupancy %, status breakdown, top dates, upcoming next-7-days. |
| GET | `/api/partner/bookings/export?status=&from=&to=&limit=` | CSV download (max 5000 rows). UTF-8 BOM for Excel-Thai. |
| GET / POST | `/api/partners/[id]` | Profile read / update. |
| POST | `/api/partners/[id]/connect-stripe` | Create Stripe Connect onboarding link. |
| GET | `/api/partners/[id]/stripe-status` | Live `{isOnboarded, detailsSubmitted, chargesEnabled}` from Stripe. |

## Admin (`admin_token`)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/admin/login` | Same lockout policy as customer login. |
| POST / DELETE | `/api/admin/auth` | Session manipulation. |
| GET / POST | `/api/bookings` | Admin list (sees everything). |
| POST | `/api/admin/bookings` | **Manual booking** — bypasses Stripe. Body has `payment_method`, `payment_reference`, `paid?`, `force?`. |
| POST | `/api/admin/bookings/[code]/refund` | Arbitrary-amount refund. Body: `{amount, reason, cancel_booking?}`. |
| POST | `/api/admin/bookings/[code]/reschedule` | Move dates with availability re-check. Body: `{check_in_date, check_out_date, force?, reason?}`. |
| GET | `/api/admin/bookings/export` | CSV (max 50000 rows). |
| GET | `/api/admin/payments/export` | CSV. |
| GET / POST | `/api/admin/coupons` | List / create. |
| GET / PATCH / DELETE | `/api/admin/coupons/[id]` | Edit / soft-delete. |
| GET / PATCH / DELETE | `/api/admin/reviews` | Moderation. List sorted spam_score DESC for pending. |
| GET / POST | `/api/admin/notifications` | Inbox. |
| GET / PATCH | `/api/admin/notifications/[id]` | Read / mark-read. |
| GET / POST | `/api/admin/campaigns` | Email campaign list / send. POST validates cohort + drops unsubscribed addresses + audits. |
| GET | `/api/admin/referrals` | List with optional `?status=pending\|qualified\|rewarded\|voided`. Newest 100, both sides joined. |
| POST | `/api/admin/referrals/[id]/void` | Mark referral voided (audit-logged). Body: `{reason?}`. Does NOT deactivate already-issued coupons — that's a separate coupon-admin action. |
| POST / DELETE | `/api/hotels`, `/api/hotels/[id]` | CRUD with audit on delete. |
| POST / DELETE | `/api/cars`, `/api/cars/[id]` | Same. |
| POST / DELETE | `/api/partners`, `/api/partners/[id]` | Same. |
| POST / DELETE | `/api/room-types`, `/api/room-types/[id]` | |
| GET | `/api/payments` | List with optional filters. |
| GET | `/api/payments/stats` | Revenue stats. |
| GET | `/api/dashboard/stats` | Admin dashboard KPIs. |
| POST | `/api/upload` | Image upload to Supabase Storage. |

## Caching

`lib/cache.ts` exposes two response decorators:

- `withPublicCache(res)`: `s-maxage=60, stale-while-revalidate=300, public`. Applied to `/api/hotels` and `/api/cars` for unauthenticated callers — Vercel's edge serves bytes without invoking a function.
- `withPrivateNoStore(res)`: `private, no-store, max-age=0`. Defensive on auth-bearing endpoints (admin/partner queries, user-specific data) so any cache layer is forced to skip them.

## Loyalty program

Phase 1 (migration 0024). Two rules:

- **Earn** — Stripe webhook awards 1 point per ฿100 spent when a booking flips to PAID. Tunable via `LOYALTY_RATE_THB_PER_POINT` env (default 100). Idempotent at the DB layer via a partial UNIQUE index on `loyalty_ledger(source_id) WHERE kind='earn' AND source_type='booking'` — a webhook retry storm can't double-credit.
- **Redeem** — three fixed tiers (100/300/500 pts → ฿100/350/600 off). Higher tiers give better value-per-point, encouraging saving. Issued coupons reuse `coupons.bound_to_email` so they're scoped to the redeemer.

State splits by purpose: `users.loyalty_points` is the denormalized counter for fast reads; `loyalty_ledger` is the source-of-truth audit trail (`kind ∈ {earn, redeem, void, adjust}`). Award and redeem helpers write both atomically.

Frontend surfaces:
- `/profile` LoyaltyCard — balance, recent activity, redemption tiers
- Hotel/car detail pages — `<LoyaltyPointsPreview>` badge near each price showing "+N แต้ม" you'd earn

## Audit log

Every admin action that mutates state writes a row to `admin_audit_log` (table from migration 0017). Captured fields: actor_id + email, action verb (`booking.refund`, `hotel.delete`, `campaign.send`, etc.), resource_type + resource_id, JSONB metadata (before/after for diffable fields), IP + user-agent + request-id.

The table is append-only by RLS. Admins query via the same Supabase admin client; there's no UI yet, but `select * from admin_audit_log where actor_email='…' order by created_at desc` answers the "who did what" question directly.

## Mock mode

Every external service (Supabase, Stripe, Resend/Brevo) has a mock fallback that activates when its env var is missing, so `npm run dev` with zero env works end-to-end.

| Flag | True when | Effect |
|---|---|---|
| `isMockMode()` | `SUPABASE_URL` unset | `createAdminClient` returns the in-memory mock client |
| `isStripeMockMode()` | `STRIPE_SECRET_KEY` unset | `getStripe()` returns a `MockStripe` shim |
| `isEmailMockMode()` | Neither `RESEND_API_KEY` nor `BREVO_API_KEY` set | Email functions log via `logger.info` and return a fake messageId |

Mock checkout: Stripe shim redirects to `/checkout/mock?session=cs_mock_<id>`, which simulates `checkout.session.completed` by POSTing back to `/api/webhook/stripe`. The whole booking → PAID transition gets exercised without any real card.

## See also

- [`spec.md`](../spec.md) — full architecture / conventions
- [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) — Vercel two-project setup, env reference
- [`docs/SENTRY.md`](SENTRY.md) — observability wiring
- [`docs/BACKUP.md`](BACKUP.md) — disaster-recovery runbook
- [`docs/E2E.md`](E2E.md) — Playwright E2E scaffolding
