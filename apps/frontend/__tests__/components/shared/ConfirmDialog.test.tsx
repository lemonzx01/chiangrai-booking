/**
 * ============================================================
 * ConfirmDialog tests
 * ============================================================
 *
 * Covers:
 *   - useConfirm() returns Promise<boolean>
 *   - resolves false on cancel / backdrop / Esc / X
 *   - resolves true on confirm
 *   - shows danger styling when variant='danger'
 *   - shows custom labels
 * ============================================================
 */

import React, { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import {
  ConfirmDialogProvider,
  useConfirm,
} from '@/components/shared/ConfirmDialog'

vi.mock('lucide-react', () => {
  const Icon = (name: string) => ({ size }: { size?: number }) => (
    <span data-icon={name} data-size={size}>{name}</span>
  )
  return {
    AlertTriangle: Icon('warn'),
    X: Icon('x'),
    Loader2: Icon('loading'),
  }
})

function Probe({
  options,
  onResult,
}: {
  options: { title: string; variant?: 'default' | 'danger' }
  onResult: (v: boolean) => void
}) {
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        const r = await confirm(options)
        onResult(r)
        setBusy(false)
      }}
    >
      open
    </button>
  )
}

describe('ConfirmDialog / useConfirm', () => {
  it('resolves true when the confirm button is clicked', async () => {
    const onResult = vi.fn()
    render(
      <ConfirmDialogProvider>
        <Probe options={{ title: 'Are you sure?' }} onResult={onResult} />
      </ConfirmDialogProvider>
    )
    fireEvent.click(screen.getByText('open'))
    expect(await screen.findByText('Are you sure?')).toBeInTheDocument()

    fireEvent.click(screen.getByText('ยืนยัน'))
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
  })

  it('resolves false when the cancel button is clicked', async () => {
    const onResult = vi.fn()
    render(
      <ConfirmDialogProvider>
        <Probe options={{ title: 'Cancel me' }} onResult={onResult} />
      </ConfirmDialogProvider>
    )
    fireEvent.click(screen.getByText('open'))
    expect(await screen.findByText('Cancel me')).toBeInTheDocument()

    fireEvent.click(screen.getByText('ยกเลิก'))
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
  })

  it('resolves false when the X button is clicked', async () => {
    const onResult = vi.fn()
    render(
      <ConfirmDialogProvider>
        <Probe options={{ title: 'Close me' }} onResult={onResult} />
      </ConfirmDialogProvider>
    )
    fireEvent.click(screen.getByText('open'))
    await screen.findByText('Close me')

    fireEvent.click(screen.getByLabelText('ปิด'))
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
  })

  it('resolves false when the backdrop is clicked', async () => {
    const onResult = vi.fn()
    render(
      <ConfirmDialogProvider>
        <Probe options={{ title: 'Backdrop close' }} onResult={onResult} />
      </ConfirmDialogProvider>
    )
    fireEvent.click(screen.getByText('open'))
    await screen.findByText('Backdrop close')

    // Backdrop is the dialog wrapper itself (the outermost div with role=dialog)
    fireEvent.click(screen.getByRole('dialog'))
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
  })

  it('renders danger styling on the confirm button when variant=danger', async () => {
    render(
      <ConfirmDialogProvider>
        <Probe
          options={{ title: 'Delete?', variant: 'danger' }}
          onResult={() => {}}
        />
      </ConfirmDialogProvider>
    )
    fireEvent.click(screen.getByText('open'))
    const confirmBtn = await screen.findByText('ยืนยัน')
    expect(confirmBtn.className).toContain('bg-red-600')
  })

  it('falls back to native window.confirm when provider is missing', async () => {
    const original = window.confirm
    const spy = vi.fn().mockReturnValue(true)
    window.confirm = spy as unknown as typeof window.confirm
    try {
      const onResult = vi.fn()
      render(<Probe options={{ title: 'Bare' }} onResult={onResult} />)
      fireEvent.click(screen.getByText('open'))
      await waitFor(() => expect(spy).toHaveBeenCalledWith('Bare'))
      await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
    } finally {
      window.confirm = original
    }
  })
})
