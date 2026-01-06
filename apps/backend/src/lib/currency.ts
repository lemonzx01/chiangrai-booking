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

import { Currency } from '@/types'

// ============================================================
// Exchange Rates (อัตราแลกเปลี่ยน)
// ============================================================

/**
 * อัตราแลกเปลี่ยนคงที่ (สามารถใช้ API แทนได้ในอนาคต)
 * Base currency: THB
 */
const EXCHANGE_RATES: Record<Currency, number> = {
  [Currency.THB]: 1.0, // Base currency
  [Currency.USD]: 0.027, // 1 THB = 0.027 USD (ประมาณ)
  [Currency.EUR]: 0.025, // 1 THB = 0.025 EUR (ประมาณ)
}

/**
 * อัตราแลกเปลี่ยนย้อนกลับ (จาก base currency ไปยังสกุลเงินอื่น)
 */
const REVERSE_RATES: Record<Currency, number> = {
  [Currency.THB]: 1.0,
  [Currency.USD]: 37.0, // 1 USD = 37 THB (ประมาณ)
  [Currency.EUR]: 40.0, // 1 EUR = 40 THB (ประมาณ)
}

// ============================================================
// Currency Conversion (แปลงสกุลเงิน)
// ============================================================

/**
 * แปลงราคาจากสกุลเงินหนึ่งไปยังอีกสกุลเงินหนึ่ง
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
 * อัปเดตอัตราแลกเปลี่ยนจาก API (สำหรับใช้ในอนาคต)
 *
 * @description สามารถเรียก API เช่น exchangerate-api.com เพื่อดึงอัตราแลกเปลี่ยนล่าสุด
 *
 * @example
 * await updateExchangeRates()
 */
export async function updateExchangeRates(): Promise<void> {
  // TODO: เรียก API เพื่อดึงอัตราแลกเปลี่ยนล่าสุด
  // เช่น: const rates = await fetch('https://api.exchangerate-api.com/v4/latest/THB')
  // แล้วอัปเดต EXCHANGE_RATES และ REVERSE_RATES
  console.log('Exchange rates update not implemented yet')
}









