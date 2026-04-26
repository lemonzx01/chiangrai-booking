/**
 * ============================================================
 * Lightbox — full-screen image viewer with keyboard nav
 * ============================================================
 *
 * Used by ImageGallery (and anywhere else a click-to-enlarge
 * image is helpful). Keeps focus trapped, supports Esc to
 * close, ←/→ to navigate, and a swipe gesture on touch.
 *
 * Implementation notes:
 *   - Renders nothing when `open === false`. No portal needed
 *     because we use position:fixed + z-[70] which floats above
 *     the toast viewport (z-60).
 *   - Wraps the image in a button so screen readers treat the
 *     advance/retreat as proper actions.
 *   - Touch swipe is hand-rolled to keep the bundle lean — a
 *     30px horizontal threshold triggers prev/next.
 * ============================================================
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface LightboxProps {
  open: boolean
  images: string[]
  initialIndex?: number
  alt?: string
  onClose: () => void
}

export default function Lightbox({
  open,
  images,
  initialIndex = 0,
  alt = '',
  onClose,
}: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const containerRef = useFocusTrap<HTMLDivElement>(open)
  const touchStartX = useRef<number | null>(null)

  // Reset index whenever a fresh open happens.
  useEffect(() => {
    if (open) setIndex(initialIndex)
  }, [open, initialIndex])

  // Lock background scroll while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Keyboard navigation.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, images.length, onClose])

  if (!open || images.length === 0) return null

  const next = () => setIndex((i) => (i + 1) % images.length)
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length)

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="ดูรูปขยาย"
      className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current
        const end = e.changedTouches[0]?.clientX ?? null
        touchStartX.current = null
        if (start === null || end === null) return
        const dx = end - start
        if (dx > 30) prev()
        else if (dx < -30) next()
      }}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="ปิด"
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
      >
        <X size={22} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium">
        {index + 1} / {images.length}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            prev()
          }}
          aria-label="ก่อนหน้า"
          className="absolute left-4 sm:left-6 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <ChevronLeft size={26} />
        </button>
      )}

      {/* Image */}
      <div
        className="relative w-full h-full max-w-6xl max-h-[85vh] mx-auto px-12"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[index]}
          alt={alt || `รูปที่ ${index + 1}`}
          fill
          sizes="100vw"
          className="object-contain select-none"
          priority
        />
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            next()
          }}
          aria-label="ถัดไป"
          className="absolute right-4 sm:right-6 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <ChevronRight size={26} />
        </button>
      )}
    </div>
  )
}
