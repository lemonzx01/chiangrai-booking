/**
 * ============================================================
 * Frontend 404 Page
 * ============================================================
 */

import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'

/**
 * Editorial 404 — typography-led, mixed-weight headline,
 * thin accent rule. The previous version had a bold "404" in
 * extrabold and a circle icon at top; that's a SaaS pattern.
 * This one reads "small magazine page not found" instead.
 */
export default function FrontendNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-lg w-full">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-slate-400 mb-2">
          404
        </p>
        <h1 className="text-4xl md:text-5xl text-slate-900 leading-tight tracking-tight mb-3">
          <span className="font-bold">หน้านี้</span>{' '}
          <span className="font-display font-light italic text-slate-500">
            หายไปไหน
          </span>
        </h1>
        <div className="h-px w-12 bg-slate-300 my-5" />
        <p className="text-base text-slate-600 mb-2 leading-relaxed">
          หน้าที่คุณค้นหาอาจถูกย้ายหรือถูกลบไปแล้ว
        </p>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          The page you&apos;re looking for may have been moved or deleted.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าแรก
          </Link>
          <Link
            href="/hotels"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-900 hover:border-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Compass className="h-4 w-4" />
            ดูที่พัก
          </Link>
        </div>
      </div>
    </div>
  )
}
