/**
 * ============================================================
 * Stripe - การตั้งค่าและเชื่อมต่อ Stripe Payment
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ตั้งค่า Stripe SDK สำหรับการชำระเงิน
 *   - รองรับทั้ง Server-side และ Client-side
 *   - ใช้ Lazy initialization เพื่อหลีกเลี่ยง build-time errors
 *   - รองรับ Mock mode เมื่อไม่ได้ตั้งค่า STRIPE_SECRET_KEY
 *
 * การทำงานหลัก:
 *   - getStripe(): ดึง Stripe instance สำหรับ Server-side (real หรือ mock)
 *   - stripe: Object สำหรับเข้าถึง checkout, webhooks, refunds, accounts
 *
 * Environment Variables ที่ต้องการ:
 *   - STRIPE_SECRET_KEY: Secret key (Server-side) — ถ้าไม่มีจะใช้ mock
 *   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Publishable key (Client-side)
 *
 * ============================================================
 */

// ============================================================
// Imports
// ============================================================

import Stripe from 'stripe'
import { isStripeMockMode } from './auth'
import { logger } from './logger'

// ============================================================
// Mock Stripe Implementation
// ============================================================

/**
 * สร้าง mock Stripe object สำหรับใช้งานในโหมด mock
 *
 * @description Implements just enough of the Stripe SDK shape so every route
 *              in this repo can run end-to-end without a real Stripe account.
 *              All ids are prefixed with `_mock` so the data can never be
 *              mistaken for real Stripe objects in logs.
 */
function createMockStripe(): any {
  const mockId = (prefix: string) =>
    `${prefix}_mock_${Math.random().toString(36).substring(2, 14)}`

  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'

  return {
    checkout: {
      sessions: {
        create: async (params: any) => {
          const id = mockId('cs')
          logger.info('mock stripe checkout.sessions.create', {
            sessionId: id,
            amount: params?.line_items?.[0]?.price_data?.unit_amount,
          })
          // Forward the metadata that the webhook needs through the
          // mock checkout URL — without booking_id the webhook can't
          // flip the booking to PAID, and the confirmation email +
          // loyalty/referral side effects don't fire. Real Stripe
          // attaches metadata to the session object directly; in mock
          // mode we shuttle it through the URL because the mock page
          // is what synthesizes the webhook event.
          const md = (params?.metadata || {}) as Record<string, unknown>
          const qs = new URLSearchParams({ session: id })
          if (md.booking_id) qs.set('booking_id', String(md.booking_id))
          if (md.booking_code) qs.set('booking_code', String(md.booking_code))
          if (md.original_amount) qs.set('original_amount', String(md.original_amount))
          if (md.discount_amount) qs.set('discount_amount', String(md.discount_amount))
          if (md.coupon_code) qs.set('coupon_code', String(md.coupon_code))
          const url = `${baseUrl}/checkout/mock?${qs.toString()}`
          return {
            id,
            object: 'checkout.session',
            url,
            payment_status: 'unpaid',
            status: 'open',
            mode: params?.mode || 'payment',
            payment_intent: mockId('pi'),
            customer_email: params?.customer_email || null,
            metadata: params?.metadata || {},
            amount_total: params?.line_items?.[0]?.price_data?.unit_amount || 0,
            currency: params?.line_items?.[0]?.price_data?.currency || 'thb',
            success_url: params?.success_url,
            cancel_url: params?.cancel_url,
          }
        },
        retrieve: async (id: string) => ({
          id,
          object: 'checkout.session',
          payment_status: 'paid',
          status: 'complete',
          payment_intent: mockId('pi'),
        }),
      },
    },

    webhooks: {
      constructEvent: (body: string | Buffer, _signature: string, _secret: string) => {
        // In mock mode the body sent by /checkout/mock is already a fully
        // synthesized webhook event JSON — pass it through as-is.
        try {
          const parsed = typeof body === 'string' ? JSON.parse(body) : JSON.parse(body.toString())
          return parsed
        } catch {
          return {
            id: mockId('evt'),
            type: 'checkout.session.completed',
            data: { object: { id: mockId('cs'), payment_status: 'paid' } },
          }
        }
      },
    },

    accounts: {
      create: async (params: any) => {
        const id = mockId('acct')
        logger.info('mock stripe accounts.create', { accountId: id, email: params?.email })
        return {
          id,
          object: 'account',
          type: params?.type || 'express',
          country: params?.country || 'TH',
          email: params?.email,
          charges_enabled: true,
          details_submitted: true,
          payouts_enabled: true,
          capabilities: { card_payments: 'active', transfers: 'active' },
        }
      },
      retrieve: async (id: string) => ({
        id,
        object: 'account',
        charges_enabled: true,
        details_submitted: true,
        payouts_enabled: true,
        requirements: { currently_due: [], past_due: [], disabled_reason: null },
      }),
    },

    accountLinks: {
      create: async (params: any) => {
        logger.info('mock stripe accountLinks.create', { account: params?.account })
        return {
          object: 'account_link',
          created: Math.floor(Date.now() / 1000),
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          url: params?.return_url || `${baseUrl}/partner/onboarding/complete`,
        }
      },
    },

    refunds: {
      create: async (params: any) => {
        const id = mockId('re')
        logger.info('mock stripe refunds.create', {
          refundId: id,
          paymentIntent: params?.payment_intent,
          amount: params?.amount,
        })
        return {
          id,
          object: 'refund',
          amount: params?.amount || 0,
          currency: 'thb',
          payment_intent: params?.payment_intent,
          status: 'succeeded',
          reason: params?.reason || null,
          created: Math.floor(Date.now() / 1000),
        }
      },
    },

    paymentIntents: {
      retrieve: async (id: string) => ({
        id,
        object: 'payment_intent',
        status: 'succeeded',
        amount: 0,
        currency: 'thb',
      }),
    },

    customers: {
      create: async (params: any) => ({
        id: mockId('cus'),
        object: 'customer',
        email: params?.email,
        name: params?.name,
      }),
    },
  }
}

