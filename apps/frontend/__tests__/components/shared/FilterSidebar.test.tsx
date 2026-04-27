/**
 * ============================================================
 * FilterSidebar tests
 * ============================================================
 *
 * The sidebar drives every search/filter interaction on the
 * hotels and cars pages. Coverage focuses on the parts that
 * regress most often:
 *   - countActiveFilters arithmetic (the badge on mobile)
 *   - ActiveFilterChips: which filters render as chips, and
 *     does clicking one zero just that field
 *   - FilterContent: hotel vs car branches show the right
 *     controls
 *   - "Clear all" returns to EMPTY_FILTERS
 * ============================================================
 */

import React, { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('lucide-react', () => {
  const Icon = (name: string) => () => <span data-icon={name}>{name}</span>
  return {
    Star: Icon('star'),
    X: Icon('x'),
    RotateCcw: Icon('rotate'),
  }
})

vi.mock('@chiangrai/shared/utils', () => ({
  formatCurrency: (n: number) => `฿${n.toLocaleString()}`,
}))

// BottomSheet uses useFocusTrap which calls document.activeElement —
// pull it through a simple inline mock so it doesn't crash in jsdom.
vi.mock('@/components/shared/BottomSheet', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import FilterSidebar, {
  ActiveFilterChips,
  EMPTY_FILTERS,
  countActiveFilters,
  MobileFilterTrigger,
  type FilterState,
} from '@/components/shared/FilterSidebar'

// ---------------------------------------------------------------
// countActiveFilters
// ---------------------------------------------------------------

describe('countActiveFilters', () => {
  it('returns 0 for the empty defaults', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0)
  })

  it('counts a non-empty query', () => {
    expect(countActiveFilters({ ...EMPTY_FILTERS, q: 'villa' })).toBe(1)
  })

  it('counts numeric filters individually', () => {
    expect(
      countActiveFilters({
        ...EMPTY_FILTERS,
        minPrice: 1000,
        maxPrice: 5000,
        minStar: 4,
      })
    ).toBe(3)
  })

  it('does NOT count the default sort (newest)', () => {
    expect(countActiveFilters({ ...EMPTY_FILTERS, sort: 'newest' })).toBe(0)
  })

  it('counts a non-default sort', () => {
    expect(countActiveFilters({ ...EMPTY_FILTERS, sort: 'price_asc' })).toBe(1)
  })

  it('counts string filters when non-empty', () => {
    expect(
      countActiveFilters({
        ...EMPTY_FILTERS,
        location: 'เชียงราย',
        carType: 'SUV',
      })
    ).toBe(2)
  })

  it('does not count empty strings', () => {
    expect(
      countActiveFilters({ ...EMPTY_FILTERS, location: '', carType: '' })
    ).toBe(0)
  })

  it('counts minSeats when set', () => {
    expect(countActiveFilters({ ...EMPTY_FILTERS, minSeats: 7 })).toBe(1)
  })
})

// ---------------------------------------------------------------
// ActiveFilterChips
// ---------------------------------------------------------------

describe('ActiveFilterChips', () => {
  it('renders nothing when no filters are active', () => {
    const { container } = render(
      <ActiveFilterChips filters={EMPTY_FILTERS} onChange={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders one chip per active filter', () => {
    render(
      <ActiveFilterChips
        filters={{
          ...EMPTY_FILTERS,
          q: 'beach',
          minPrice: 1000,
          minStar: 5,
          location: 'Pai',
        }}
        onChange={() => {}}
      />
    )
    expect(screen.getByText('"beach"')).toBeInTheDocument()
    expect(screen.getByText(/≥ ฿1,000/)).toBeInTheDocument()
    expect(screen.getByText('5+ ดาว')).toBeInTheDocument()
    expect(screen.getByText('Pai')).toBeInTheDocument()
  })

  it('clicking a numeric chip clears that field to null', () => {
    const onChange = vi.fn()
    render(
      <ActiveFilterChips
        filters={{ ...EMPTY_FILTERS, minPrice: 1000, maxPrice: 5000 }}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByText(/≥ ฿1,000/))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ minPrice: null, maxPrice: 5000 })
    )
  })

  it('clicking a string chip clears that field to empty string', () => {
    const onChange = vi.fn()
    render(
      <ActiveFilterChips
        filters={{ ...EMPTY_FILTERS, location: 'Pai' }}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByText('Pai'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ location: '' })
    )
  })

  it('clear-all resets to EMPTY_FILTERS', () => {
    const onChange = vi.fn()
    render(
      <ActiveFilterChips
        filters={{ ...EMPTY_FILTERS, q: 'x', location: 'y' }}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByText('ล้างทั้งหมด'))
    expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS)
  })
})

