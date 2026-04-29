/**
 * SystemStatusWidget — at-a-glance health for admins.
 *
 * Polls /api/health every 60s and renders:
 *   - overall status pill (ok / degraded / error)
 *   - per-service dots (DB, Stripe, Email, Auth)
 *   - deploy info IF the response carries it (admin secret
 *     supplied via NEXT_PUBLIC_HEALTH_CHECK_SECRET — ok to
 *     expose to admins because the page itself is admin-gated)
 *
 * Why poll instead of WebSocket: status changes are rare; a
 * minute of staleness is fine, and polling is simpler than a
 * Supabase Realtime channel just for this.
 *
 * Why a client component on a server-rendered dashboard: the
 * admin viewing this can fix problems they see, so live data
 * matters more than initial-paint performance.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  Database,
  CreditCard,
  Mail,
  Lock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  GitBranch,
  MapPin,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  version: string
  env: string
  services: {
    database: 'ok' | 'mock' | 'down'
    stripe: 'configured' | 'mock'
    email: 'configured' | 'mock'
    auth: 'configured' | 'missing'
  }
  // Optional detailed mode
  deploy?: {
    commitSha: string | null
    commitRef: string | null
    commitMessage: string | null
    region: string | null
  }
  uptime?: { seconds: number }
  probes?: { database: { ok: boolean; latencyMs: number | null } }
}

const POLL_MS = 60_000

export default function SystemStatusWidget() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      // The detailed (?secret=...) variant is optional. If
      // NEXT_PUBLIC_HEALTH_CHECK_SECRET is set in admin env,
      // unlock deploy + uptime + probes detail.
      const adminSecret = process.env.NEXT_PUBLIC_HEALTH_CHECK_SECRET
      const url = adminSecret
        ? `/api/health?secret=${encodeURIComponent(adminSecret)}`
        : '/api/health'
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as HealthResponse
      setHealth(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => {
      void refresh()
    }, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  if (loading && !health) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={14} className="animate-spin" />
          กำลังโหลดสถานะระบบ...
        </div>
      </div>
    )
  }

  if (error && !health) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-2 text-sm text-red-700">
          <XCircle size={16} />
          ตรวจสอบสถานะไม่ได้: {error}
        </div>
      </div>
    )
  }

  if (!health) return null

  const overallTone =
    health.status === 'ok'
      ? { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, label: 'ระบบปกติ' }
      : health.status === 'degraded'
        ? { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, label: 'ทำงานบางส่วน' }
        : { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, label: 'มีปัญหา' }
  const OverallIcon = overallTone.icon

  return (
    <div className={`rounded-2xl border ${overallTone.border} ${overallTone.bg} p-5`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className={overallTone.color} />
          <h2 className="text-sm font-bold text-slate-900">สถานะระบบ</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            void refresh()
          }}
          aria-label="รีเฟรช"
          className="text-slate-400 hover:text-slate-700 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Overall status */}
      <div className="flex items-center gap-2 mb-4">
        <OverallIcon size={20} className={overallTone.color} />
        <div className="flex-1">
          <div className={`font-bold ${overallTone.color}`}>{overallTone.label}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            อัปเดตล่าสุด {new Date(health.timestamp).toLocaleTimeString('th-TH')}
          </div>
        </div>
      </div>

      {/* Per-service grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <ServiceRow
          icon={Database}
          label="ฐานข้อมูล"
          status={health.services.database}
          latencyMs={health.probes?.database.latencyMs ?? undefined}
        />
        <ServiceRow
          icon={CreditCard}
          label="Stripe"
          status={health.services.stripe}
        />
        <ServiceRow icon={Mail} label="อีเมล" status={health.services.email} />
        <ServiceRow icon={Lock} label="Auth" status={health.services.auth} />
      </div>

      {/* Deploy info — only when detailed mode is unlocked */}
      {health.deploy && (
        <div className="border-t border-slate-200 pt-3 space-y-1.5 text-[11px] text-slate-600">
          {health.deploy.commitSha && (
            <div className="flex items-center gap-1.5">
              <GitBranch size={11} />
              <span className="font-mono">
                {health.deploy.commitRef || 'HEAD'} @ {health.deploy.commitSha.slice(0, 7)}
              </span>
              {health.deploy.commitMessage && (
                <span className="truncate text-slate-500">
                  — {health.deploy.commitMessage}
                </span>
              )}
            </div>
          )}
          {health.deploy.region && (
            <div className="flex items-center gap-1.5">
              <MapPin size={11} />
              <span>region: {health.deploy.region}</span>
              {health.uptime && (
                <span className="text-slate-400">
                  · uptime {formatUptime(health.uptime.seconds)}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Env hint when no detailed mode is wired */}
      {!health.deploy && (
        <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-200">
          เวอร์ชัน: <span className="font-mono">{health.version.slice(0, 7)}</span>
          {' · '}
          env: <span className="font-mono">{health.env}</span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function ServiceRow({
  icon: Icon,
  label,
  status,
  latencyMs,
}: {
  icon: LucideIcon
  label: string
  status: string
  latencyMs?: number
}) {
  const tone =
    status === 'ok' || status === 'configured'
      ? 'text-emerald-600'
      : status === 'mock'
        ? 'text-amber-600'
        : 'text-red-600'
  const dotBg =
    status === 'ok' || status === 'configured'
      ? 'bg-emerald-500'
      : status === 'mock'
        ? 'bg-amber-500'
        : 'bg-red-500'

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-100">
      <span className={`relative flex-shrink-0 w-1.5 h-1.5 rounded-full ${dotBg}`}>
        {(status === 'ok' || status === 'configured') && (
          <span
            className={`absolute inset-0 rounded-full ${dotBg} opacity-75 animate-ping`}
          />
        )}
      </span>
      <Icon size={12} className="text-slate-400" />
      <span className="text-xs font-medium text-slate-700 flex-1 truncate">
        {label}
      </span>
      <span className={`text-[10px] font-bold ${tone}`}>
        {status === 'ok' && 'ปกติ'}
        {status === 'configured' && 'พร้อม'}
        {status === 'mock' && 'mock'}
        {status === 'down' && 'ขัดข้อง'}
        {status === 'missing' && 'ขาด'}
      </span>
      {typeof latencyMs === 'number' && (
        <span className="text-[10px] text-slate-400 font-mono">
          {latencyMs}ms
        </span>
      )}
    </div>
  )
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}
