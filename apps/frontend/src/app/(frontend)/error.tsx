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
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function FrontendError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[FrontendError]', error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          เกิดข้อผิดพลาด
        </h1>
        <p className="text-base text-slate-600 mb-1">
          Something went wrong
        </p>
        <p className="text-sm text-slate-500 mb-6">
          ขออภัยสำหรับความไม่สะดวก กรุณาลองใหม่อีกครั้ง
          <br />
          We&apos;re sorry for the inconvenience. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-4 w-4" />
            ลองใหม่ / Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Home className="h-4 w-4" />
            กลับหน้าแรก / Home
          </Link>
        </div>
      </div>
    </div>
  )
}
