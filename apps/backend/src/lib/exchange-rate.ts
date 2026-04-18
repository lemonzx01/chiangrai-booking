/**
 * ============================================================
 * Exchange Rate - ดึงอัตราแลกเปลี่ยนจาก Database
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ดึงอัตราแลกเปลี่ยนจาก database
 *   - Cache อัตราแลกเปลี่ยนเพื่อลด database queries
 *   - รองรับ fallback ถ้า database ล้มเหลว
 *
 * ============================================================
 */

import { Currency } from '@chiangrai/shared/types'
import { createAdminClient } from './supabase/server'
import { logger } from './logger'

// ============================================================
// Exchange Rate Cache
// ============================================================

/**
 * Cache สำหรับอัตราแลกเปลี่ยน
 */
interface ExchangeRateCache {
  rates: Record<string, number>
  timestamp: number
  baseCurrency: string
}

/** Cache instance */
let rateCache: ExchangeRateCache | null = null

/** Cache duration (1 ชั่วโมง = 3600000 ms) */
const CACHE_DURATION = 60 * 60 * 1000

// ============================================================
// Exchange Rate API
// ============================================================

/**
 * ดึงอัตราแลกเปลี่ยนจาก Database
 *
 * @param baseCurrency - สกุลเงินฐาน (default: 'THB')
 * @returns อัตราแลกเปลี่ยน
 *
 * @example
 * const rates = await fetchExchangeRates('THB')
 */
export async function fetchExchangeRates(
  baseCurrency: string = 'THB'
): Promise<Record<string, number>> {
  // ตรวจสอบ cache ก่อน
  if (
    rateCache &&
    rateCache.baseCurrency === baseCurrency &&
    Date.now() - rateCache.timestamp < CACHE_DURATION
  ) {
    return rateCache.rates
  }

  try {
    // ดึงอัตราแลกเปลี่ยนจาก database
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('target_currency, rate')
      .eq('base_currency', baseCurrency)

    if (error) {
      throw new Error(`Failed to fetch exchange rates: ${error.message}`)
    }

    // แปลงข้อมูลเป็น object
    const rates: Record<string, number> = {}
    if (data && data.length > 0) {
      for (const row of data) {
        rates[row.target_currency] = parseFloat(row.rate.toString())
      }
    }

    // ถ้าไม่มีข้อมูลใน database ให้ใช้ค่า default
    if (Object.keys(rates).length === 0) {
      logger.warn('No exchange rates found in database, using defaults', { baseCurrency })
      return getDefaultExchangeRates(baseCurrency)
    }

    // อัพเดท cache
    rateCache = {
      rates,
      timestamp: Date.now(),
      baseCurrency,
    }

    return rates
  } catch (error) {
    logger.error('Exchange rate database error', { error })

    // Fallback: ใช้ค่า cache ถ้ามี
    if (rateCache && rateCache.baseCurrency === baseCurrency) {
      return rateCache.rates
    }

    // Fallback: ใช้ค่า hardcoded
    return getDefaultExchangeRates(baseCurrency)
  }
}

/**
 * ดึงอัตราแลกเปลี่ยนแบบ default (hardcoded)
 * ใช้เมื่อ API ล้มเหลว
 */
function getDefaultExchangeRates(baseCurrency: string): Record<string, number> {
  // อัตราแลกเปลี่ยนประมาณ (อัพเดทเมื่อจำเป็น)
  const defaultRates: Record<string, Record<string, number>> = {
    THB: {
      USD: 0.027,
      EUR: 0.025,
      JPY: 3.8,
      CNY: 0.19,
      GBP: 0.021,
    },
    USD: {
      THB: 37.0,
      EUR: 0.92,
      JPY: 140.0,
      CNY: 7.0,
      GBP: 0.79,
    },
    EUR: {
      THB: 40.0,
      USD: 1.09,
      JPY: 152.0,
      CNY: 7.6,
      GBP: 0.86,
    },
  }

  return defaultRates[baseCurrency] || {}
}

/**
 * แปลงราคาจากสกุลเงินหนึ่งไปยังอีกสกุลเงินหนึ่ง
 *
 * @param amount - จำนวนเงิน
 * @param fromCurrency - สกุลเงินต้นทาง
 * @param toCurrency - สกุลเงินปลายทาง
 * @returns จำนวนเงินที่แปลงแล้ว
 *
 * @example
 * const converted = await convertCurrencyAmount(1000, Currency.THB, Currency.USD)
 */
export async function convertCurrencyAmount(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  // ถ้าเป็นสกุลเงินเดียวกัน ไม่ต้องแปลง
  if (fromCurrency === toCurrency) {
    return amount
  }

  // ดึงอัตราแลกเปลี่ยน
  const rates = await fetchExchangeRates(fromCurrency)

  // แปลงราคา
  const rate = rates[toCurrency]
  if (!rate) {
    logger.warn('Exchange rate not found, using 1:1', { toCurrency })
    return amount
  }

  return amount * rate
}

/**
 * อัพเดท cache (สำหรับใช้ใน cron job หรือ manual update)
 */
export async function refreshExchangeRates(
  baseCurrency: string = 'THB'
): Promise<void> {
  rateCache = null
  await fetchExchangeRates(baseCurrency)
}

/**
 * อัพเดทอัตราแลกเปลี่ยนใน database
 *
 * @param baseCurrency - สกุลเงินฐาน
 * @param targetCurrency - สกุลเงินปลายทาง
 * @param rate - อัตราแลกเปลี่ยน
 *
 * @example
 * await updateExchangeRate('THB', 'USD', 0.027)
 */
export async function updateExchangeRate(
  baseCurrency: string,
  targetCurrency: string,
  rate: number
): Promise<void> {
  try {
    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('exchange_rates')
      .upsert(
        {
          base_currency: baseCurrency,
          target_currency: targetCurrency,
          rate: rate,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'base_currency,target_currency',
        }
      )

    if (error) {
      throw new Error(`Failed to update exchange rate: ${error.message}`)
    }

    // Invalidate cache
    if (rateCache && rateCache.baseCurrency === baseCurrency) {
      rateCache = null
    }
  } catch (error) {
    logger.error('Failed to update exchange rate', { error })
    throw error
  }
}
