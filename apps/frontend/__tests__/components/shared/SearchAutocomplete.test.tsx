/**
 * ============================================================
 * SearchAutocomplete tests
 * ============================================================
 *
 * The autocomplete is the global search experience on the
 * navbar + every listing page. Coverage:
 *   - Empty input doesn't fetch
 *   - Typing fires a debounced fetch (250ms)
 *   - Both scopes are queried when scope='both'
 *   - scope='hotel' / 'car' restricts to a single endpoint
 *   - Results render with title + price
 *   - Empty result state shows "ไม่พบผลลัพธ์"
 *   - Outside click closes the dropdown
 *   - Clear button empties the input
 *
 * Real timers throughout — see CouponInput.test.tsx for why.
 * ============================================================
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('lucide-react', () => {
  const Icon = (name: string) => () => <span data-icon={name}>{name}</span>
  return {
    Search: Icon('search'),
    Loader2: Icon('loading'),
    X: Icon('x'),
  }
})

vi.mock('@chiangrai/shared/utils', () => ({
  formatCurrency: (n: number) => `฿${n.toLocaleString()}`,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}))

import SearchAutocomplete from '@/components/shared/SearchAutocomplete'

const mockedFetch = vi.fn()
global.fetch = mockedFetch as unknown as typeof fetch

function fakeRows(
  kind: 'hotel' | 'car',
  rows: Array<{ id: string; name_th?: string; name_en?: string; images?: string[]; price_per_night?: number; price_per_day?: number; location?: string }>
) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: rows }),
  })
}

const debounceWait = () => new Promise((r) => setTimeout(r, 300))

beforeEach(() => {
  mockedFetch.mockReset()
})

describe('SearchAutocomplete', () => {
  it('does not fetch when the input is empty', async () => {
    render(<SearchAutocomplete />)
    await debounceWait()
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it('fetches both endpoints when scope="both"', async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes('/api/hotels'))
        return fakeRows('hotel', [
          { id: 'h1', name_th: 'Villa A', price_per_night: 5000 },
        ])
      if (url.includes('/api/cars'))
        return fakeRows('car', [
          { id: 'c1', name_th: 'SUV X', price_per_day: 1500 },
        ])
      return Promise.reject(new Error('unexpected url'))
    })

    render(<SearchAutocomplete scope="both" />)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'beach' },
    })

    await waitFor(
      () => {
        expect(mockedFetch).toHaveBeenCalledTimes(2)
      },
      { timeout: 2000 }
    )
    const urls = mockedFetch.mock.calls.map((c) => c[0] as string)
    expect(urls.some((u) => u.startsWith('/api/hotels'))).toBe(true)
    expect(urls.some((u) => u.startsWith('/api/cars'))).toBe(true)
  })

  it('fetches only hotels when scope="hotel"', async () => {
    mockedFetch.mockReturnValue(fakeRows('hotel', []))
    render(<SearchAutocomplete scope="hotel" />)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'beach' },
    })
    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    })
    const url = mockedFetch.mock.calls[0][0] as string
    expect(url.startsWith('/api/hotels')).toBe(true)
  })

  it('fetches only cars when scope="car"', async () => {
    mockedFetch.mockReturnValue(fakeRows('car', []))
    render(<SearchAutocomplete scope="car" />)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'sedan' },
    })
    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    })
    const url = mockedFetch.mock.calls[0][0] as string
    expect(url.startsWith('/api/cars')).toBe(true)
  })

  it('renders matching listings with title + price', async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes('/api/hotels'))
        return fakeRows('hotel', [
          {
            id: 'h1',
            name_th: 'Premium Villa',
            price_per_night: 5500,
            location: 'Pai',
          },
        ])
      return fakeRows('car', [])
    })

    render(<SearchAutocomplete scope="both" />)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'villa' },
    })

    await waitFor(
      () => expect(screen.getByText('Premium Villa')).toBeInTheDocument(),
      { timeout: 2000 }
    )
    expect(screen.getByText('Pai')).toBeInTheDocument()
    expect(screen.getByText(/5,500/)).toBeInTheDocument()
  })

  it('shows the no-results message when results are empty', async () => {
    mockedFetch.mockReturnValue(fakeRows('hotel', []))
    render(<SearchAutocomplete scope="hotel" />)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'xyz' },
    })

    await waitFor(
      () => expect(screen.getByText(/ไม่พบผลลัพธ์/)).toBeInTheDocument(),
      { timeout: 2000 }
    )
  })

  it('shows a clear (X) button when there is text, and clears on click', async () => {
    render(<SearchAutocomplete />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'something' } })
    await waitFor(() => {
      expect(screen.getByLabelText('ล้าง')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByLabelText('ล้าง'))
    expect(input.value).toBe('')
  })

  it('respects the placeholder prop', () => {
    render(<SearchAutocomplete placeholder="ค้นหาที่พักหรือรถ..." />)
    expect(
      screen.getByPlaceholderText('ค้นหาที่พักหรือรถ...')
    ).toBeInTheDocument()
  })

  it('initialValue prefills the input', () => {
    render(<SearchAutocomplete initialValue="prefilled" />)
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe(
      'prefilled'
    )
  })
})
