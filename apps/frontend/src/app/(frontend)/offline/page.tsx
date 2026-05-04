/**
 * /offline — fallback page served by the service worker when
 * the network fails on a navigation request.
 *
 * Pre-cached at SW install time (see public/sw.js
 * PRECACHE_URLS), so it works even when there's NO connection
 * at all — the cached HTML loads from cacheStorage.
 *
 * Keep this page intentionally lightweight:
 *   - Tailwind classes only (essentially zero client JS aside
 *     from the reload button)
 *   - No dynamic data (would defeat the purpose)
 *   - Bilingual copy so neither audience is confused
 */

import { WifiOff, Compass } from 'lucide-react'
import Link from 'next/link'
import ReloadButtonClient from './ReloadButtonClient'

export const metadata = {
  title: "เครือข่ายขาด / You're offline",
  robots: { index: false, follow: false },
}

export const dynamic = 'force-static'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-8 sm:p-10 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-5">
          <WifiOff className="text-amber-600" size={28} />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
          เครือข่ายขาด
        </h1>
        <p className="text-sm text-slate-500 italic mb-4">You&apos;re offline</p>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          ดูเหมือนคุณไม่ได้เชื่อมต่ออินเทอร์เน็ตในขณะนี้
          <br />
          <span className="text-slate-400 italic">
            Looks like your device isn&apos;t connected right now.
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <ReloadButtonClient />
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-slate-300 hover:text-slate-900"
          >
            <Compass size={14} />
            กลับหน้าแรก
          </Link>
        </div>
        <p className="text-[11px] text-slate-400 mt-6">
          การจองและการชำระเงินต้องเชื่อมต่ออินเทอร์เน็ต<br />
          <span className="italic">Bookings + payments require an internet connection.</span>
        </p>
      </div>
    </div>
  )
}
