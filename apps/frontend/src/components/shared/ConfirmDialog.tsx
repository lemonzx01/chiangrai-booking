/**
 * ============================================================
 * ConfirmDialog — non-blocking replacement for window.confirm
 * ============================================================
 *
 * Two ways to use:
 *   1. <ConfirmDialog open={...} onConfirm={...} onCancel={...} />
 *      Manual control, fits any form-style component
 *   2. const confirm = useConfirm(); await confirm({ title, body })
 *      Imperative, fits inline event handlers like:
 *
 *        if (!await confirm({ title: 'ลบ?' })) return
 *
 * Why replace window.confirm:
 *   - window.confirm blocks the JS thread; our dialog is async
 *   - native dialog can't show our brand styling / Thai font
 *   - native dialog ignores prefers-reduced-motion / focus rules
 *
 * Variants:
 *   - 'default' (indigo)
 *   - 'danger' (red — used for destructive actions)
 * ============================================================
 */

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

export interface ConfirmOptions {
  title: string
  /** Body text or rich content. */
  body?: ReactNode
  /** Label for the confirm button. Defaults to "ยืนยัน". */
  confirmLabel?: string
  /** Label for the cancel button. Defaults to "ยกเลิก". */
  cancelLabel?: string
  /** Color theme. */
  variant?: 'default' | 'danger'
}

interface ConfirmApi {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmApi | null>(null)

// ---------------------------------------------------------------
// Provider — host the dialog state at app root
// ---------------------------------------------------------------

interface PendingState {
  opts: ConfirmOptions
  resolve: (value: boolean) => void
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null)
  const [closing, setClosing] = useState(false)

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ opts, resolve })
      }),
    []
  )

  const close = (result: boolean) => {
    if (!pending) return
    setClosing(true)
    pending.resolve(result)
    // Brief delay so the close animation has time to play before unmount.
    setTimeout(() => {
      setPending(null)
      setClosing(false)
    }, 150)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && !closing && (
        <ConfirmDialog
          open
          {...pending.opts}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    // Permissive fallback so the call doesn't crash if the
    // provider isn't mounted (and falls back to native confirm).
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'useConfirm called outside ConfirmDialogProvider — falling back to native window.confirm'
      )
    }
    return (opts) => Promise.resolve(window.confirm(opts.title))
  }
  return ctx.confirm
}

// ---------------------------------------------------------------
// Standalone dialog (controlled by parent)
// ---------------------------------------------------------------

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useFocusTrap<HTMLDivElement>(open)
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  const confirmCls =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-indigo-600 hover:bg-indigo-700 text-white'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      onClick={onCancel}
    >
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-up"
      >
        <div className="flex items-start gap-4 px-6 pt-5 pb-3">
          {variant === 'danger' && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 id="confirm-title" className="text-base font-bold text-slate-900">
              {title}
            </h2>
            {body && (
              <div className="mt-1.5 text-sm text-slate-600 leading-relaxed">{body}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="ปิด"
            className="flex-shrink-0 p-1 -m-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold ${confirmCls} disabled:opacity-60 inline-flex items-center justify-center gap-2`}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
