import { describe, it, expect, vi } from 'vitest'

// Mock the exchange-rate module before importing currency
vi.mock('@/lib/exchange-rate', () => ({
  convertCurrencyAmount: vi.fn((amount: number) => amount),
}))

import {
  convertCurrency,
  formatCurrency,
  formatCurrencyShort,
  getCurrencyInfo,
  CURRENCY_OPTIONS,
} from '@/lib/currency'
import { Currency } from '@chiangrai/shared/types'

// ============================================================
// convertCurrency
// ============================================================
describe('convertCurrency', () => {
  it('should return same amount for same currency', () => {
    expect(convertCurrency(1000, Currency.THB, Currency.THB)).toBe(1000)
  })

  it('should convert THB to USD', () => {
    const result = convertCurrency(1000, Currency.THB, Currency.USD)
    expect(result).toBeCloseTo(27, 0) // 1000 * 0.027 = 27
  })

  it('should convert USD to THB', () => {
    const result = convertCurrency(100, Currency.USD, Currency.THB)
    expect(result).toBe(3700) // 100 * 37 = 3700
  })

  it('should convert EUR to THB', () => {
    const result = convertCurrency(100, Currency.EUR, Currency.THB)
    expect(result).toBe(4000) // 100 * 40 = 4000
  })

  it('should convert USD to EUR (cross-conversion via THB)', () => {
    const result = convertCurrency(100, Currency.USD, Currency.EUR)
    // 100 USD → 3700 THB → 3700 * 0.025 = 92.5 EUR
    expect(result).toBeCloseTo(92.5, 1)
  })

  it('should convert THB to JPY', () => {
    const result = convertCurrency(1000, Currency.THB, Currency.JPY)
    expect(result).toBeCloseTo(3800, 0) // 1000 * 3.8 = 3800
  })

  it('should convert THB to GBP', () => {
    const result = convertCurrency(1000, Currency.THB, Currency.GBP)
    expect(result).toBeCloseTo(21, 0) // 1000 * 0.021 = 21
  })
})

// ============================================================
// formatCurrency
// ============================================================
describe('formatCurrency', () => {
  it('should format THB without decimals by default', () => {
    const result = formatCurrency(1000, Currency.THB)
    expect(result).toBe('฿1,000')
  })

  it('should format USD with decimals by default', () => {
    const result = formatCurrency(100, Currency.USD)
    expect(result).toBe('$100.00')
  })

  it('should format EUR with decimals', () => {
    const result = formatCurrency(50.5, Currency.EUR)
    expect(result).toBe('€50.50')
  })

  it('should format JPY with symbol', () => {
    const result = formatCurrency(3800, Currency.JPY)
    expect(result).toContain('¥')
  })

  it('should format GBP with symbol', () => {
    const result = formatCurrency(100, Currency.GBP)
    expect(result).toContain('£')
  })

  it('should respect showDecimals option', () => {
    const result = formatCurrency(1000, Currency.THB, { showDecimals: true })
    expect(result).toBe('฿1,000.00')
  })

  it('should format large numbers with commas', () => {
    const result = formatCurrency(1000000, Currency.THB)
    expect(result).toBe('฿1,000,000')
  })
})

// ============================================================
// formatCurrencyShort
// ============================================================
describe('formatCurrencyShort', () => {
  it('should abbreviate thousands as K', () => {
    const result = formatCurrencyShort(1000, Currency.THB)
    expect(result).toBe('฿1.0K')
  })

  it('should abbreviate millions as M', () => {
    const result = formatCurrencyShort(1500000, Currency.USD)
    expect(result).toBe('$1.5M')
  })

  it('should show exact amount for small values', () => {
    const result = formatCurrencyShort(500, Currency.THB)
    expect(result).toBe('฿500')
  })
})

// ============================================================
// getCurrencyInfo
// ============================================================
describe('getCurrencyInfo', () => {
  it('should return THB info', () => {
    const info = getCurrencyInfo(Currency.THB)
    expect(info.symbol).toBe('฿')
    expect(info.label).toContain('THB')
  })

  it('should return USD info', () => {
    const info = getCurrencyInfo(Currency.USD)
    expect(info.symbol).toBe('$')
  })

  it('should return EUR info', () => {
    const info = getCurrencyInfo(Currency.EUR)
    expect(info.symbol).toBe('€')
  })
})

// ============================================================
// CURRENCY_OPTIONS
// ============================================================
describe('CURRENCY_OPTIONS', () => {
  it('should have 6 currency options', () => {
    expect(CURRENCY_OPTIONS).toHaveLength(6)
  })

  it('should contain all supported currencies', () => {
    const values = CURRENCY_OPTIONS.map(opt => opt.value)
    expect(values).toContain(Currency.THB)
    expect(values).toContain(Currency.USD)
    expect(values).toContain(Currency.EUR)
    expect(values).toContain(Currency.JPY)
    expect(values).toContain(Currency.CNY)
    expect(values).toContain(Currency.GBP)
  })

  it('each option should have value, label, and symbol', () => {
    CURRENCY_OPTIONS.forEach(opt => {
      expect(opt).toHaveProperty('value')
      expect(opt).toHaveProperty('label')
      expect(opt).toHaveProperty('symbol')
    })
  })
})
