/**
 * ============================================================
 * Admin 404 Page
 * ============================================================
 */

import Link from 'next/link'
import { LayoutDashboard, ServerCrash } from 'lucide-react'

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
          <ServerCrash className="h-10 w-10 text-indigo-600" />
        </div>
        <p className="text-7xl font-extrabold text-indigo-600 mb-2">404</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          ไม่พบหน้านี้ในระบบแอดมิน
        </h1>
        <p className="text-base text-slate-600 mb-1">Admin page not found</p>
        <p className="text-sm text-slate-500 mb-6">
          เส้นทางที่คุณเข้าถึงไม่มีอยู่จริง
          <br />
          The path you tried does not exist.
        </p>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          <LayoutDashboard className="h-4 w-4" />
          กลับแดชบอร์ด / Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
