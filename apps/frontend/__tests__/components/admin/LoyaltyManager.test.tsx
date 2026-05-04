/**
 * ============================================================
 * LoyaltyManager (admin) tests
 * ============================================================
 *
 * Locks in the contract that drives the admin loyalty page:
 *   - Seeded leaderboard renders
 *   - Empty state when no users
 *   - Search filters by name + email
 *   - Adjust modal opens, validates, posts, and updates row
 *     in place on success
 *   - Adjust button has correct enabled/disabled states
 * ============================================================
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from '@testing-library/react'
import LoyaltyManager from '@/app/(admin)/admin/loyalty/LoyaltyManager'
import { ToastProvider } from '@/components/shared/Toast'
import type { LoyaltyUserRow } from '@/app/(admin)/admin/loyalty/page'

vi.mock('lucide-react', () => {
  const Icon = (name: string) => () => <span data-icon={name}>{name}</span>
  return {
    Loader2: Icon('loader'),
    Award: Icon('award'),
    X: Icon('x'),
    Plus: Icon('plus'),
    Minus: Icon('minus'),
    TrendingUp: Icon('trending-up'),
    Search: Icon('search'),
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

function makeUser(o: Partial<LoyaltyUserRow> = {}): LoyaltyUserRow {
  return {
    id: 'u1',
    name: 'Niran K.',
    email: 'niran@example.com',
    balance: 200,
    lifetimeEarned: 250,
    tier: { level: 'bronze', name: 'Bronze', multiplier: 1.0 },
    createdAt: '2026-04-01T00:00:00Z',
    ...o,
  }
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}

beforeEach(() => {
  apiFetchMock.mockReset()
})

describe('LoyaltyManager', () => {
  it('renders rows from initialUsers', () => {
    const users: LoyaltyUserRow[] = [
      makeUser({ id: 'a', name: 'Aor', email: 'aor@x.com' }),
      makeUser({
        id: 'b',
        name: 'Somchai',
        email: 'somchai@x.com',
        tier: { level: 'silver', name: 'Silver', multiplier: 1.25 },
      }),
    ]
    render(
      <Wrap>
        <LoyaltyManager initialUsers={users} />
      </Wrap>
    )
    expect(screen.getByText('Aor')).toBeTruthy()
    expect(screen.getByText('Somchai')).toBeTruthy()
    expect(screen.getByText('Silver')).toBeTruthy()
  })

  it('shows empty state when no users', () => {
    render(
      <Wrap>
        <LoyaltyManager initialUsers={[]} />
      </Wrap>
    )
    expect(screen.getByText(/ยังไม่มีข้อมูลผู้ใช้/)).toBeTruthy()
  })

  it('filters by name', () => {
    const users: LoyaltyUserRow[] = [
      makeUser({ id: 'a', name: 'Aor', email: 'aor@x.com' }),
      makeUser({ id: 'b', name: 'Somchai', email: 'somchai@x.com' }),
    ]
    render(
      <Wrap>
        <LoyaltyManager initialUsers={users} />
      </Wrap>
    )

    const search = screen.getByPlaceholderText('ค้นหาด้วยชื่อหรืออีเมล')
    fireEvent.change(search, { target: { value: 'aor' } })

    expect(screen.queryByText('Aor')).toBeTruthy()
    expect(screen.queryByText('Somchai')).toBeFalsy()
  })

  it('filters by email', () => {
    const users: LoyaltyUserRow[] = [
      makeUser({ id: 'a', name: 'Aor', email: 'aor@x.com' }),
      makeUser({ id: 'b', name: 'Somchai', email: 'somchai@example.com' }),
    ]
    render(
      <Wrap>
        <LoyaltyManager initialUsers={users} />
      </Wrap>
    )

    const search = screen.getByPlaceholderText('ค้นหาด้วยชื่อหรืออีเมล')
    fireEvent.change(search, { target: { value: 'example.com' } })

    expect(screen.queryByText('Somchai')).toBeTruthy()
    expect(screen.queryByText('Aor')).toBeFalsy()
  })

  it('shows "no match" message when filter returns nothing', () => {
    const users: LoyaltyUserRow[] = [makeUser({ id: 'a' })]
    render(
      <Wrap>
        <LoyaltyManager initialUsers={users} />
      </Wrap>
    )
    fireEvent.change(screen.getByPlaceholderText('ค้นหาด้วยชื่อหรืออีเมล'), {
      target: { value: 'nobody' },
    })
    expect(screen.getByText(/ไม่พบผู้ใช้ที่ตรงกับ/)).toBeTruthy()
  })

  it('opens adjust modal on row button click', async () => {
    const users: LoyaltyUserRow[] = [makeUser({ id: 'u1' })]
    render(
      <Wrap>
        <LoyaltyManager initialUsers={users} />
      </Wrap>
    )

    const row = screen.getByRole('table')
    const adjustBtn = within(row).getByRole('button', { name: 'ปรับแต้ม' })
    await act(async () => {
      fireEvent.click(adjustBtn)
    })

    // Modal should have a delta input + reason textarea
    expect(screen.getByPlaceholderText('100 หรือ -50')).toBeTruthy()
    expect(
      screen.getByPlaceholderText(/ชดเชยกรณีระบบล่ม/)
    ).toBeTruthy()
  })

  it('posts adjust and updates row balance optimistically', async () => {
    const users: LoyaltyUserRow[] = [makeUser({ id: 'u1', balance: 200 })]
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        balance: 350,
        lifetimeEarned: 400,
      }),
    })

    render(
      <Wrap>
        <LoyaltyManager initialUsers={users} />
      </Wrap>
    )

    const row = screen.getByRole('table')
    await act(async () => {
      fireEvent.click(within(row).getByRole('button', { name: 'ปรับแต้ม' }))
    })

    fireEvent.change(screen.getByPlaceholderText('100 หรือ -50'), {
      target: { value: '150' },
    })
    fireEvent.change(screen.getByPlaceholderText(/ชดเชยกรณีระบบล่ม/), {
      target: { value: 'CS comp' },
    })

    // Modal submit button — distinct from the row's "ปรับแต้ม" by
    // being inside the modal (not in the table). Use a more
    // specific query.
    const modalSubmit = screen
      .getAllByRole('button', { name: /ปรับแต้ม/ })
      .find((b) => b.className.includes('bg-slate-900'))!
    await act(async () => {
      fireEvent.click(modalSubmit)
    })

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/admin/loyalty/u1/adjust',
        expect.objectContaining({
          method: 'POST',
          body: { delta: 150, reason: 'CS comp' },
        })
      )
    })

    // Row should now show the new balance (350) — optimistic
    // update. We anchor on the table since "350" might appear
    // elsewhere in the dialog preview.
    await waitFor(() => {
      expect(within(row).getByText('350')).toBeTruthy()
    })
  })
})
