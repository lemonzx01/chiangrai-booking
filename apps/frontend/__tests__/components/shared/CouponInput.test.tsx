/**
 * ============================================================
 * CouponInput tests
 * ============================================================
 *
 * Coupon input is the live-validation surface that touches the
 * backend on every keystroke. The contract worth pinning:
 *   - Empty input fires no request and reports null
 *   - Debounce: typing fast doesn't fire one request per char
 *   - Valid coupon → onChange called with computed amounts
 *   - Invalid coupon → onChange called with null + error shown
 *   - initialCode prefills the field
 *
 * Implementation note: we use REAL timers and a 450ms wait
 * past the 400ms debounce. Fake timers conflict with @testing-
 * library's `waitFor` (which itself relies on setTimeout to
 * retry), so combining the two leads to deadlocks.
 * ============================================================
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('lucide-react', () => {
  const Icon = (name: string) => () => <span data-icon={name}>{name}</span>
  return {
    Tag: Icon('tag'),
    Loader2: Icon('loading'),
    CheckCircle2: Icon('check'),
    AlertCircle: Icon('alert'),
  }
})

vi.mock('@chiangrai/shared/utils', () => ({
  formatCurrency: (n: number) => `฿${n.toLocaleString()}`,
}))

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '@/lib/api'
import CouponInput from '@/components/shared/CouponInput'

const mockedApiFetch = apiFetch as unknown as ReturnType<typeof vi.fn>

function fakeResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  })
}

/** Wait long enough for the 400ms debounce + a margin. */
const debounceWait = () => new Promise((r) => setTimeout(r, 450))

beforeEach(() => {
  mockedApiFetch.mockReset()
})

describe('CouponInput', () => {
  it('honours initialCode by populating the input on mount', () => {
    render(
      <CouponInput
        bookingType="HOTEL"
        totalPrice={1000}
        initialCode="WELCOME"
      />
    )
    expect(
      (screen.getByPlaceholderText(/โค้ดคูปอง/) as HTMLInputElement).value
    ).toBe('WELCOME')
  })

  it('uppercases the typed value', () => {
    render(<CouponInput bookingType="HOTEL" totalPrice={1000} />)
    const input = screen.getByPlaceholderText(/โค้ดคูปอง/) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'save10' } })
    expect(input.value).toBe('SAVE10')
  })

  it('does not call apiFetch when the input is empty', async () => {
    render(<CouponInput bookingType="HOTEL" totalPrice={1000} />)
    await debounceWait()
    expect(mockedApiFetch).not.toHaveBeenCalled()
  })

  it('emits null on initial render with no code', () => {
    const onChange = vi.fn()
    render(
      <CouponInput
        bookingType="HOTEL"
        totalPrice={1000}
        onChange={onChange}
      />
    )
    // Initial effect runs immediately with empty code → null
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('fires exactly one request after debounce on rapid typing', async () => {
    mockedApiFetch.mockReturnValue(
      fakeResponse({ valid: false, error: 'no such code' })
    )
    render(<CouponInput bookingType="HOTEL" totalPrice={1000} />)
    const input = screen.getByPlaceholderText(/โค้ดคูปอง/)
    // Type three keystrokes in quick succession
    fireEvent.change(input, { target: { value: 'A' } })
    fireEvent.change(input, { target: { value: 'AB' } })
    fireEvent.change(input, { target: { value: 'ABC' } })
    await debounceWait()
    expect(mockedApiFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockedApiFetch.mock.calls[0]
    expect(url).toBe('/api/coupons/validate')
    const body = (init as { body: Record<string, unknown> }).body
    expect(body).toMatchObject({
      code: 'ABC',
      booking_type: 'HOTEL',
      total_price: 1000,
    })
  })

  it('shows a green confirmation + calls onChange with applied coupon when valid', async () => {
    mockedApiFetch.mockReturnValue(
      fakeResponse({
        valid: true,
        coupon: {
          code: 'CR2025',
          discount_type: 'PERCENT',
          discount_value: 10,
          applies_to: 'ALL',
        },
        discount_amount: 100,
        final_amount: 900,
      })
    )
    const onChange = vi.fn()
    render(
      <CouponInput
        bookingType="HOTEL"
        totalPrice={1000}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByPlaceholderText(/โค้ดคูปอง/), {
      target: { value: 'CR2025' },
    })

    await waitFor(
      () => {
        expect(screen.getByText(/CR2025/)).toBeInTheDocument()
      },
      { timeout: 2000 }
    )
    expect(screen.getByText(/100/)).toBeInTheDocument()
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        code: 'CR2025',
        discountAmount: 100,
        finalAmount: 900,
      })
    )
  })

  it('shows the backend error message when invalid', async () => {
    mockedApiFetch.mockReturnValue(
      fakeResponse({ valid: false, error: 'หมดอายุแล้ว' })
    )
    const onChange = vi.fn()
    render(
      <CouponInput
        bookingType="HOTEL"
        totalPrice={1000}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByPlaceholderText(/โค้ดคูปอง/), {
      target: { value: 'EXPIRED' },
    })
    await waitFor(
      () => {
        expect(screen.getByRole('alert').textContent).toContain('หมดอายุ')
      },
      { timeout: 2000 }
    )
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('emits null when the input is cleared after a valid coupon was set', async () => {
    mockedApiFetch.mockReturnValue(
      fakeResponse({
        valid: true,
        coupon: {
          code: 'X',
          discount_type: 'FIXED',
          discount_value: 50,
          applies_to: 'ALL',
        },
        discount_amount: 50,
        final_amount: 950,
      })
    )
    const onChange = vi.fn()
    render(
      <CouponInput
        bookingType="HOTEL"
        totalPrice={1000}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByPlaceholderText(/โค้ดคูปอง/), {
      target: { value: 'X' },
    })
    await waitFor(
      () =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({ code: 'X' })
        ),
      { timeout: 2000 }
    )

    onChange.mockClear()
    fireEvent.change(screen.getByPlaceholderText(/โค้ดคูปอง/), {
      target: { value: '' },
    })
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('reports an error message when the network call rejects', async () => {
    // mockImplementation (not mockReturnValue with a pre-built Promise.reject)
    // — pre-built rejected promises trip Node's unhandled-rejection detector
    // before the component's await catches them. Lazy creation per call gives
    // each Promise its own catch handler the moment it's awaited.
    mockedApiFetch.mockImplementation(() =>
      Promise.reject(new Error('network'))
    )
    render(<CouponInput bookingType="HOTEL" totalPrice={1000} />)
    fireEvent.change(screen.getByPlaceholderText(/โค้ดคูปอง/), {
      target: { value: 'X' },
    })
    await waitFor(
      () => {
        expect(screen.getByRole('alert').textContent).toContain('ตรวจสอบ')
      },
      { timeout: 2000 }
    )
  })
})
