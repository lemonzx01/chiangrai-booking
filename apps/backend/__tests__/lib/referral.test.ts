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

import { resolveReferrer, recordReferral } from '@/lib/referral'

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
