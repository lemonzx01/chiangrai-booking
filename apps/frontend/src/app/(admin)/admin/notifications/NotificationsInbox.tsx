'use client'

/**
 * ============================================================
 * Admin Notifications Inbox — list + filters + bulk actions
 * ============================================================
 *
 * Layout:
 *   1. Summary tiles (total / unread / mark-all-read)
 *   2. Filter row: status, type dropdown, severity chips
 *   3. Bulk-select toolbar (appears when ≥1 row is checked):
 *      mark read / mark unread / delete
 *   4. List with per-row checkbox + actions
 *
 * Bulk actions hit POST /api/admin/notifications with
 * { action, ids: [...] } — see the route handler for accepted
 * action shapes. The route caps ids at 200 per request, so
 * the UI mirrors that on the bulk-toolbar's "Select all
 * visible" link.
 * ============================================================
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Circle,
  Loader2,
  CheckSquare,
  Square,
  X,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/shared/Toast'
import { useConfirm } from '@/components/shared/ConfirmDialog'
import type { AdminNotification } from './page'

interface Props {
  initial: {
    notifications: AdminNotification[]
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
    summary: { unread: number; types?: string[] }
  }
}

type StatusKey = 'all' | 'unread' | 'read'
type SeverityKey = 'all' | 'info' | 'success' | 'warning' | 'error'

const SEVERITY_STYLES: Record<AdminNotification['severity'], string> = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
}

const TYPE_LABELS: Record<string, string> = {
  'booking.created': 'การจองใหม่',
  'booking.cancelled': 'การยกเลิก',
  'booking.paid': 'ชำระเงิน',
  'booking.manual_created': 'จอง manual',
  'booking.modification_request': 'ขอเลื่อนวัน',
  'booking.rescheduled': 'เลื่อนวันแล้ว',
  'review.submitted': 'รีวิวใหม่',
  'payment.failed': 'ชำระเงินไม่สำเร็จ',
  'payment.refunded': 'คืนเงิน',
}

function formatDateTime(input: string): string {
  try {
    return new Date(input).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return input
  }
}

function labelForType(t: string): string {
  return TYPE_LABELS[t] || t
}

export default function NotificationsInbox({ initial }: Props) {
  const toast = useToast()
  const confirm = useConfirm()

  const [notifications, setNotifications] = useState<AdminNotification[]>(
    initial.notifications
  )
  const [unread, setUnread] = useState(initial.summary.unread)
  const [knownTypes] = useState<string[]>(initial.summary.types || [])

  // Filters
  const [status, setStatus] = useState<StatusKey>('all')
  const [type, setType] = useState<string>('all')
  const [severity, setSeverity] = useState<SeverityKey>('all')

  // Bulk select state — Set of notification ids
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [bulkSaving, setBulkSaving] = useState(false)
  const [error, setError] = useState('')

  // ---- Filtering -----------------------------------------------
  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (status === 'unread' && n.is_read) return false
      if (status === 'read' && !n.is_read) return false
      if (type !== 'all' && n.type !== type) return false
      if (severity !== 'all' && n.severity !== severity) return false
      return true
    })
  }, [notifications, status, type, severity])

  // ---- Selection helpers ---------------------------------------
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const selectAllVisible = () => {
    setSelected(new Set(filtered.slice(0, 200).map((n) => n.id)))
  }
  const clearSelection = () => setSelected(new Set())

  // ---- Per-row actions -----------------------------------------
  const handleToggleRead = async (notification: AdminNotification) => {
    const next = !notification.is_read
    setError('')
    try {
      const res = await apiFetch(`/api/admin/notifications/${notification.id}`, {
        method: 'PATCH',
        body: { action: next ? 'read' : 'unread' },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { error?: { message?: string } })?.error?.message || 'อัปเดตไม่สำเร็จ'
        )
      }
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: next, read_at: next ? new Date().toISOString() : null }
            : item
        )
      )
      setUnread((current) => Math.max(0, current + (next ? -1 : 1)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ')
    }
  }

  const handleDelete = async (notification: AdminNotification) => {
    const ok = await confirm({
      title: 'ลบการแจ้งเตือนนี้?',
      body: 'การลบนี้ไม่สามารถย้อนกลับได้',
      confirmLabel: 'ลบ',
      variant: 'danger',
    })
    if (!ok) return
    setError('')
    try {
      const res = await apiFetch(`/api/admin/notifications/${notification.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { error?: { message?: string } })?.error?.message || 'ลบไม่สำเร็จ'
        )
      }
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id))
      if (!notification.is_read) {
        setUnread((current) => Math.max(0, current - 1))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ลบไม่สำเร็จ')
    }
  }

  // ---- Bulk: mark-all-read (everything in DB, ignoring filters) ----
  const handleMarkAllRead = async () => {
    if (unread === 0) return
    setBulkSaving(true)
    setError('')
    try {
      const res = await apiFetch('/api/admin/notifications', {
        method: 'POST',
        body: { action: 'mark_all_read' },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { error?: { message?: string } })?.error?.message || 'อัปเดตไม่สำเร็จ'
        )
      }
      const now = new Date().toISOString()
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true, read_at: item.read_at || now }))
      )
      setUnread(0)
      toast.success('ทำเครื่องหมายว่าอ่านแล้วทั้งหมด')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ')
    } finally {
      setBulkSaving(false)
    }
  }

  // ---- Bulk: targeted (selected ids) ---------------------------
  const runBulk = async (action: 'mark_read' | 'mark_unread' | 'delete') => {
    const ids = Array.from(selected)
    if (ids.length === 0) return

    if (action === 'delete') {
      const ok = await confirm({
        title: `ลบ ${ids.length} รายการ?`,
        body: 'การลบนี้ไม่สามารถย้อนกลับได้',
        confirmLabel: 'ลบทั้งหมด',
        variant: 'danger',
      })
      if (!ok) return
    }

    setBulkSaving(true)
    setError('')
    try {
      const res = await apiFetch('/api/admin/notifications', {
        method: 'POST',
        body: { action, ids },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { error?: { message?: string } })?.error?.message || 'ดำเนินการไม่สำเร็จ'
        )
      }

      if (action === 'delete') {
        const idSet = new Set(ids)
        const lostUnread = notifications.filter(
          (n) => idSet.has(n.id) && !n.is_read
        ).length
        setNotifications((prev) => prev.filter((item) => !idSet.has(item.id)))
        setUnread((c) => Math.max(0, c - lostUnread))
        toast.success(`ลบ ${ids.length} รายการแล้ว`)
      } else {
        const isRead = action === 'mark_read'
        const idSet = new Set(ids)
        const flips = notifications.filter(
          (n) => idSet.has(n.id) && n.is_read !== isRead
        ).length
        const now = new Date().toISOString()
        setNotifications((prev) =>
          prev.map((item) =>
            idSet.has(item.id)
              ? { ...item, is_read: isRead, read_at: isRead ? now : null }
              : item
          )
        )
        setUnread((c) => Math.max(0, c + (isRead ? -flips : flips)))
        toast.success(
          isRead ? `ทำเครื่องหมายว่าอ่านแล้ว ${ids.length} รายการ` : `ทำเครื่องหมายว่ายังไม่ได้อ่าน ${ids.length} รายการ`
        )
      }
      clearSelection()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ดำเนินการไม่สำเร็จ')
    } finally {
      setBulkSaving(false)
    }
  }

  // ---- Render ---------------------------------------------------
  return (
    <div className="space-y-5">
      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            ทั้งหมด
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{notifications.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-900">
            ยังไม่ได้อ่าน
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{unread}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              การดำเนินการ
            </p>
            <p className="text-sm text-slate-500">กำหนดทั้งหมดเป็นอ่านแล้ว</p>
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={bulkSaving || unread === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-40"
          >
            {bulkSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            ทำเครื่องหมายทั้งหมด
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-wrap items-center gap-3">
        {/* Status */}
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(['all', 'unread', 'read'] as StatusKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                status === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {key === 'all' && 'ทั้งหมด'}
              {key === 'unread' && 'ยังไม่ได้อ่าน'}
              {key === 'read' && 'อ่านแล้ว'}
            </button>
          ))}
        </div>

        {/* Type dropdown */}
        {knownTypes.length > 0 && (
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="all">ทุกประเภท</option>
            {knownTypes.map((t) => (
              <option key={t} value={t}>
                {labelForType(t)}
              </option>
            ))}
          </select>
        )}

        {/* Severity chips */}
        <div className="flex gap-1">
          {(['all', 'info', 'warning', 'error'] as SeverityKey[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverity(s)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                severity === s
                  ? s === 'all'
                    ? 'bg-slate-900 text-white'
                    : SEVERITY_STYLES[s as keyof typeof SEVERITY_STYLES]
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {s === 'all' && 'ทุกระดับ'}
              {s === 'info' && 'ข้อมูล'}
              {s === 'warning' && 'เตือน'}
              {s === 'error' && 'สำคัญ'}
            </button>
          ))}
        </div>

        <div className="ml-auto text-xs text-slate-500">
          {filtered.length} รายการ
        </div>
      </div>

      {/* Bulk-action toolbar — appears when something is selected */}
      {selected.size > 0 && (
        <div
          role="toolbar"
          aria-label="การดำเนินการกับรายการที่เลือก"
          className="rounded-xl border border-slate-200 bg-slate-100 p-3 flex flex-wrap items-center gap-2"
        >
          <span className="text-sm font-bold text-slate-900">
            เลือก {selected.size} รายการ
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAllVisible}
              className="text-xs font-semibold text-slate-900 hover:text-slate-700"
            >
              เลือกทั้งหมดในรายการ
            </button>
            <button
              type="button"
              onClick={() => runBulk('mark_read')}
              disabled={bulkSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-50"
            >
              <Check size={12} /> อ่านแล้ว
            </button>
            <button
              type="button"
              onClick={() => runBulk('mark_unread')}
              disabled={bulkSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-50"
            >
              <Circle size={12} /> ยังไม่ได้อ่าน
            </button>
            <button
              type="button"
              onClick={() => runBulk('delete')}
              disabled={bulkSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={12} /> ลบ
            </button>
            <button
              type="button"
              onClick={clearSelection}
              aria-label="ยกเลิกการเลือก"
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:bg-white hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Bell className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="text-sm font-semibold text-slate-600">
            {status !== 'all' || type !== 'all' || severity !== 'all'
              ? 'ไม่พบรายการที่ตรงกับตัวกรอง'
              : 'ยังไม่มีการแจ้งเตือน'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            กิจกรรมใหม่ ๆ ในระบบจะแสดงในหน้านี้
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((notification) => {
            const checked = selected.has(notification.id)
            return (
              <li
                key={notification.id}
                className={`rounded-xl border px-4 py-3 transition-colors ${
                  checked
                    ? 'border-slate-400 bg-slate-100 ring-1 ring-slate-200'
                    : notification.is_read
                      ? 'border-slate-200 bg-white'
                      : 'border-slate-200 bg-slate-100/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Bulk-select checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleOne(notification.id)}
                    aria-pressed={checked}
                    aria-label="เลือก"
                    className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-slate-900"
                  >
                    {checked ? (
                      <CheckSquare size={18} className="text-slate-900" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>

                  {/* Read dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    {notification.is_read ? (
                      <Circle size={8} className="text-slate-300" />
                    ) : (
                      <Circle size={8} className="fill-slate-700 text-slate-700" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          SEVERITY_STYLES[notification.severity] || SEVERITY_STYLES.info
                        }`}
                      >
                        {labelForType(notification.type)}
                      </span>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(notification.created_at)}
                      </p>
                    </div>
                    <h3 className="mt-1 text-sm font-bold text-slate-900">
                      {notification.title}
                    </h3>
                    {notification.body && (
                      <p className="mt-1 text-sm text-slate-600 whitespace-pre-line">
                        {notification.body}
                      </p>
                    )}
                    {notification.link && (
                      <Link
                        href={notification.link}
                        className="mt-2 inline-block text-xs font-semibold text-slate-900 hover:text-slate-700"
                      >
                        ดูรายละเอียด →
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleRead(notification)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400"
                    >
                      {notification.is_read ? (
                        <span className="inline-flex items-center gap-1">
                          <Circle size={12} />
                          ยังไม่ได้อ่าน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Check size={12} />
                          อ่านแล้ว
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(notification)}
                      className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      aria-label="ลบ"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
