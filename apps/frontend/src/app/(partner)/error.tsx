'use client'

/**
 * ============================================================
 * Partner Error Boundary
 * ============================================================
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, LayoutDashboard, RefreshCw } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PartnerError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[PartnerError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          เกิดข้อผิดพลาดในระบบพาร์ทเนอร์
        </h1>
        <p className="text-base text-slate-600 mb-1">Partner panel error</p>
        <p className="text-sm text-slate-500 mb-6">
          เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่
          <br />
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            <RefreshCw className="h-4 w-4" />
            ลองใหม่ / Try Again
          </button>
          <Link
            href="/partner/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <LayoutDashboard className="h-4 w-4" />
            แดชบอร์ด / Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
