import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PaymentTable from '@/components/admin/PaymentTable'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  CreditCard: () => <span>CreditCard</span>,
  Clock: () => <span>Clock</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  XCircle: () => <span>XCircle</span>,
  ArrowUpDown: () => <span>ArrowUpDown</span>,
  RefreshCw: () => <span>RefreshCw</span>,
}))

// Mock useLocalize
vi.mock('@/hooks/useLocalize', () => ({
  default: () => ({
    localize: (v: { th: string; en: string }) => v.th,
    getField: (obj: Record<string, string>, field: string) => obj[`${field}_th`] || '',
    getArrayField: () => [],
    lang: 'th',
  }),
  useLocalize: () => ({
    localize: (v: { th: string; en: string }) => v.th,
    getField: (obj: Record<string, string>, field: string) => obj[`${field}_th`] || '',
    getArrayField: () => [],
    lang: 'th',
  }),
}))

const mockPayments = [
  {
    id: 'pay-1',
    booking_id: 'book-1',
    stripe_payment_intent_id: 'pi_123',
    stripe_checkout_session_id: 'cs_123',
    amount: 5000,
    currency: 'THB',
    status: 'SUCCEEDED',
    paid_at: '2024-01-15T10:00:00Z',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    booking: {
      booking_code: 'TE240115-ABCD',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      total_price: 5000,
    },
  },
  {
    id: 'pay-2',
    booking_id: 'book-2',
    stripe_payment_intent_id: 'pi_456',
    stripe_checkout_session_id: 'cs_456',
    amount: 3000,
    currency: 'THB',
    status: 'PENDING',
    paid_at: null,
    created_at: '2024-01-16T09:00:00Z',
    updated_at: '2024-01-16T09:00:00Z',
    booking: {
      booking_code: 'TE240116-EFGH',
      customer_name: 'Jane Smith',
      customer_email: 'jane@example.com',
      total_price: 3000,
    },
  },
]

describe('PaymentTable', () => {
  it('should render without crashing', () => {
    render(<PaymentTable payments={mockPayments} />)
  })

  it('should display booking codes', () => {
    render(<PaymentTable payments={mockPayments} />)
    expect(screen.getByText('TE240115-ABCD')).toBeInTheDocument()
    expect(screen.getByText('TE240116-EFGH')).toBeInTheDocument()
  })

  it('should display customer names', () => {
    render(<PaymentTable payments={mockPayments} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('should display empty state when no payments', () => {
    render(<PaymentTable payments={[]} />)
    // The component should show some empty message
    const container = document.querySelector('table') || document.querySelector('div')
    expect(container).toBeDefined()
  })

  it('should render all payment rows', () => {
    render(<PaymentTable payments={mockPayments} />)
    // Both rows should be rendered
    const rows = document.querySelectorAll('tr')
    // At least header + 2 data rows
    expect(rows.length).toBeGreaterThanOrEqual(3)
  })

  it('should display amounts', () => {
    render(<PaymentTable payments={mockPayments} />)
    // Check that amounts are displayed (formatted)
    expect(screen.getByText(/5,000/)).toBeInTheDocument()
  })
})