// ---------------------------------------------------------------
// MobileFilterTrigger
// ---------------------------------------------------------------

describe('MobileFilterTrigger', () => {
  it('shows a count badge when activeCount > 0', () => {
    render(<MobileFilterTrigger onClick={() => {}} activeCount={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('hides the badge when activeCount is 0', () => {
    render(<MobileFilterTrigger onClick={() => {}} activeCount={0} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('calls onClick when pressed', () => {
    const onClick = vi.fn()
    render(<MobileFilterTrigger onClick={onClick} activeCount={1} />)
    fireEvent.click(screen.getByText('ตัวกรอง'))
    expect(onClick).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------
// FilterSidebar (controlled component)
// ---------------------------------------------------------------

function Harness({ kind = 'hotel' as 'hotel' | 'car' }) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  return (
    <FilterSidebar
      kind={kind}
      filters={filters}
      onChange={setFilters}
      locations={['เชียงราย', 'เชียงใหม่', 'ปาย']}
      carTypes={['SUV', 'Sedan']}
      priceMin={0}
      priceMax={50000}
    />
  )
}

describe('FilterSidebar', () => {
  it('renders hotel-specific controls (stars, locations) for kind="hotel"', () => {
    render(<Harness kind="hotel" />)
    expect(screen.getByText('ระดับดาว')).toBeInTheDocument()
    expect(screen.getByText('ที่ตั้ง')).toBeInTheDocument()
    expect(screen.getByText('เชียงราย')).toBeInTheDocument()
  })

  it('renders car-specific controls (car types, seats) for kind="car"', () => {
    render(<Harness kind="car" />)
    expect(screen.getByText('ประเภทรถ')).toBeInTheDocument()
    expect(screen.getByText('จำนวนผู้โดยสาร')).toBeInTheDocument()
    expect(screen.getByText('SUV')).toBeInTheDocument()
  })

  it('does NOT show car controls in hotel mode and vice versa', () => {
    const { rerender } = render(<Harness kind="hotel" />)
    expect(screen.queryByText('ประเภทรถ')).not.toBeInTheDocument()
    rerender(<Harness kind="car" />)
    expect(screen.queryByText('ระดับดาว')).not.toBeInTheDocument()
  })

  it('clicking a star chip patches minStar', () => {
    render(<Harness kind="hotel" />)
    fireEvent.click(screen.getByText(/^4\+/))
    // No way to peek at internal state directly; verify by chip
    // remaining "active" — the styling diff is the indigo bg.
    const fourPlus = screen.getByText(/^4\+/)
    expect(fourPlus.closest('button')?.className).toContain('bg-indigo-600')
  })

  it('clicking it again toggles off', () => {
    render(<Harness kind="hotel" />)
    const fourPlus = screen.getByText(/^4\+/)
    fireEvent.click(fourPlus)
    fireEvent.click(fourPlus)
    expect(fourPlus.closest('button')?.className).not.toContain('bg-indigo-600')
  })

  it('reset link returns all filters to defaults', () => {
    function Probe() {
      const [filters, setFilters] = useState<FilterState>({
        ...EMPTY_FILTERS,
        q: 'x',
        minStar: 5,
      })
      return (
        <>
          <FilterSidebar
            kind="hotel"
            filters={filters}
            onChange={setFilters}
            locations={[]}
          />
          <div data-testid="state">{countActiveFilters(filters)}</div>
        </>
      )
    }
    render(<Probe />)
    expect(screen.getByTestId('state').textContent).toBe('2')
    fireEvent.click(screen.getByText('ล้างตัวกรอง'))
    expect(screen.getByTestId('state').textContent).toBe('0')
  })
})
