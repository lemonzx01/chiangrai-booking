/**
 * ============================================================
 * Toast / ToastProvider tests
 * ============================================================
 *
 * Covers the contract that consumers depend on:
 *   - useToast outside provider returns no-op (doesn't crash)
 *   - success/error/info/warning push a toast that renders
 *   - dismiss removes the toast immediately
 *   - role=alert vs role=status switches based on variant
 *   - Esc key dismisses the topmost toast
 * ============================================================
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from '@/components/shared/Toast'

// Lucide icons render as plain text spans so we can assert on label text.
vi.mock('lucide-react', () => {
  const Icon = (name: string) => ({ size }: { size?: number }) => (
    <span data-icon={name} data-size={size}>
      {name}
    </span>
  )
  return {
    CheckCircle2: Icon('check'),
    AlertCircle: Icon('alert'),
    AlertTriangle: Icon('warn'),
    Info: Icon('info'),
    X: Icon('x'),
  }
})

function Probe({ run }: { run: (api: ReturnType<typeof useToast>) => void }) {
  const api = useToast()
  return (
    <button onClick={() => run(api)}>fire</button>
  )
}

describe('useToast / ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('useToast outside provider returns no-op API (no crash)', () => {
    // Render Probe WITHOUT a ToastProvider; calling success() should not throw.
    render(<Probe run={(api) => api.success('hello')} />)
    expect(() => fireEvent.click(screen.getByText('fire'))).not.toThrow()
  })

  it('renders a success toast with role=status', () => {
    render(
      <ToastProvider>
        <Probe run={(api) => api.success('saved!')} />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('fire'))
    const toast = screen.getByRole('status')
    expect(toast.textContent).toContain('saved!')
  })

  it('renders an error toast with role=alert', () => {
    render(
      <ToastProvider>
        <Probe run={(api) => api.error('boom')} />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('fire'))
    const toast = screen.getByRole('alert')
    expect(toast.textContent).toContain('boom')
  })

  it('renders a warning toast with role=alert', () => {
    render(
      <ToastProvider>
        <Probe run={(api) => api.warning('careful')} />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('fire'))
    expect(screen.getByRole('alert').textContent).toContain('careful')
  })

  it('renders an info toast with role=status', () => {
    render(
      <ToastProvider>
        <Probe run={(api) => api.info('fyi')} />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('fire'))
    expect(screen.getByRole('status').textContent).toContain('fyi')
  })

  it('shows the title above the message when provided', () => {
    render(
      <ToastProvider>
        <Probe run={(api) => api.success('body text', { title: 'Saved' })} />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('fire'))
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('body text')).toBeInTheDocument()
  })

  it('auto-dismisses after the default 4000ms duration', () => {
    render(
      <ToastProvider>
        <Probe run={(api) => api.success('bye')} />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('fire'))
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('respects a custom duration', () => {
    render(
      <ToastProvider>
        <Probe run={(api) => api.success('quick', { duration: 1000 })} />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('fire'))
    act(() => {
      vi.advanceTimersByTime(900)
    })
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('clicking the close button dismisses immediately', () => {
    render(
      <ToastProvider>
        <Probe run={(api) => api.success('keep me')} />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('fire'))
    expect(screen.getByRole('status')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('ปิด'))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('Esc dismisses the topmost toast', () => {
    render(
      <ToastProvider>
        <Probe run={(api) => api.success('A')} />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('fire'))
    expect(screen.getByRole('status')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('error toasts default to a 6000ms duration', () => {
    render(
      <ToastProvider>
        <Probe run={(api) => api.error('long-lived')} />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('fire'))
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2100)
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
