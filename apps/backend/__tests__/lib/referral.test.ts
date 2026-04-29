/**
 * Referral helpers — covers the contract that other tests depend on:
 *   - resolveReferrer rejects malformed/empty codes BEFORE hitting the DB
 *   - recordReferral refuses self-referrals (defense-in-depth alongside
 *     the DB CHECK constraint)
 *
 * The full happy-path (lookup → insert → unique violation) is exercised
 * indirectly by the register-endpoint test; here we just lock in the
 * input-validation gates so a future refactor can't accidentally
 * remove them.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase BEFORE importing the module under test, so the module
// picks up the mocked client at import time.
const fromMock = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(async () => ({ from: fromMock })),
}))

import {
  resolveReferrer,
  recordReferral,
  qualifyAndIssueRewards,
  voidReferral,
} from '@/lib/referral'

beforeEach(() => {
  vi.clearAllMocks()
  fromMock.mockReset()
})

describe('resolveReferrer', () => {
  it('returns null for null/undefined input without touching the DB', async () => {
    expect(await resolveReferrer(null)).toBeNull()
    expect(await resolveReferrer(undefined)).toBeNull()
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('returns null for empty string', async () => {
    expect(await resolveReferrer('')).toBeNull()
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('returns null for codes of the wrong length', async () => {
    // Code length is fixed at 8.
    expect(await resolveReferrer('ABC')).toBeNull()
    expect(await resolveReferrer('TOOLONGCODE12345')).toBeNull()
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('queries DB with normalized (uppercase, trimmed) code', async () => {
    const eqMock = vi.fn(() => ({
      maybeSingle: vi.fn(async () => ({
        data: { id: 'u1', email: 'r@example.com', name: 'Referrer' },
        error: null,
      })),
    }))
    const selectMock = vi.fn(() => ({ eq: eqMock }))
    fromMock.mockReturnValue({ select: selectMock })

    const result = await resolveReferrer('  abcdefgh  ')
    expect(result).toEqual({
      id: 'u1',
      email: 'r@example.com',
      name: 'Referrer',
    })
    expect(eqMock).toHaveBeenCalledWith('referral_code', 'ABCDEFGH')
  })
})

describe('recordReferral', () => {
  it('rejects self-referral without touching the DB', async () => {
    const result = await recordReferral({
      referrerId: 'same-id',
      refereeId: 'same-id',
      code: 'ABCDEFGH',
    })
    expect(result).toEqual({ recorded: false, reason: 'self_referral' })
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('returns recorded:true on a clean insert', async () => {
    fromMock.mockReturnValue({
      insert: vi.fn(async () => ({ error: null })),
    })

    const result = await recordReferral({
      referrerId: 'referrer-1',
      refereeId: 'referee-1',
      code: 'ABCDEFGH',
    })
    expect(result).toEqual({ recorded: true })
  })

  it('treats a 23505 unique violation as a silent no-op', async () => {
    // The referee already has a row from another referrer's code —
    // first attribution wins, this insert is dropped silently.
    fromMock.mockReturnValue({
      insert: vi.fn(async () => ({
        error: { code: '23505', message: 'duplicate key value' },
      })),
    })

    const result = await recordReferral({
      referrerId: 'referrer-2',
      refereeId: 'referee-1',
      code: 'XYZWVUTS',
    })
    expect(result).toEqual({ recorded: false, reason: 'already_referred' })
  })

  it('returns db_error for unexpected DB errors', async () => {
    fromMock.mockReturnValue({
      insert: vi.fn(async () => ({
        error: { code: '99999', message: 'something bad' },
      })),
    })

    const result = await recordReferral({
      referrerId: 'referrer-3',
      refereeId: 'referee-3',
      code: 'ABCDEFGH',
    })
    expect(result).toEqual({ recorded: false, reason: 'db_error' })
  })
})

describe('qualifyAndIssueRewards', () => {
  it('returns unknown_user for empty email without DB calls', async () => {
    const result = await qualifyAndIssueRewards('', null)
    expect(result.status).toBe('unknown_user')
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('returns unknown_user when the email does not map to a user', async () => {
    // Single 'users' query that returns no row.
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

    const result = await qualifyAndIssueRewards('ghost@example.com', 'b1')
    expect(result.status).toBe('unknown_user')
  })

  it('returns no_referral when the user has no pending referral', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            ilike: () => ({
              maybeSingle: async () => ({
                data: { id: 'u1', email: 'u@x.com', name: 'U' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'referrals') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })

    const result = await qualifyAndIssueRewards('u@x.com', 'b1')
    expect(result.status).toBe('no_referral')
  })

  it('returns already_processed when the conditional UPDATE matches no rows', async () => {
    // Simulates a concurrent webhook winning the race. The
    // referral row exists with status='pending', but by the time
    // we UPDATE it the other worker has already flipped it.
    fromMock.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            ilike: () => ({
              maybeSingle: async () => ({
                data: { id: 'u1', email: 'u@x.com', name: 'U' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'referrals') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: 'r1',
                    referrer_id: 'rx',
                    referee_id: 'u1',
                    status: 'pending',
                  },
                  error: null,
                }),
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: () => ({
                select: async () => ({ data: [], error: null }),
              }),
            }),
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })

    const result = await qualifyAndIssueRewards('u@x.com', 'b1')
    expect(result.status).toBe('already_processed')
  })
})

describe('voidReferral', () => {
  it('returns missing_id when called without an id', async () => {
    const result = await voidReferral('')
    expect(result).toEqual({ ok: false, reason: 'missing_id' })
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('returns not_found_or_already_voided when no rows are updated', async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          neq: () => ({
            select: async () => ({ data: [], error: null }),
          }),
        }),
      }),
    })

    const result = await voidReferral('non-existent')
    expect(result).toEqual({
      ok: false,
      reason: 'not_found_or_already_voided',
    })
  })

  it('returns ok when the row is successfully voided', async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          neq: () => ({
            select: async () => ({
              data: [{ id: 'r1' }],
              error: null,
            }),
          }),
        }),
      }),
    })

    const result = await voidReferral('r1')
    expect(result).toEqual({ ok: true })
  })

  it('returns db_error on unexpected DB errors', async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          neq: () => ({
            select: async () => ({
              data: null,
              error: { message: 'boom' },
            }),
          }),
        }),
      }),
    })

    const result = await voidReferral('r1')
    expect(result).toEqual({ ok: false, reason: 'db_error' })
  })
})
