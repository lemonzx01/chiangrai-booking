'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { LayoutDashboard, RefreshCw } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-24">
      <div className="max-w-lg w-full">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-red-500 mb-2">
          Error — Partner
        </p>
        <h1 className="text-3xl md:text-4xl text-slate-900 leading-tight tracking-tight mb-3">
          <span className="font-bold">เกิดข้อผิดพลาด</span>{' '}
          <span className="font-display font-light italic text-slate-500">
            ในระบบพาร์ทเนอร์
          </span>
        </h1>
        <div className="h-px w-12 bg-slate-300 my-5" />
        <p className="text-sm text-slate-500 mb-2 leading-relaxed">
          ลองรีเฟรช หรือกลับไปแดชบอร์ด
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 mb-8 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            ลองใหม่
          </button>
          <Link
            href="/partner/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-900 hover:border-slate-900 hover:bg-slate-50 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            แดชบอร์ด
          </Link>
        </div>
      </div>
    </div>
  )
}
