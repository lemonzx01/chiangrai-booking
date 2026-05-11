/**
 * ============================================================
 * Currency Utility - ฟังก์ชันช่วยสำหรับจัดการสกุลเงิน
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แปลงสกุลเงินระหว่าง THB, USD, EUR
 *   - Format ราคาตามสกุลเงิน
 *   - เก็บอัตราแลกเปลี่ยน (สามารถใช้ API ได้ในอนาคต)
 *
 * ============================================================
 */

import { Currency } from '@chiangrai/shared/types'
import { convertCurrencyAmount } from './exchange-rate'
import { logger } from './logger'

// ============================================================
// Exchange Rates (อัตราแลกเปลี่ยน)
// ============================================================

/**
 * อัตราแลกเปลี่ยนคงที่ (fallback เมื่อ API ล้มเหลว)
 * Base currency: THB
 */
const EXCHANGE_RATES: Record<Currency, number> = {
  [Currency.THB]: 1.0, // Base currency
  [Currency.USD]: 0.027, // 1 THB = 0.027 USD (ประมาณ)
  [Currency.EUR]: 0.025, // 1 THB = 0.025 EUR (ประมาณ)
  [Currency.JPY]: 3.8, // 1 THB = 3.8 JPY (ประมาณ)
  [Currency.CNY]: 0.19, // 1 THB = 0.19 CNY (ประมาณ)
  [Currency.GBP]: 0.021, // 1 THB = 0.021 GBP (ประมาณ)
}

/**
 * อัตราแลกเปลี่ยนย้อนกลับ (จาก base currency ไปยังสกุลเงินอื่น)
 */
const REVERSE_RATES: Record<Currency, number> = {
  [Currency.THB]: 1.0,
  [Currency.USD]: 37.0, // 1 USD = 37 THB (ประมาณ)
  [Currency.EUR]: 40.0, // 1 EUR = 40 THB (ประมาณ)
  [Currency.JPY]: 0.26, // 1 JPY = 0.26 THB (ประมาณ)
  [Currency.CNY]: 5.3, // 1 CNY = 5.3 THB (ประมาณ)
  [Currency.GBP]: 47.6, // 1 GBP = 47.6 THB (ประมาณ)
}

// Module-level cache so we only hit the upstream API once every 12h.
const RATES_TTL_MS = 12 * 60 * 60 * 1000
let ratesCache: { fetchedAt: number } | null = null

// ============================================================
// Currency Conversion (แปลงสกุลเงิน)
// ============================================================

/**
 * แปลงราคาจากสกุลเงินหนึ่งไปยังอีกสกุลเงินหนึ่ง
 * ใช้ค่า hardcoded (สำหรับ client-side หรือ fallback)
 *
 * @param amount - จำนวนเงิน
 * @param fromCurrency - สกุลเงินต้นทาง
 * @param toCurrency - สกุลเงินปลายทาง
 * @returns จำนวนเงินที่แปลงแล้ว
 *
 * @example
 * convertCurrency(1000, Currency.THB, Currency.USD) // 27
 * convertCurrency(100, Currency.USD, Currency.THB) // 3700
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  // ถ้าเป็นสกุลเงินเดียวกัน ไม่ต้องแปลง
  if (fromCurrency === toCurrency) {
    return amount
  }

  // แปลงเป็น THB ก่อน (base currency)
  let amountInTHB: number
  if (fromCurrency === Currency.THB) {
    amountInTHB = amount
  } else {
    // แปลงจากสกุลเงินอื่นเป็น THB
    amountInTHB = amount * REVERSE_RATES[fromCurrency]
  }

  // แปลงจาก THB ไปยังสกุลเงินปลายทาง
  if (toCurrency === Currency.THB) {
    return amountInTHB
  } else {
    return amountInTHB * EXCHANGE_RATES[toCurrency]
  }
}

/**
 * แปลงราคาจากสกุลเงินหนึ่งไปยังอีกสกุลเงินหนึ่ง (ใช้ API)
 * สำหรับ server-side ที่ต้องการอัตราแลกเปลี่ยนล่าสุด
 *
 * @param amount - จำนวนเงิน
 * @param fromCurrency - สกุลเงินต้นทาง
 * @param toCurrency - สกุลเงินปลายทาง
 * @returns จำนวนเงินที่แปลงแล้ว
 *
 * @example
 * await convertCurrencyWithAPI(1000, Currency.THB, Currency.USD)
 */
export async function convertCurrencyWithAPI(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  return convertCurrencyAmount(amount, fromCurrency, toCurrency)
}

// ============================================================
// Currency Formatting (Format ราคา)
// ============================================================

/**
 * สัญลักษณ์สกุลเงิน
 */
const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.THB]: '฿',
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.JPY]: '¥',
  [Currency.CNY]: '¥',
  [Currency.GBP]: '£',
}

