import { Currency } from './types'

const EXCHANGE_RATES: Record<Currency, number> = {
  [Currency.THB]: 1.0,
  [Currency.USD]: 0.027,
  [Currency.EUR]: 0.025,
  [Currency.JPY]: 3.8,
  [Currency.CNY]: 0.19,
  [Currency.GBP]: 0.021,
}

const REVERSE_RATES: Record<Currency, number> = {
  [Currency.THB]: 1.0,
  [Currency.USD]: 37.0,
  [Currency.EUR]: 40.0,
  [Currency.JPY]: 0.26,
  [Currency.CNY]: 5.3,
  [Currency.GBP]: 47.6,
}

export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  let amountInTHB: number
  if (fromCurrency === Currency.THB) {
    amountInTHB = amount
  } else {
    amountInTHB = amount * REVERSE_RATES[fromCurrency]
  }

  if (toCurrency === Currency.THB) {
    return amountInTHB
  } else {
    return amountInTHB * EXCHANGE_RATES[toCurrency]
  }
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.THB]: '฿',
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.JPY]: '¥',
  [Currency.CNY]: '¥',
  [Currency.GBP]: '£',
}

export function formatCurrency(
  amount: number,
  currency: Currency,
  options?: {
    showDecimals?: boolean
    decimals?: number
  }
): string {
  const symbol = CURRENCY_SYMBOLS[currency]
  const showDecimals =
    options?.showDecimals !== undefined
      ? options.showDecimals
      : currency !== Currency.THB

  const decimals = options?.decimals ?? 2

  const formattedAmount = showDecimals
    ? amount.toFixed(decimals)
    : Math.round(amount).toString()

  const parts = formattedAmount.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return `${symbol}${parts.join('.')}`
}

export function formatCurrencyShort(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency]

  if (amount >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}K`
  }

  return formatCurrency(amount, currency, { showDecimals: false })
}

export const CURRENCY_OPTIONS = [
  { value: Currency.THB, label: 'บาทไทย (THB)', symbol: '฿' },
  { value: Currency.USD, label: 'ดอลลาร์สหรัฐ (USD)', symbol: '$' },
  { value: Currency.EUR, label: 'ยูโร (EUR)', symbol: '€' },
  { value: Currency.JPY, label: 'เยนญี่ปุ่น (JPY)', symbol: '¥' },
  { value: Currency.CNY, label: 'หยวนจีน (CNY)', symbol: '¥' },
  { value: Currency.GBP, label: 'ปอนด์อังกฤษ (GBP)', symbol: '£' },
]

export function getCurrencyInfo(currency: Currency) {
  return CURRENCY_OPTIONS.find((opt) => opt.value === currency) || CURRENCY_OPTIONS[0]
}
