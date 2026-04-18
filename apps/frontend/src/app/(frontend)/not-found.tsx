/**
 * ============================================================
 * Frontend 404 Page
 * ============================================================
 */

import Link from 'next/link'
import { Compass, Home } from 'lucide-react'

export default function FrontendNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
          <Compass className="h-10 w-10 text-indigo-600" />
        </div>
        <p className="text-7xl font-extrabold text-indigo-600 mb-2">404</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          ไม่พบหน้าที่คุณค้นหา
        </h1>
        <p className="text-base text-slate-600 mb-1">Page not found</p>
        <p className="text-sm text-slate-500 mb-6">
          หน้าที่คุณกำลังค้นหาอาจถูกย้ายหรือถูกลบไปแล้ว
          <br />
          The page you&apos;re looking for may have been moved or deleted.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          <Home className="h-4 w-4" />
          กลับหน้าแรก / Back to Home
        </Link>
      </div>
    </div>
  )
}
