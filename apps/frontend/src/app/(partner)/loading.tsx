/**
 * Partner loading state. Same editorial pattern as the
 * (frontend) and (admin) versions — thin pulsing rule + tiny
 * eyebrow caption, no spinner.
 */

export default function PartnerLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="h-px w-16 bg-slate-900 mx-auto mb-4 animate-pulse" />
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          กำลังโหลด
        </p>
      </div>
    </div>
  )
}
