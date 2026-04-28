/**
 * Tiny client component just for the reload button.
 * Keeps the rest of the offline page server-rendered (smaller,
 * faster, cache-able by the service worker without revalidation).
 */
'use client'

import { RefreshCw } from 'lucide-react'

export default function ReloadButtonClient() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
    >
      <RefreshCw size={14} />
      ลองใหม่
    </button>
  )
}