// ============================================================
// Server-side Stripe (Stripe ฝั่ง Server)
// ============================================================

/**
 * ตัวแปรเก็บ Stripe instance (Singleton pattern)
 */
let stripeInstance: Stripe | null = null
let mockStripeInstance: any = null

/**
 * ดึง Stripe instance สำหรับ Server-side
 *
 * @description Returns the real Stripe SDK if STRIPE_SECRET_KEY is set,
 *              otherwise returns a mock that mimics enough of the SDK
 *              shape for every route in this repo to run without errors.
 */
export function getStripe(): Stripe {
  if (isStripeMockMode()) {
    if (!mockStripeInstance) {
      mockStripeInstance = createMockStripe()
    }
    return mockStripeInstance as Stripe
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }

  return stripeInstance
}

// ============================================================
// Stripe Proxy Object (สำหรับ Backward Compatibility)
// ============================================================

/**
 * Stripe proxy object — provides convenient access to common namespaces.
 * Each getter returns the corresponding namespace from getStripe(),
 * so swapping between real and mock is transparent to callers.
 */
export const stripe = {
  get checkout() {
    return getStripe().checkout
  },
  get webhooks() {
    return getStripe().webhooks
  },
  get accounts() {
    return getStripe().accounts
  },
  get accountLinks() {
    return (getStripe() as any).accountLinks
  },
  get refunds() {
    return (getStripe() as any).refunds
  },
  get paymentIntents() {
    return (getStripe() as any).paymentIntents
  },
  get customers() {
    return (getStripe() as any).customers
  },
}

// ============================================================
// Stripe Connect Functions (ฟังก์ชันสำหรับ Stripe Connect)
// ============================================================

/**
 * สร้าง Stripe Connect Account สำหรับพาร์ทเนอร์
 */
export async function createConnectAccount(email: string, country: string = 'TH') {
  const s = getStripe()

  return await s.accounts.create({
    type: 'express',
    country,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })
}

/**
 * สร้าง Account Link สำหรับให้พาร์ทเนอร์เชื่อมต่อ Stripe Connect
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  const s = getStripe()

  return await s.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  })
}
