/**
 * ============================================================
 * BottomSheet — mobile-friendly drawer that slides up from
 * the bottom edge. On desktop it falls back to a centered
 * modal so a single component can drive both forms.
 * ============================================================
 *
 * Use cases:
 *   - Filter UI on listing pages (mobile)
 *   - Booking confirmation step
 *   - Any "needs to take over the screen" interaction
 *
 * Behaviour:
 *   - Backdrop click closes
 *   - Esc closes
 *   - Focus trapped inside while open
 *   - Body scroll locked while open
 *   - Drag-handle visual on mobile (no actual drag — keeps the
 *     bundle lean; touch users tap backdrop or the X button)
 * ============================================================
 */

'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Optional footer rendered below children (e.g. confirm button row). */
  footer?: ReactNode
  /** Tailwind max-height for the sheet. Default 'max-h-[85vh]'. */
  maxHeight?: string
}

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  maxHeight = 'max-h-[85vh]',
}: BottomSheetProps) {
  const isMobile = useIsMobile()
  const ref = useFocusTrap<HTMLDivElement>(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
      className={`fixed inset-0 z-50 ${
        isMobile ? 'flex items-end justify-stretch' : 'flex items-center justify-center p-4'
      } bg-black/40`}
      onClick={onClose}
    >
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white shadow-2xl w-full ${maxHeight} flex flex-col ${
          isMobile
            ? 'rounded-t-3xl animate-slide-up'
            : 'rounded-2xl max-w-md animate-scale-up'
        }`}
      >
        {/* Drag handle (mobile only, decorative) */}
        {isMobile && (
          <div className="pt-2 pb-1 flex justify-center" aria-hidden="true">
            <div className="w-10 h-1.5 rounded-full bg-slate-300" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิด"
              className="p-1.5 -m-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Footer — sticky at the bottom of the sheet */}
        {footer && (
          <div className="px-5 py-3 border-t border-slate-100 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
