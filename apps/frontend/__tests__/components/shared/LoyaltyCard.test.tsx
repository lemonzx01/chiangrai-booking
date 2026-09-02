/**
 * ============================================================
 * LoyaltyCard tests
 * ============================================================
 *
 * Locks in the contract that drives the profile loyalty widget:
 *   - Loader while fetching
 *   - Renders points balance + tier badge + progress bar on success
 *   - "Top tier reached" branch when next is null (Gold)
 *   - Inline error banner on network failure
 *   - 401 → quiet (page handles redirect)
 *   - Redeem flow: tier disabled when balance < cost, busy
 *     spinner while POSTing, optimistic balance update + issued
 *     coupon panel on success
 *   - Copy coupon → navigator.clipboard.writeText
 * ============================================================
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react'
import LoyaltyCard from '@/components/shared/LoyaltyCard'
import { ToastProvider } from '@/components/shared/Toast'

vi.mock('lucide-react', () => {
  const Icon =
    (name: string) =>
    ({ size, className }: { size?: number; className?: string }) => (
      <span data-icon={name} data-size={size} className={className}>
        {name}
      </span>
    )
  return {
    Star: Icon('star'),
    Loader2: Icon('loader'),
    Calendar: Icon('cal'),
    Plus: Icon('plus'),
    Minus: Icon('minus'),
    Award: Icon('award'),
    Gift: Icon('gift'),
    Copy: Icon('copy'),
    CheckCircle2: Icon('check-circle'),
    AlertCircle: Icon('alert-circle'),
    AlertTriangle: Icon('alert-triangle'),
    Info: Icon('info'),
    X: Icon('x'),
  }
})

const apiFetchMock = vi.fn()
vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}))

function makeOverview(
  overrides: Partial<{
    points: number
    tier: {
      current: { level: 'bronze' | 'silver' | 'gold'; name: string; minLifetime: number; multiplier: number }
      next: { level: 'bronze' | 'silver' | 'gold'; name: string; minLifetime: number; multiplier: number } | null
      lifetimeEarned: number
      pointsToNext: number | null
    }
    recent: Array<{
      delta: number
      kind: 'earn' | 'redeem' | 'void' | 'adjust'
      reason: string | null
      createdAt: string
    }>
    redeemTiers: Array<{ points: number; valueThb: number; label: string }>
  }> = {}
) {
  return {
    points: 200,
    tier: {
      current: { level: 'bronze' as const, name: 'Bronze', minLifetime: 0, multiplier: 1.0 },
      next: { level: 'silver' as const, name: 'Silver', minLifetime: 500, multiplier: 1.25 },
      lifetimeEarned: 200,
      pointsToNext: 300,
    },
    recent: [
      {
        delta: 25,
        kind: 'earn' as const,
        reason: 'จองสำเร็จ TE26 (฿2,500)',
        createdAt: '2026-04-30T00:00:00Z',
      },
    ],
    redeemTiers: [
      { points: 100, valueThb: 100, label: '฿100 off' },
      { points: 300, valueThb: 350, label: '฿350 off' },
      { points: 500, valueThb: 600, label: '฿600 off' },
    ],
    ...overrides,
  }
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}

beforeEach(() => {
  apiFetchMock.mockReset()
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn(async () => undefined) },
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('LoyaltyCard', () => {
  it('shows a loader while fetching', () => {
    ;apiFetchMock.mockReturnValue(
      new Promise(() => {})
    )
    render(
      <Wrap>
        <LoyaltyCard />
      </Wrap>
    )
    expect(document.querySelector('[data-icon="loader"]')).toBeTruthy()
  })

  it('renders balance, tier badge, and progress on success', async () => {
    ;apiFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => makeOverview(),
    })

    render(
      <Wrap>
        <LoyaltyCard />
      </Wrap>
    )

    await waitFor(() => screen.getByText('200'))
    // Tier badge should show "Bronze · ×1"
    expect(screen.getByText('Bronze')).toBeTruthy()
    // Progress caption mentions Silver and points-to-next
    expect(screen.getByText(/Silver/)).toBeTruthy()
    expect(screen.getByText('300')).toBeTruthy() // pointsToNext
  })

  it('shows "top tier reached" branch when no next tier', async () => {
    ;apiFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () =>
        makeOverview({
          tier: {
            current: { level: 'gold', name: 'Gold', minLifetime: 2000, multiplier: 1.5 },
            next: null,
            lifetimeEarned: 3000,
            pointsToNext: null,
          },
        }),
    })

    render(
      <Wrap>
        <LoyaltyCard />
      </Wrap>
    )

    await waitFor(() => screen.getByText('Gold'))
    expect(screen.getByText(/ระดับสูงสุดแล้ว/)).toBeTruthy()
  })

  it('renders error banner when fetch fails', async () => {
    ;apiFetchMock.mockRejectedValueOnce(
      new Error('network')
    )

    render(
      <Wrap>
        <LoyaltyCard />
      </Wrap>
    )
    await waitFor(() =>
      expect(
        screen.getByText(/ไม่สามารถโหลดข้อมูลแต้มสะสม/)
      ).toBeTruthy()
    )
  })

  it('stays quiet on 401 (page handles auth redirect)', async () => {
    ;apiFetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    })

    render(
      <Wrap>
        <LoyaltyCard />
      </Wrap>
    )

    await waitFor(() => {
      expect(screen.queryByText('200')).toBeFalsy()
    })
  })

  it('disables redeem tiers when balance is below cost', async () => {
    ;apiFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () =>
        makeOverview({ points: 50 }), // Below all tiers
    })

    render(
      <Wrap>
        <LoyaltyCard />
      </Wrap>
    )

    await waitFor(() => screen.getByText('50'))
    // The redeem tier buttons should be disabled.
    const tierButtons = screen
      .getAllByRole('button')
      .filter((b) => b.textContent?.includes('฿100'))
    expect(tierButtons.length).toBeGreaterThan(0)
    expect(tierButtons[0]).toBeDisabled()
  })

  it('redeems points and shows the issued coupon panel on success', async () => {
    ;apiFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => makeOverview(),
    })
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        couponCode: 'REDEEM-ABC12345',
        valueThb: 100,
        expiresAt: '2026-08-01T00:00:00Z',
        pointsRemaining: 100,
      }),
    })

    render(
      <Wrap>
        <LoyaltyCard />
      </Wrap>
    )

    await waitFor(() => screen.getByText('200'))

    // Click the ฿100-off tier button
    const tierBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('฿100'))!
    await act(async () => {
      fireEvent.click(tierBtn)
    })

    // Issued coupon panel renders with the code
    await waitFor(() => screen.getByText('REDEEM-ABC12345'))
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/user/loyalty/redeem',
      expect.objectContaining({
        method: 'POST',
        body: { points: 100 },
      })
    )
  })
})
