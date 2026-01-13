/**
 * ============================================================
 * Omise - การตั้งค่าและเชื่อมต่อ Omise Payment Gateway
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ตั้งค่า Omise SDK สำหรับการชำระเงิน
 *   - จัดการ Charge และ Payment Source
 *   - รองรับการชำระด้วยบัตรเครดิต, Internet Banking, TrueMoney, PromptPay
 *
 * Functions:
 *   - getOmise(): ดึง Omise instance สำหรับ Server-side
 *   - omise: Object สำหรับเข้าถึง charges และ sources
 *
 * Environment Variables:
 *   - OMISE_SECRET_KEY: Secret key (Server-side)
 *   - OMISE_PUBLIC_KEY: Public key (Client-side)
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

import Omise from 'omise'

// ============================================================
// Server-side Omise (Omise ฝั่ง Server)
// ============================================================

/**
 * ตัวแปรเก็บ Omise instance (Singleton pattern)
 */
let omiseInstance: Omise.IOmise | null = null

/**
 * ดึง Omise instance สำหรับ Server-side
 *
 * @description ใช้ Singleton pattern เพื่อสร้าง Omise instance เพียงครั้งเดียว
 *
 * @returns Omise instance
 * @throws Error ถ้าไม่ได้ตั้งค่า OMISE_SECRET_KEY
 *
 * @example
 * const omise = getOmise()
 * const charge = await omise.charges.create({...})
 */
export function getOmise(): Omise.IOmise {
  // ถ้ายังไม่มี instance ให้สร้างใหม่
  if (!omiseInstance) {
    // ตรวจสอบว่ามี Secret Key หรือไม่
    if (!process.env.OMISE_SECRET_KEY) {
      throw new Error('OMISE_SECRET_KEY is not set')
    }

    // สร้าง Omise instance ใหม่
    omiseInstance = Omise({
      secretKey: process.env.OMISE_SECRET_KEY,
      omiseVersion: '2019-05-29',
    })
  }

  return omiseInstance
}

// ============================================================
// Omise Proxy Object (สำหรับ Backward Compatibility)
// ============================================================

/**
 * Omise proxy object
 *
 * @description Object ที่ให้เข้าถึง Omise methods ได้สะดวก
 *
 * @example
 * // แทนที่จะเรียก getOmise().charges
 * omise.charges.create({...})
 */
export const omise = {
  /**
   * เข้าถึง Omise Charges API
   */
  get charges() {
    return getOmise().charges
  },

  /**
   * เข้าถึง Omise Sources API
   */
  get sources() {
    return getOmise().sources
  },

  /**
   * เข้าถึง Omise Customers API
   */
  get customers() {
    return getOmise().customers
  },

  /**
   * เข้าถึง Omise Tokens API
   */
  get tokens() {
    return getOmise().tokens
  },
}

// ============================================================
// Omise Helper Functions
// ============================================================

/**
 * สร้าง Charge สำหรับการชำระเงิน
 *
 * @param amount - จำนวนเงิน (ในหน่วยเล็กที่สุด เช่น สตางค์)
 * @param currency - สกุลเงิน (THB, USD, etc.)
 * @param source - Payment source (token, card, etc.)
 * @param metadata - Metadata สำหรับเก็บข้อมูลเพิ่มเติม
 * @returns Omise Charge object
 */
export async function createCharge(
  amount: number,
  currency: string,
  source: string,
  metadata?: Record<string, string>
) {
  const omiseClient = getOmise()
  return await omiseClient.charges.create({
    amount,
    currency: currency.toLowerCase(),
    source,
    metadata,
  })
}

/**
 * สร้าง Payment Source สำหรับ Internet Banking, TrueMoney, PromptPay
 *
 * @param amount - จำนวนเงิน (ในหน่วยเล็กที่สุด)
 * @param currency - สกุลเงิน
 * @param type - ประเภท source (internet_banking_thb, truemoney, promptpay, etc.)
 * @returns Omise Source object
 */
export async function createSource(
  amount: number,
  currency: string,
  type: string
) {
  const omiseClient = getOmise()
  return await omiseClient.sources.create({
    amount,
    currency: currency.toLowerCase(),
    type,
  })
}
