/**
 * ============================================================
 * Toast / Notification System (context + portal-free renderer)
 * ============================================================
 *
 * Why this exists:
 *   The codebase currently uses `alert()` for errors — that
 *   blocks the main thread and looks like a 1990s desktop app.
 *   This replaces it with a non-blocking, accessible, themable
 *   bottom-right stack.
 *
 * Usage:
 *   1. Wrap your app once in <ToastProvider>
 *   2. Anywhere inside, call `const toast = useToast()` and
 *      `toast.success(message)` / `.error()` / `.info()`
 *
 * Accessibility:
 *   - role="status" + aria-live="polite" for non-error toasts
 *   - role="alert" + aria-live="assertive" for errors, so screen
 *     readers announce immediately
 *   - Each toast can be dismissed via Esc / X button
 *
 * Behaviour:
 *   - Auto-dismiss after `duration` ms (default 4000)
 *   - Stacks newest at top, shifts older down
 *   - On mobile: full width minus margin; on desktop: 380px
 * ============================================================
 */

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, AlertTriangle, Info, X, AlertCircle } from 'lucide-react'

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  variant: ToastVariant
  title?: string
  message: string
  duration?: number
}

interface ToastApi {
  show: (input: Omit<Toast, 'id'>) => void
  success: (message: string, opts?: { title?: string; duration?: number }) => void
  error: (message: string, opts?: { title?: string; duration?: number }) => void
  info: (message: string, opts?: { title?: string; duration?: number }) => void
  warning: (message: string, opts?: { title?: string; duration?: number }) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastApi | null>(null)

// ---------------------------------------------------------------
// Provider
// ---------------------------------------------------------------

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback<ToastApi['show']>(
    (input) => {
      const id = ++idRef.current
      const toast: Toast = { id, duration: 4000, ...input }
      setToasts((prev) => [toast, ...prev])
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => dismiss(id), toast.duration)
      }
    },
    [dismiss]
  )

  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (message, opts) => show({ variant: 'success', message, ...opts }),
      error: (message, opts) =>
        show({ variant: 'error', message, duration: 6000, ...opts }),
      info: (message, opts) => show({ variant: 'info', message, ...opts }),
      warning: (message, opts) => show({ variant: 'warning', message, ...opts }),
    }),
    [show, dismiss]
  )

  // Esc dismisses the topmost toast — least surprising default.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toasts.length > 0) {
        dismiss(toasts[0].id)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [toasts, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ---------------------------------------------------------------
// Hook
// ---------------------------------------------------------------

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Permissive fallback so .success(...) calls don't crash an
    // accidental SSR component — they just no-op.
    if (process.env.NODE_ENV === 'development') {
      console.warn('useToast called outside ToastProvider — wrap your tree.')
    }
    const noop = () => {}
    return {
      show: noop,
      success: noop,
      error: noop,
      info: noop,
      warning: noop,
      dismiss: noop,
    }
  }
  return ctx
}

// ---------------------------------------------------------------
// Viewport (the actual rendered stack)
// ---------------------------------------------------------------

interface ViewportProps {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

function ToastViewport({ toasts, onDismiss }: ViewportProps) {
  return (
    <div
      aria-label="การแจ้งเตือน / Notifications"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none w-[calc(100%-2rem)] sm:w-[380px]"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}

const variantStyles: Record<ToastVariant, { bg: string; icon: React.ReactNode; iconCls: string }> = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    icon: <CheckCircle2 size={18} />,
    iconCls: 'text-emerald-600',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: <AlertCircle size={18} />,
    iconCls: 'text-red-600',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: <AlertTriangle size={18} />,
    iconCls: 'text-amber-600',
  },
  info: {
    bg: 'bg-indigo-50 border-slate-200',
    icon: <Info size={18} />,
    iconCls: 'text-slate-900',
  },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const v = variantStyles[toast.variant]
  const isError = toast.variant === 'error' || toast.variant === 'warning'
  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`pointer-events-auto rounded-xl border ${v.bg} shadow-lg p-3 sm:p-4 flex gap-3 items-start animate-slide-up`}
    >
      <span className={`flex-shrink-0 mt-0.5 ${v.iconCls}`}>{v.icon}</span>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="text-sm font-semibold text-slate-900 mb-0.5">{toast.title}</div>
        )}
        <div className="text-sm text-slate-700 break-words">{toast.message}</div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="ปิด"
        className="flex-shrink-0 p-1 -m-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white/60"
      >
        <X size={14} />
      </button>
    </div>
  )
}
