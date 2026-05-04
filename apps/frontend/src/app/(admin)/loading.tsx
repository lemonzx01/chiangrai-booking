/**
 * ============================================================
 * Admin Loading Page
 * ============================================================
 */

import { Loader2 } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 text-slate-900 animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-600">
          กำลังโหลด... / Loading...
        </p>
      </div>
    </div>
  )
}
