/**
 * ============================================================
 * Partner Loading Page
 * ============================================================
 */

import { Loader2 } from 'lucide-react'

export default function PartnerLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 text-indigo-600 animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-600">
          กำลังโหลด... / Loading...
        </p>
      </div>
    </div>
  )
}
