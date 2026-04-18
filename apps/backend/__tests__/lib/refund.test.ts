import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { calculateRefundPercentage, calculateRefundAmount } from '@/lib/refund'

describe('calculateRefundPercentage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 100% when check-in is exactly 7 days away', () => {
    vi.setSystemTime(new Date('2026-04-01T00:00:00Z'))
    expect(calculateRefundPercentage('2026-04-08')).toBe(100)
  })

  it('returns 100% when check-in is 8 days away', () => {
    vi.setSystemTime(new Date('2026-04-01T00:00:00Z'))
    expect(calculateRefundPercentage('2026-04-09')).toBe(100)
  })

  it('returns 50% when check-in is exactly 3 days away', () => {
    vi.setSystemTime(new Date('2026-04-01T00:00:00Z'))
    expect(calculateRefundPercentage('2026-04-04')).toBe(50)
  })

  it('returns 50% when check-in is 6 days away', () => {
    vi.setSystemTime(new Date('2026-04-01T00:00:00Z'))
    expect(calculateRefundPercentage('2026-04-07')).toBe(50)
  })

  it('returns 0% when check-in is 2 days away', () => {
    vi.setSystemTime(new Date('2026-04-01T00:00:00Z'))
    expect(calculateRefundPercentage('2026-04-03')).toBe(0)
  })

  it('returns 0% when check-in is today', () => {
    vi.setSystemTime(new Date('2026-04-01T00:00:00Z'))
    expect(calculateRefundPercentage('2026-04-01')).toBe(0)
  })

  it('returns 0% when check-in is in the past', () => {
    vi.setSystemTime(new Date('2026-04-01T00:00:00Z'))
    expect(calculateRefundPercentage('2026-03-30')).toBe(0)
  })

  it('does NOT inflate days due to time-of-day (late evening)', () => {
    // Old buggy version: 23:59 → diffMs = 6 days + 1 minute → ceil → 7 → 100%
    // New version: difference in calendar days = 6 → 50%
    vi.setSystemTime(new Date('2026-04-01T23:59:00Z'))
    expect(calculateRefundPercentage('2026-04-07')).toBe(50)
  })

  it('handles midnight crossing in the same way', () => {
    vi.setSystemTime(new Date('2026-04-01T00:00:01Z'))
    expect(calculateRefundPercentage('2026-04-08')).toBe(100)
  })
})

describe('calculateRefundAmount', () => {
  it('handles 100% refund', () => {
    expect(calculateRefundAmount(1500, 100)).toBe(1500)
  })
  it('handles 50% refund', () => {
    expect(calculateRefundAmount(1500, 50)).toBe(750)
  })
  it('handles 0% refund', () => {
    expect(calculateRefundAmount(1500, 0)).toBe(0)
  })
  it('rounds to 2 decimals', () => {
    expect(calculateRefundAmount(1234.56, 50)).toBe(617.28)
  })
})
