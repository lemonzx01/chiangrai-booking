/**
 * ============================================================
 * LoyaltyPointsPreview tests
 * ============================================================
 *
 * Pure presentation component — verifies the math + render
 * decisions:
 *   - Renders nothing when amount is below the rate floor
 *   - Renders the computed point amount as "+N pts"
 *   - Renders the Thai variant when language is 'th'
 *   - Larger size variant gets bigger classes
 *   - Negative / zero amounts don't render
 * ============================================================
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoyaltyPointsPreview from '@/components/shared/LoyaltyPointsPreview'

vi.mock('lucide-react', () => ({
  Star: ({ size, className }: { size?: number; className?: string }) => (
    <span data-icon="star" data-size={size} className={className}>
      star
    </span>
  ),
}))

describe('LoyaltyPointsPreview', () => {
  it('renders nothing when amount is below the rate floor (default 100 THB/pt)', () => {
    const { container } = render(<LoyaltyPointsPreview amountThb={50} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for zero or negative amounts', () => {
    const { container: c1 } = render(
      <LoyaltyPointsPreview amountThb={0} />
    )
    expect(c1.firstChild).toBeNull()

    const { container: c2 } = render(
      <LoyaltyPointsPreview amountThb={-100} />
    )
    expect(c2.firstChild).toBeNull()
  })

  it('renders the computed point amount as "+N แต้ม" by default (Thai)', () => {
    render(<LoyaltyPointsPreview amountThb={1500} />)
    // 1500 / 100 = 15 points
    expect(screen.getByText('+15 แต้ม')).toBeTruthy()
  })

  it('renders larger size class when size="md"', () => {
    render(<LoyaltyPointsPreview amountThb={1500} size="md" />)
    const badge = screen.getByText('+15 แต้ม').closest('span')
    expect(badge?.className).toContain('text-sm')
  })

  it('renders smaller size class when size="sm"', () => {
    render(<LoyaltyPointsPreview amountThb={1500} size="sm" />)
    const badge = screen.getByText('+15 แต้ม').closest('span')
    expect(badge?.className).toContain('text-xs')
  })

  it('floors fractional points (199 THB → 1 pt, not 2)', () => {
    render(<LoyaltyPointsPreview amountThb={199} />)
    expect(screen.getByText('+1 แต้ม')).toBeTruthy()
  })

  it('passes through extra className for layout overrides', () => {
    render(
      <LoyaltyPointsPreview amountThb={1500} className="extra-class" />
    )
    const badge = screen.getByText('+15 แต้ม').closest('span')
    expect(badge?.className).toContain('extra-class')
  })
})
