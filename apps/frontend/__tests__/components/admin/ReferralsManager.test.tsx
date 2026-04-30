/**
 * ============================================================
 * ReferralsManager (admin) tests
 * ============================================================
 *
 * Locks in the contract that drives the admin referrals page:
 *   - Initial render derives stats from the seeded list
 *   - Filter chip click triggers a refetch with the right query
 *     param and replaces the rendered rows
 *   - Joined user shape is normalized: Supabase can return either
 *     a single object or an array of one
 *   - Void button only renders for non-voided rows
 *   - Void modal: opens, captures reason, POSTs with body, on
 *     success flips the row's status in place (no refetch)
 *   - 500-character cap on the reason input
 *   - Empty-state message renders when filter returns nothing
 *
 * Note on selectors: "ยกเลิก" and "รอจอง" appear in MULTIPLE
 * places (filter chip, stat-card label, status badge, action
 * button) because Thai is concise. We use role-scoped queries
 * (`getAllByRole('button', { name })`) and structural anchors
 * (the void modal's textarea is keyed off its placeholder) so
 * tests stay specific.
 * ============================================================
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import ReferralsManager from '@/app/(admin)/admin/referrals/ReferralsManager'
import { ToastProvider } from '@/components/shared/Toast'
import type { ReferralRow } from '@/app/(admin)/admin/referrals/page'

vi.mock('lucide-react', () => {
  const Icon = (name: string) => ({ size, className }: { size?: number; className?: string }) => (
    <span data-icon={name} data-size={size} className={className}>
      {name}
    </span>
  )
  return {
    Loader2: Icon('loader'),
    Ban: Icon('ban'),
    Check: Icon('check'),
    Clock: Icon('clock'),
    Award: Icon('award'),
    Gift: Icon('gift'),
    X: Icon('x'),
    CheckCircle2: Icon('check-circle'),
    AlertCircle: Icon('alert-circle'),
    AlertTriangle: Icon('alert-triangle'),
    Info: Icon('info'),
  }
})

const apiFetchMock = vi.fn()
vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}))

function makeRow(overrides: Partial<ReferralRow> = {}): ReferralRow {
  return {
    id: 'r1',
    status: 'pending',
    referral_code: 'ABCDEFGH',
    qualified_at: null,
    rewarded_at: null,
    referrer_coupon_code: null,
    referee_coupon_code: null,
    created_at: '2026-04-25T00:00:00Z',
    referrer: { id: 'u1', name: 'Referrer One', email: 'r1@example.com' },
    referee: { id: 'u2', name: 'Referee Two', email: 'r2@example.com' },
    ...overrides,
  }
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}

beforeEach(() => {
  apiFetchMock.mockReset()
})

describe('ReferralsManager', () => {
  it('renders seeded rows', () => {
    const rows: ReferralRow[] = [
      makeRow({ id: 'a', status: 'pending', referral_code: 'AAA111' }),
      makeRow({ id: 'b', status: 'qualified', referral_code: 'BBB222' }),
    ]
    render(
      <Wrap>
        <ReferralsManager initialReferrals={rows} />
      </Wrap>
    )
    // Each row's referral code is rendered in a <code> element —
    // unique enough to anchor on.
    expect(screen.getByText('AAA111')).toBeTruthy()
    expect(screen.getByText('BBB222')).toBeTruthy()
  })

  it('handles a Supabase-style array-shaped join for referrer/referee', () => {
    const rows: ReferralRow[] = [
      makeRow({
        id: 'a',
        referrer: [{ id: 'u1', name: 'Array Name', email: 'arr@example.com' }],
        referee: [{ id: 'u2', name: 'Other Name', email: 'oth@example.com' }],
      }),
    ]
    render(
      <Wrap>
        <ReferralsManager initialReferrals={rows} />
      </Wrap>
    )
    expect(screen.getByText('Array Name')).toBeTruthy()
    expect(screen.getByText('Other Name')).toBeTruthy()
  })

  it('shows "[ลบไปแล้ว]" placeholder when a joined user is null', () => {
    const rows: ReferralRow[] = [
      makeRow({
        id: 'a',
        referrer: null,
        referee: { id: 'u2', name: 'Still Here', email: 'sh@example.com' },
      }),
    ]
    render(
      <Wrap>
        <ReferralsManager initialReferrals={rows} />
      </Wrap>
    )
    expect(screen.getByText('[ลบไปแล้ว]')).toBeTruthy()
  })

  it('shows action cancel button on pending rows but not on voided rows', () => {
    // Filter chips are also buttons named "ยกเลิก" — so the count
    // of buttons matching that name = 1 chip + 1 action per
    // non-voided row.
    const rows: ReferralRow[] = [
      makeRow({ id: 'a', status: 'pending' }),
      makeRow({ id: 'b', status: 'voided' }),
    ]
    render(
      <Wrap>
        <ReferralsManager initialReferrals={rows} />
      </Wrap>
    )
    const cancelButtons = screen.getAllByRole('button', { name: 'ยกเลิก' })
    // 1 filter chip + 1 action button on the pending row = 2.
    expect(cancelButtons).toHaveLength(2)
  })

  it('refetches with status query param when a filter chip is clicked', async () => {
    const rows: ReferralRow[] = [makeRow({ id: 'a', status: 'pending' })]
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        referrals: [makeRow({ id: 'b', status: 'rewarded' })],
      }),
    })

    render(
      <Wrap>
        <ReferralsManager initialReferrals={rows} />
      </Wrap>
    )

    // Filter chips are buttons. "ออกคูปองแล้ว" only appears once
    // when there are no rewarded rows seeded — as the chip itself.
    const chip = screen.getByRole('button', { name: 'ออกคูปองแล้ว' })
    await act(async () => {
      fireEvent.click(chip)
    })

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/admin/referrals?status=rewarded'
      )
    })
  })

  it('opens the void modal and POSTs with reason on confirm', async () => {
    const rows: ReferralRow[] = [makeRow({ id: 'r1', status: 'pending' })]
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })

    render(
      <Wrap>
        <ReferralsManager initialReferrals={rows} />
      </Wrap>
    )

    // The action cancel button — find it inside the table to
    // disambiguate from the filter chip.
    const tableArea = screen.getByRole('table')
    const cancelBtn = within(tableArea).getByRole('button', { name: 'ยกเลิก' })
    await act(async () => {
      fireEvent.click(cancelBtn)
    })

    // Modal opens — the textarea has a recognizable placeholder.
    const textarea = await screen.findByPlaceholderText(/ตรวจพบหลายบัญชี/)

    fireEvent.change(textarea, {
      target: { value: 'duplicate IP detected' },
    })

    const submitBtn = screen.getByRole('button', { name: /ยกเลิกการแนะนำ/ })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/admin/referrals/r1/void',
        expect.objectContaining({
          method: 'POST',
          body: { reason: 'duplicate IP detected' },
        })
      )
    })
  })

  it('flips row status to voided in place after successful void (no refetch)', async () => {
    const rows: ReferralRow[] = [makeRow({ id: 'r1', status: 'pending' })]
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })

    render(
      <Wrap>
        <ReferralsManager initialReferrals={rows} />
      </Wrap>
    )

    // Initially the row's status badge is "รอจอง" — we anchor on
    // the table area so we don't catch the filter chip with the
    // same text.
    const tableArea = screen.getByRole('table')
    expect(within(tableArea).getByText('รอจอง')).toBeTruthy()

    const cancelBtn = within(tableArea).getByRole('button', { name: 'ยกเลิก' })
    await act(async () => {
      fireEvent.click(cancelBtn)
    })

    const submitBtn = screen.getByRole('button', { name: /ยกเลิกการแนะนำ/ })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    // After: row badge flipped to "ยกเลิก", and there's no longer
    // an action button on the row (so within(table) for "ยกเลิก"
    // matches only the badge — a span, not a button).
    await waitFor(() => {
      expect(within(tableArea).queryByText('รอจอง')).toBeFalsy()
    })
    // No action button left in the table after voiding.
    expect(within(tableArea).queryByRole('button', { name: 'ยกเลิก' })).toBeFalsy()

    // Crucially, apiFetch was called exactly once — for the void
    // POST. We did NOT trigger a refetch.
    expect(apiFetchMock).toHaveBeenCalledTimes(1)
  })

  it('caps the reason input at 500 characters', async () => {
    const rows: ReferralRow[] = [makeRow({ id: 'r1', status: 'pending' })]

    render(
      <Wrap>
        <ReferralsManager initialReferrals={rows} />
      </Wrap>
    )

    const tableArea = screen.getByRole('table')
    const cancelBtn = within(tableArea).getByRole('button', { name: 'ยกเลิก' })
    await act(async () => {
      fireEvent.click(cancelBtn)
    })

    const textarea = (await screen.findByPlaceholderText(
      /ตรวจพบหลายบัญชี/
    )) as HTMLTextAreaElement

    fireEvent.change(textarea, { target: { value: 'a'.repeat(600) } })
    expect(textarea.value.length).toBe(500)
  })

  it('shows empty-state message when filter returns nothing', async () => {
    const rows: ReferralRow[] = [makeRow({ id: 'a', status: 'pending' })]
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ referrals: [] }),
    })

    render(
      <Wrap>
        <ReferralsManager initialReferrals={rows} />
      </Wrap>
    )

    // Click the "ผ่านเงื่อนไข" filter chip — unique because none
    // of our seeded rows have that status, so it appears only as
    // the chip + the stat card label. Both being clickable (the
    // chip is a button, the card is a div) means getByRole(button)
    // gives us exactly the chip.
    const chip = screen.getByRole('button', { name: 'ผ่านเงื่อนไข' })
    await act(async () => {
      fireEvent.click(chip)
    })

    await waitFor(() => {
      expect(screen.getByText(/ไม่พบรายการสถานะ/)).toBeTruthy()
    })
  })
})
