/**
 * Loyalty helpers tests
 *
 * Locks in the contract that earning is idempotent and rejects
 * obvious bad inputs before touching the DB.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const fromMock = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(async () => ({
    from: fromMock,
    rpc: vi.fn(async () => ({
      // Pretend RPC isn't available; the lib will fall back to
      // read-modify-write, which we'll exercise via fromMock.
      error: { message: 'rpc unavailable' },
    })),
  })),
}))

import {
  calculatePointsForAmount,
  awardPointsForBooking,
  redeemPointsForCoupon,
  REDEEM_TIERS,
} from '@/lib/loyalty'

beforeEach(() => {
  vi.clearAllMocks()
  fromMock.mockReset()
  // Reset rate envs between tests so state doesn't leak.
  delete process.env.LOYALTY_RATE_THB_PER_POINT
})

describe('calculatePointsForAmount', () => {
  it('default rate: 1 point per ฿100, floored', () => {
    expect(calculatePointsForAmount(100)).toBe(1)
    expect(calculatePointsForAmount(1500)).toBe(15)
    // 199 floors to 1, not rounds to 2.
    expect(calculatePointsForAmount(199)).toBe(1)
    expect(calculatePointsForAmount(99)).toBe(0)
  })

  it('honors LOYALTY_RATE_THB_PER_POINT env override', () => {
    process.env.LOYALTY_RATE_THB_PER_POINT = '50'
    expect(calculatePointsForAmount(1500)).toBe(30)
    expect(calculatePointsForAmount(100)).toBe(2)
  })

  it('falls back to default for invalid env values', () => {
    process.env.LOYALTY_RATE_THB_PER_POINT = '0' // would divide by zero
    expect(calculatePointsForAmount(1500)).toBe(15)

    process.env.LOYALTY_RATE_THB_PER_POINT = 'banana'
    expect(calculatePointsForAmount(1500)).toBe(15)
  })

  it('returns 0 for non-positive / non-finite amounts', () => {
    expect(calculatePointsForAmount(0)).toBe(0)
    expect(calculatePointsForAmount(-100)).toBe(0)
    expect(calculatePointsForAmount(NaN)).toBe(0)
    expect(calculatePointsForAmount(Infinity)).toBe(0)
  })
})

describe('awardPointsForBooking', () => {
  it('returns unknown_user for empty email without DB calls', async () => {
    const result = await awardPointsForBooking({
      customerEmail: '',
      bookingId: 'b1',
      amountThb: 1500,
    })
    expect(result).toEqual({
      awarded: false,
      points: 0,
      reason: 'unknown_user',
    })
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('returns zero_points for amounts below the rate floor', async () => {
    const result = await awardPointsForBooking({
      customerEmail: 'user@example.com',
      bookingId: 'b1',
      amountThb: 50, // below ฿100 default rate → 0 points
    })
    expect(result.awarded).toBe(false)
    expect(result.reason).toBe('zero_points')
    // Should short-circuit BEFORE touching the DB — no point
    // resolving the user only to drop the result.
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('returns unknown_user when the email maps to no user', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            ilike: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })

    const result = await awardPointsForBooking({
      customerEmail: 'ghost@example.com',
      bookingId: 'b1',
      amountThb: 1500,
    })
    expect(result.reason).toBe('unknown_user')
  })

  it('treats a 23505 unique violation as already_awarded (idempotent)', async () => {
    // Simulate the DB rejecting the second insert because the
    // partial unique index on (source_id, kind=earn) fired.
    fromMock.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            ilike: () => ({
              maybeSingle: async () => ({
                data: { id: 'u1', email: 'u@x.com' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'loyalty_ledger') {
        return {
          insert: async () => ({
            error: { code: '23505', message: 'duplicate' },
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })

    const result = await awardPointsForBooking({
      customerEmail: 'u@x.com',
      bookingId: 'b1',
      amountThb: 1500,
    })
    expect(result).toEqual({
      awarded: false,
      points: 0,
      reason: 'already_awarded',
    })
  })

  it('returns awarded=true with the right point amount on a fresh insert', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'users') {
        // Two interactions: 1) lookup by email, 2) update counter
        let callCount = 0
        return {
          select: () => ({
            ilike: () => ({
              maybeSingle: async () => ({
                data: { id: 'u1', email: 'u@x.com' },
                error: null,
              }),
            }),
            // Counter read for the fallback path
            eq: () => ({
              maybeSingle: async () => ({
                data: { loyalty_points: 0 },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: async () => {
              callCount++
              return { error: null }
            },
          }),
        }
      }
      if (table === 'loyalty_ledger') {
        return {
          insert: async () => ({ error: null }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })

    const result = await awardPointsForBooking({
      customerEmail: 'u@x.com',
      bookingId: 'b1',
      amountThb: 1500,
      bookingCode: 'TE26-AB12',
    })
    expect(result.awarded).toBe(true)
    expect(result.points).toBe(15)
  })
})

describe('redeemPointsForCoupon', () => {
  it('rejects an invalid tier without DB calls', async () => {
    const result = await redeemPointsForCoupon({
      userId: 'u1',
      points: 137, // not a real tier
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('invalid_tier')
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('rejects unknown user before any decrement', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })

    const result = await redeemPointsForCoupon({
      userId: 'ghost',
      points: 100,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('unknown_user')
  })

  it('rejects when balance is below cost', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: 'u1', email: 'u@x.com', loyalty_points: 50 },
                error: null,
              }),
            }),
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })

    const result = await redeemPointsForCoupon({
      userId: 'u1',
      points: 100, // tier exists, but balance is only 50
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('insufficient_points')
  })

  it('returns race_lost when conditional UPDATE matches no rows', async () => {
    // Pre-flight check sees balance=100, but the UPDATE comes
    // back empty (a concurrent redemption already drained the
    // points). This is the contention path.
    fromMock.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: 'u1', email: 'u@x.com', loyalty_points: 100 },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              gte: () => ({
                select: async () => ({ data: [], error: null }),
              }),
            }),
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })

    const result = await redeemPointsForCoupon({
      userId: 'u1',
      points: 100,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('race_lost')
  })

  it('returns ok with coupon code on a fresh redemption', async () => {
    // Track call counts to verify the order: user lookup,
    // user update, coupon insert, ledger insert.
    let userUpdateCalls = 0
    let couponInserts = 0
    let ledgerInserts = 0

    fromMock.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: 'u1', email: 'u@x.com', loyalty_points: 200 },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              gte: () => ({
                select: async () => {
                  userUpdateCalls++
                  return {
                    data: [{ loyalty_points: 100 }],
                    error: null,
                  }
                },
              }),
            }),
          }),
        }
      }
      if (table === 'coupons') {
        return {
          insert: async () => {
            couponInserts++
            return { error: null }
          },
        }
      }
      if (table === 'loyalty_ledger') {
        return {
          insert: async () => {
            ledgerInserts++
            return { error: null }
          },
        }
      }
      throw new Error(`unexpected table ${table}`)
    })

    const result = await redeemPointsForCoupon({
      userId: 'u1',
      points: 100,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.couponCode).toMatch(/^REDEEM-[A-Z0-9]+$/)
      expect(result.pointsRemaining).toBe(100)
      expect(result.valueThb).toBe(REDEEM_TIERS[0].valueThb)
    }
    expect(userUpdateCalls).toBe(1)
    expect(couponInserts).toBe(1)
    expect(ledgerInserts).toBe(1)
  })
})
