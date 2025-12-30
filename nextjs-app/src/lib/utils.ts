import { type ClassValue, clsx } from 'clsx'

// Classname utility
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format currency (Thai Baht)
export function formatCurrency(amount: number, locale: string = 'th-TH'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format date
export function formatDate(date: string | Date, locale: string = 'th-TH'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format date range
export function formatDateRange(
  startDate: string | Date,
  endDate: string | Date,
  locale: string = 'th-TH'
): string {
  return `${formatDate(startDate, locale)} - ${formatDate(endDate, locale)}`
}

// Calculate number of nights
export function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  const start = typeof checkIn === 'string' ? new Date(checkIn) : checkIn
  const end = typeof checkOut === 'string' ? new Date(checkOut) : checkOut
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Calculate total price
export function calculateTotalPrice(
  pricePerUnit: number,
  units: number
): number {
  return pricePerUnit * units
}

// Generate booking code
export function generateBookingCode(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TE${year}${month}${day}-${random}`
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate Thai phone number
export function isValidThaiPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s-]/g, '')
  const phoneRegex = /^(0[689]\d{8}|0[23457]\d{7})$/
  return phoneRegex.test(cleanPhone)
}

// Slugify string
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Delay utility (for loading states)
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Parse search params to object
export function parseSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

// Safe JSON parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

// Check if string is valid UUID
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}
