/**
 * ============================================================
 * Frontend Loading Page
 * ============================================================
 *
 * Shown automatically by Next.js while server components in
 * the (frontend) route group are streaming.
 * ============================================================
 */

/**
 * Frontend loading state. A spinning circle is generic; a thin
 * pulsing rule reads more "we know what we're doing" without
 * stealing attention from whatever's about to render.
 */
export default function FrontendLoading() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-32">
      <div className="text-center">
        <div className="h-px w-16 bg-slate-900 mx-auto mb-4 animate-pulse" />
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          กำลังโหลด
        </p>
      </div>
    </div>
  )
}
