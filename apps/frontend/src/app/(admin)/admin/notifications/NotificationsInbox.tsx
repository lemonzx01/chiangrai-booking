'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCheck, Trash2, Circle, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { AdminNotification } from './page'

interface Props {
  initial: {
    notifications: AdminNotification[]
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
    summary: { unread: number }
  }
}

type FilterKey = 'all' | 'unread' | 'read'

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
  'review.submitted': 'รีวิวใหม่',
  'payment.failed': 'ชำระเงินไม่สำเร็จ',
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

export default function NotificationsInbox({ initial }: Props) {
  const [notifications, setNotifications] = useState<AdminNotification[]>(initial.notifications)
  const [unread, setUnread] = useState(initial.summary.unread)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [bulkSaving, setBulkSaving] = useState(false)
  const [error, setError] = useState('')

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.is_read)
    if (filter === 'read') return notifications.filter((n) => n.is_read)
    return notifications
  }, [notifications, filter])

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
        throw new Error((data as any)?.error?.message || 'อัปเดตไม่สำเร็จ')
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
    if (!confirm('ลบการแจ้งเตือนนี้?')) return
    setError('')
    try {
      const res = await apiFetch(`/api/admin/notifications/${notification.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as any)?.error?.message || 'ลบไม่สำเร็จ')
      }
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id))
      if (!notification.is_read) {
        setUnread((current) => Math.max(0, current - 1))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ลบไม่สำเร็จ')
    }
  }

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
        throw new Error((data as any)?.error?.message || 'อัปเดตไม่สำเร็จ')
      }
      const now = new Date().toISOString()
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true, read_at: item.read_at || now })))
      setUnread(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ')
    } finally {
      setBulkSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Summary + filter tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ทั้งหมด</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{notifications.length}</p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">ยังไม่ได้อ่าน</p>
          <p className="mt-1 text-2xl font-black text-indigo-900">{unread}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">การดำเนินการ</p>
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

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'unread', 'read'] as FilterKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400'
            }`}
          >
            {key === 'all' && 'ทั้งหมด'}
            {key === 'unread' && 'ยังไม่ได้อ่าน'}
            {key === 'read' && 'อ่านแล้ว'}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Bell className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="text-sm font-semibold text-slate-600">ยังไม่มีการแจ้งเตือน</p>
          <p className="mt-1 text-xs text-slate-400">
            กิจกรรมใหม่ ๆ ในระบบจะแสดงในหน้านี้
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((notification) => (
            <li
              key={notification.id}
              className={`rounded-xl border px-4 py-3 transition-colors ${
                notification.is_read ? 'border-slate-200 bg-white' : 'border-indigo-200 bg-indigo-50/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0">
                  {notification.is_read ? (
                    <Circle size={10} className="text-slate-300" />
                  ) : (
                    <Circle size={10} className="fill-indigo-500 text-indigo-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                        SEVERITY_STYLES[notification.severity] || SEVERITY_STYLES.info
                      }`}
                    >
                      {TYPE_LABELS[notification.type] || notification.type}
                    </span>
                    <p className="text-xs text-slate-400">{formatDateTime(notification.created_at)}</p>
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-slate-900">{notification.title}</h3>
                  {notification.body && (
                    <p className="mt-1 text-sm text-slate-600 whitespace-pre-line">{notification.body}</p>
                  )}
                  {notification.link && (
                    <Link
                      href={notification.link}
                      className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-800"
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
          ))}
        </ul>
      )}
    </div>
  )
}
