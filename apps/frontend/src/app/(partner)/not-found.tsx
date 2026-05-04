import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'

export default function PartnerNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-24">
      <div className="max-w-lg w-full">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-slate-400 mb-2">
          404 — Partner
        </p>
        <h1 className="text-3xl md:text-4xl text-slate-900 leading-tight tracking-tight mb-3">
          <span className="font-bold">ไม่พบหน้านี้</span>{' '}
          <span className="font-display font-light italic text-slate-500">
            ในระบบพาร์ทเนอร์
          </span>
        </h1>
        <div className="h-px w-12 bg-slate-300 my-5" />
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          เส้นทางที่คุณเข้าถึงไม่มีอยู่จริง — กลับไปแดชบอร์ดเพื่อเริ่มต้นใหม่
        </p>
        <Link
          href="/partner/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          กลับแดชบอร์ด
        </Link>
      </div>
    </div>
  )
}
