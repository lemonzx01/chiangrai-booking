/**
 * ============================================================
 * Stripe - การตั้งค่าและเชื่อมต่อ Stripe Payment
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ตั้งค่า Stripe SDK สำหรับการชำระเงิน
 *   - รองรับทั้ง Server-side และ Client-side
 *   - ใช้ Lazy initialization เพื่อหลีกเลี่ยง build-time errors
 *
 * การทำงานหลัก:
 *   - getStripe(): ดึง Stripe instance สำหรับ Server-side
 *   - stripe: Object สำหรับเข้าถึง checkout และ webhooks
 *   - getStripePromise(): ดึง Stripe instance สำหรับ Client-side
 *
 * Environment Variables ที่ต้องการ:
 *   - STRIPE_SECRET_KEY: Secret key (Server-side)
 *   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Publishable key (Client-side)
 *
 * ============================================================
 */

// ============================================================
// Imports
// ============================================================

import Stripe from 'stripe'

// ============================================================
// Server-side Stripe (Stripe ฝั่ง Server)
// ============================================================

/**
 * ตัวแปรเก็บ Stripe instance (Singleton pattern)
 * @description ใช้ Lazy initialization เพื่อหลีกเลี่ยง error ตอน build
 */
let stripeInstance: Stripe | null = null

/**
 * ดึง Stripe instance สำหรับ Server-side
 *
 * @description ใช้ Singleton pattern เพื่อสร้าง Stripe instance เพียงครั้งเดียว
 *              และใช้ซ้ำตลอด lifecycle ของ application
 *
 * @returns Stripe instance
 * @throws Error ถ้าไม่ได้ตั้งค่า STRIPE_SECRET_KEY
 *
 * @example
 * const stripe = getStripe()
 * const session = await stripe.checkout.sessions.create({...})
 */
export function getStripe(): Stripe {
  // ถ้ายังไม่มี instance ให้สร้างใหม่
  if (!stripeInstance) {
    // ตรวจสอบว่ามี Secret Key หรือไม่
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }

    // สร้าง Stripe instance ใหม่
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover', // ระบุ API version
      typescript: true, // เปิดใช้ TypeScript support
    })
  }

  return stripeInstance
}

// ============================================================
// Stripe Proxy Object (สำหรับ Backward Compatibility)
// ============================================================

/**
 * Stripe proxy object
 *
 * @description Object ที่ให้เข้าถึง Stripe methods ได้สะดวก
 *              ใช้ getter เพื่อ lazy initialization
 *
 * @example
 * // แทนที่จะเรียก getStripe().checkout
 * stripe.checkout.sessions.create({...})
 *
 * // ตรวจสอบ webhook signature
 * stripe.webhooks.constructEvent(body, sig, secret)
 */
export const stripe = {
  /**
   * เข้าถึง Stripe Checkout API
   * @description ใช้สำหรับสร้าง checkout sessions
   */
  get checkout() {
    return getStripe().checkout
  },

  /**
   * เข้าถึง Stripe Webhooks API
   * @description ใช้สำหรับตรวจสอบ webhook events
   */
  get webhooks() {
    return getStripe().webhooks
  },

  /**
   * เข้าถึง Stripe Connect API
   * @description ใช้สำหรับจัดการ Connect accounts และ payments
   */
  get connect() {
    return getStripe().connect
  },

  /**
   * เข้าถึง Stripe Accounts API
   * @description ใช้สำหรับจัดการ accounts
   */
  get accounts() {
    return getStripe().accounts
  },
}

// ============================================================
// Client-side Stripe (Stripe ฝั่ง Client)
// ============================================================

/**
 * ดึง Stripe Promise สำหรับ Client-side
 *
 * @description ใช้สำหรับ Client-side Stripe operations
 *              เช่น redirect ไปยัง Checkout page
 *
 * @returns Promise ที่ resolve เป็น Stripe instance
 *
 * @example
 * const stripePromise = await getStripePromise()
 * if (stripePromise) {
 *   await stripePromise.redirectToCheckout({ sessionId })
 * }
 */
export const getStripePromise = async () => {
  // Dynamic import เพื่อลดขนาด bundle
  const { loadStripe } = await import('@stripe/stripe-js')

  // โหลด Stripe ด้วย Publishable Key
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}

// ============================================================
// Stripe Connect Functions (ฟังก์ชันสำหรับ Stripe Connect)
// ============================================================

/**
 * สร้าง Stripe Connect Account สำหรับพาร์ทเนอร์
 *
 * @description สร้าง Connect account สำหรับพาร์ทเนอร์เพื่อรับเงินโดยตรง
 *              ใช้แบบ Express account (ง่ายและรวดเร็ว)
 *
 * @param email - อีเมลของพาร์ทเนอร์
 * @param country - ประเทศ (default: 'TH' สำหรับไทย)
 * @returns Connect account object
 *
 * @example
 * const account = await createConnectAccount('partner@example.com', 'TH')
 */
export async function createConnectAccount(email: string, country: string = 'TH') {
  const stripe = getStripe()

  return await stripe.accounts.create({
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
 *
 * @description สร้าง link สำหรับให้พาร์ทเนอร์กรอกข้อมูลและเชื่อมต่อ account
 *
 * @param accountId - Stripe Connect account ID
 * @param returnUrl - URL สำหรับ redirect กลับมาหลังจากเชื่อมต่อเสร็จ
 * @param refreshUrl - URL สำหรับ refresh link เมื่อหมดอายุ
 * @returns Account link object
 *
 * @example
 * const link = await createAccountLink('acct_xxx', 'https://example.com/return', 'https://example.com/refresh')
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  const stripe = getStripe()

  return await stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  })
}