/**
 * Format ราคาตามสกุลเงิน
 *
 * @param amount - จำนวนเงิน
 * @param currency - สกุลเงิน
 * @param options - ตัวเลือกเพิ่มเติม
 * @returns ข้อความที่ format แล้ว
 *
 * @example
 * formatCurrency(1000, Currency.THB) // "฿1,000"
 * formatCurrency(100, Currency.USD) // "$100.00"
 * formatCurrency(50, Currency.EUR) // "€50.00"
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  options?: {
    /** แสดงทศนิยมหรือไม่ (default: true สำหรับ USD/EUR, false สำหรับ THB) */
    showDecimals?: boolean
    /** จำนวนตำแหน่งทศนิยม (default: 2) */
    decimals?: number
  }
): string {
  const symbol = CURRENCY_SYMBOLS[currency]
  const showDecimals =
    options?.showDecimals !== undefined
      ? options.showDecimals
      : currency !== Currency.THB

  const decimals = options?.decimals ?? 2

  // Format ตัวเลข
  const formattedAmount = showDecimals
    ? amount.toFixed(decimals)
    : Math.round(amount).toString()

  // เพิ่ม comma สำหรับตัวเลขที่มาก
  const parts = formattedAmount.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return `${symbol}${parts.join('.')}`
}

/**
 * Format ราคาแบบย่อ (สำหรับแสดงใน UI)
 *
 * @param amount - จำนวนเงิน
 * @param currency - สกุลเงิน
 * @returns ข้อความที่ format แล้วแบบย่อ
 *
 * @example
 * formatCurrencyShort(1000, Currency.THB) // "฿1K"
 * formatCurrencyShort(1000000, Currency.USD) // "$1M"
 */
export function formatCurrencyShort(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency]

  if (amount >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}K`
  }

  return formatCurrency(amount, currency, { showDecimals: false })
}

// ============================================================
// Currency Selector Options (ตัวเลือกสำหรับ Selector)
// ============================================================

/**
 * ตัวเลือกสกุลเงินสำหรับใช้ใน Selector
 */
export const CURRENCY_OPTIONS = [
  { value: Currency.THB, label: 'บาทไทย (THB)', symbol: '฿' },
  { value: Currency.USD, label: 'ดอลลาร์สหรัฐ (USD)', symbol: '$' },
  { value: Currency.EUR, label: 'ยูโร (EUR)', symbol: '€' },
  { value: Currency.JPY, label: 'เยนญี่ปุ่น (JPY)', symbol: '¥' },
  { value: Currency.CNY, label: 'หยวนจีน (CNY)', symbol: '¥' },
  { value: Currency.GBP, label: 'ปอนด์อังกฤษ (GBP)', symbol: '£' },
]

/**
 * ดึงข้อมูลสกุลเงินตามค่า
 *
 * @param currency - สกุลเงิน
 * @returns ข้อมูลสกุลเงิน
 */
export function getCurrencyInfo(currency: Currency) {
  return CURRENCY_OPTIONS.find((opt) => opt.value === currency) || CURRENCY_OPTIONS[0]
}

// ============================================================
// Update Exchange Rates (อัปเดตอัตราแลกเปลี่ยน)
// ============================================================

/**
 * อัปเดตอัตราแลกเปลี่ยนจาก API
 * Fetches latest THB-base rates from frankfurter.app and refreshes
 * both EXCHANGE_RATES and REVERSE_RATES in place.
 *
 * @example
 * await updateExchangeRates()
 */
export async function updateExchangeRates(): Promise<void> {
  const now = Date.now()
  if (ratesCache && now - ratesCache.fetchedAt < RATES_TTL_MS) {
    return
  }
  // Mark the attempt now so repeated callers within the TTL don't all race the API.
  ratesCache = { fetchedAt: now }

  const targets: Currency[] = [
    Currency.USD,
    Currency.EUR,
    Currency.JPY,
    Currency.CNY,
    Currency.GBP,
  ]
  const url = `https://api.frankfurter.app/latest?from=THB&to=${targets.join(',')}`

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) {
      logger.warn('Exchange rates fetch returned non-OK', { status: response.status })
      return
    }
    const payload = (await response.json()) as {
      rates?: Partial<Record<string, number>>
    }
    const rates = payload?.rates
    if (!rates) {
      logger.warn('Exchange rates fetch missing rates field')
      return
    }

    for (const code of targets) {
      const rate = rates[code]
      if (typeof rate === 'number' && rate > 0) {
        EXCHANGE_RATES[code] = rate
        REVERSE_RATES[code] = 1 / rate
      }
    }
    ratesCache = { fetchedAt: Date.now() }
    logger.info('Exchange rates updated', { source: 'frankfurter.app' })
  } catch (error) {
    logger.warn('Exchange rates fetch failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Reset the in-memory cache. Test-only helper.
 */
export function __resetExchangeRateCacheForTests(): void {
  ratesCache = null
}









