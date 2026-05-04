'use client'

/**
 * ============================================================
 * Frontend Error Boundary
 * ============================================================
 *
 * Catches errors thrown by pages within the (frontend) route group.
 * The (frontend) layout (Navbar/Footer) is preserved around this UI.
 * ============================================================
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Editorial error boundary — same typographic recipe as 404,
 * red error icon dropped in favour of a small all-caps eyebrow.
 */
export default function FrontendError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[FrontendError]', error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-lg w-full">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-red-500 mb-2">
          Error
        </p>
        <h1 className="text-4xl md:text-5xl text-slate-900 leading-tight tracking-tight mb-3">
          <span className="font-bold">เกิดอะไรบางอย่าง</span>{' '}
          <span className="font-display font-light italic text-slate-500">
            ที่ไม่ได้คาดไว้
          </span>
        </h1>
        <div className="h-px w-12 bg-slate-300 my-5" />
        <p className="text-base text-slate-600 mb-2 leading-relaxed">
          ขออภัยสำหรับความไม่สะดวก ลองรีเฟรชหรือกลับไปหน้าหลักได้เลย
        </p>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          We&apos;re sorry for the inconvenience.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            ลองใหม่
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-900 hover:border-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  )
}
