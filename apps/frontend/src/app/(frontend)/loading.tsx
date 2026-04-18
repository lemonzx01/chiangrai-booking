/**
 * ============================================================
 * Frontend Loading Page
 * ============================================================
 *
 * Shown automatically by Next.js while server components in
 * the (frontend) route group are streaming.
 * ============================================================
 */

import { Loader2 } from 'lucide-react'

export default function FrontendLoading() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 text-indigo-600 animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-600">
          กำลังโหลด... / Loading...
        </p>
      </div>
    </div>
  )
}
