/**
 * ============================================================
 * ReferralCard tests
 * ============================================================
 *
 * Locks in the contract that drives the profile referral widget:
 *   - Renders a loader while fetching
 *   - On 200 response: shows code, share URL, stats, invitees
 *   - On non-401 error: renders the inline retry banner
 *   - On 401: renders the same banner (auth redirect handled
 *     by the page-level layout, not the card itself)
 *   - Copy code / copy link buttons call navigator.clipboard.writeText
 *   - Web Share API is used when available; otherwise fallback to
 *     copyLink (writeText) — important for desktop browsers
 * ============================================================
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ReferralCard from '@/components/shared/ReferralCard'
import { ToastProvider } from '@/components/shared/Toast'

// Lucide icons → simple labelled spans so we can grep for them in tests.
vi.mock('lucide-react', () => {
  const Icon = (name: string) => ({ size, className }: { size?: number; className?: string }) => (
    <span data-icon={name} data-size={size} className={className}>
      {name}
    </span>
  )
  return {
    Gift: Icon('gift'),
    Copy: Icon('copy'),
    Share2: Icon('share'),
    CheckCircle2: Icon('check'),
    Loader2: Icon('loader'),
    Users: Icon('users'),
    // Toast icons (because Toast also imports lucide)
    AlertCircle: Icon('alert-circle'),
    AlertTriangle: Icon('alert-triangle'),
    Info: Icon('info'),
    X: Icon('x'),
  }
})

const mockStats = {
  code: 'ABCDEFGH',
  shareUrl: 'https://example.com/register?ref=ABCDEFGH',
  total: 3,
  pending: 1,
  qualified: 1,
  rewarded: 1,
  invitees: [
    {
      refereeName: 'Niran K.',
      refereeEmail: 'n***@example.com',
      status: 'rewarded',
      createdAt: '2026-04-20T00:00:00Z',
    },
    {
      refereeName: null,
      refereeEmail: 'a***@gmail.com',
      status: 'pending',
      createdAt: '2026-04-15T00:00:00Z',
    },
  ],
}

function Wrap({ children }: { children: React.ReactNode }) {
  // ReferralCard uses useToast — wrap in provider so toasts can fire
  // without warning spam on the dev console.
  return <ToastProvider>{children}</ToastProvider>
}

beforeEach(() => {
  ;(global.fetch as ReturnType<typeof vi.fn>).mockReset()
  // jsdom doesn't have clipboard or Web Share by default — install fakes.
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn(async () => undefined) },
  })
  // Remove any leftover .share from previous test
  delete (navigator as { share?: unknown }).share
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ReferralCard', () => {
  it('shows a loader while fetching', () => {
    // Never resolves — leaves us in the loading state.
    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}))
    render(
      <Wrap>
        <ReferralCard />
      </Wrap>
    )
    // The loader span has data-icon="loader" from our mock.
    expect(document.querySelector('[data-icon="loader"]')).toBeTruthy()
  })

  it('renders code, share URL stats, and invitees on success', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockStats,
    })

    render(
      <Wrap>
        <ReferralCard />
      </Wrap>
    )

    await waitFor(() => {
      expect(screen.getByText('ABCDEFGH')).toBeTruthy()
    })

    // Stats grid label: 'ทั้งหมด' is unique to the total stat.
    expect(screen.getByText('ทั้งหมด')).toBeTruthy()
    // 'รอจอง' appears twice: once as a stat-card label, once as an
    // invitee status label. Use getAllByText to assert presence.
    expect(screen.getAllByText('รอจอง').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('ผ่านเงื่อนไข')).toBeTruthy()
    expect(screen.getByText('รับรางวัลแล้ว')).toBeTruthy()

    // Invitee list shows masked emails.
    expect(screen.getByText('n***@example.com')).toBeTruthy()
    expect(screen.getByText('a***@gmail.com')).toBeTruthy()
    // Status label for the rewarded invitee — 'รับแล้ว' is the
    // shorter form used in the invitee row (vs 'รับรางวัลแล้ว'
    // on the stat card), distinct enough to assert directly.
    expect(screen.getByText('รับแล้ว')).toBeTruthy()
  })

  it('renders an inline error banner when the network fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('network')
    )

    render(
      <Wrap>
        <ReferralCard />
      </Wrap>
    )

    await waitFor(() => {
      expect(
        screen.getByText(/ไม่สามารถโหลดข้อมูลรางวัลแนะนำได้ในตอนนี้/)
      ).toBeTruthy()
    })
  })

  it('stays quiet on 401 (page handles auth redirect)', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'auth required' }),
    })

    render(
      <Wrap>
        <ReferralCard />
      </Wrap>
    )

    await waitFor(() => {
      // The 401 branch goes to the same "couldn't load" state;
      // we just want to confirm no code is rendered.
      expect(screen.queryByText('ABCDEFGH')).toBeFalsy()
    })
  })

  it('writes the code to clipboard when "คัดลอก" is clicked', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockStats,
    })

    render(
      <Wrap>
        <ReferralCard />
      </Wrap>
    )

    await waitFor(() => screen.getByText('ABCDEFGH'))

    // The "Copy" button next to the code uses aria-label="คัดลอกรหัส"
    const copyBtn = screen.getByLabelText('คัดลอกรหัส')
    await act(async () => {
      fireEvent.click(copyBtn)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABCDEFGH')
  })

  it('writes the share URL to clipboard when "คัดลอกลิงก์" is clicked', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockStats,
    })

    render(
      <Wrap>
        <ReferralCard />
      </Wrap>
    )

    await waitFor(() => screen.getByText('ABCDEFGH'))

    const copyLinkBtn = screen.getByText('คัดลอกลิงก์').closest('button')
    expect(copyLinkBtn).toBeTruthy()
    await act(async () => {
      fireEvent.click(copyLinkBtn!)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://example.com/register?ref=ABCDEFGH'
    )
  })

  it('uses Web Share API when available, otherwise falls back to copying the link', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockStats,
    })

    // Typed signature so .calls[0][0] keeps its element type for tsc.
    const shareSpy = vi.fn(async (_data: ShareData) => undefined)
    Object.assign(navigator, { share: shareSpy })

    render(
      <Wrap>
        <ReferralCard />
      </Wrap>
    )

    await waitFor(() => screen.getByText('ABCDEFGH'))

    const shareBtn = screen.getByText('แชร์').closest('button')
    expect(shareBtn).toBeTruthy()
    await act(async () => {
      fireEvent.click(shareBtn!)
    })
    expect(shareSpy).toHaveBeenCalledTimes(1)
    expect(shareSpy.mock.calls[0][0]).toMatchObject({
      url: 'https://example.com/register?ref=ABCDEFGH',
    })
  })

  it('fallback to clipboard when navigator.share is not available', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockStats,
    })

    // Make sure share is missing
    delete (navigator as { share?: unknown }).share

    render(
      <Wrap>
        <ReferralCard />
      </Wrap>
    )

    await waitFor(() => screen.getByText('ABCDEFGH'))

    const shareBtn = screen.getByText('แชร์').closest('button')
    await act(async () => {
      fireEvent.click(shareBtn!)
    })
    // Without Web Share, the button should fall back to copying the link.
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://example.com/register?ref=ABCDEFGH'
    )
  })
})
