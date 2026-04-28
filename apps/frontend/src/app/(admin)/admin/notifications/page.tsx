/**
 * ============================================================
 * Admin Notifications Page (Server Component)
 * ============================================================
 */

import AdminSidebar from '@/components/admin/Sidebar'
import { adminBackendJson } from '@/lib/admin-fetch'
import NotificationsInbox from './NotificationsInbox'

export const metadata = { title: 'การแจ้งเตือน | Admin' }
export const dynamic = 'force-dynamic'

export interface AdminNotification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  data: Record<string, unknown> | null
  severity: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  read_at: string | null
  created_at: string
}

interface NotificationsResponse {
  notifications: AdminNotification[]
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  summary: { unread: number; types?: string[] }
}

async function getInitialNotifications(): Promise<NotificationsResponse> {
  try {
    return await adminBackendJson<NotificationsResponse>(
      '/api/admin/notifications?status=all&limit=100'
    )
  } catch {
    return {
      notifications: [],
      pagination: { total: 0, limit: 100, offset: 0, hasMore: false },
      summary: { unread: 0, types: [] },
    }
  }
}

export default async function AdminNotificationsPage() {
  const initial = await getInitialNotifications()

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">การแจ้งเตือน</h1>
          <p className="text-sm text-slate-500 mt-1">
            เหตุการณ์ล่าสุดในระบบ เช่น การจองใหม่ การยกเลิก และรีวิวที่รอตรวจสอบ
          </p>
        </div>

        <NotificationsInbox initial={initial} />
      </main>
    </div>
  )
}
