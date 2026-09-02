/**
 * ============================================================
 * Admin Sidebar - เมนูด้านข้างสำหรับ Admin (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดง navigation menu สำหรับ admin
 *   - รองรับ responsive (Desktop sidebar + Mobile drawer)
 *   - จัดการ logout
 *
 * การใช้งาน:
 *   <AdminSidebar />
 *
 * Features:
 *   - Desktop: Fixed sidebar ด้านซ้าย
 *   - Mobile: Drawer แบบ slide-in
 *   - Active state highlight
 *   - Logout confirmation
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks สำหรับจัดการ state */
import { useState, useEffect, useCallback } from 'react'

/** Next.js Link component */
import Link from 'next/link'

/** Next.js hooks สำหรับ navigation */
import { usePathname, useRouter } from 'next/navigation'

/** Lucide icons สำหรับ UI */
import { Compass, LayoutDashboard, Building2, Car, Calendar, LogOut, Menu, X, Users, CreditCard, Tag, MessageSquare, Bell, Send, Gift, Award } from 'lucide-react'
import { apiFetch } from '@/lib/api'

// ============================================================
// Constants - Navigation Menu
// ============================================================

/**
 * รายการ navigation menu
 * แต่ละ item มี: name, href, icon
 */
const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'โรงแรม/แพ็คเกจ', href: '/admin/hotels', icon: Building2 },
  { name: 'รถเช่า', href: '/admin/cars', icon: Car },
  { name: 'การจอง', href: '/admin/bookings', icon: Calendar },
  { name: 'การชำระเงิน', href: '/admin/payments', icon: CreditCard },
  { name: 'คูปอง', href: '/admin/coupons', icon: Tag },
  { name: 'แนะนำเพื่อน', href: '/admin/referrals', icon: Gift },
  { name: 'แต้มสะสม', href: '/admin/loyalty', icon: Award },
  { name: 'รีวิว', href: '/admin/reviews', icon: MessageSquare },
  { name: 'การแจ้งเตือน', href: '/admin/notifications', icon: Bell },
  { name: 'แคมเปญอีเมล', href: '/admin/campaigns', icon: Send },
  { name: 'พาร์ทเนอร์', href: '/admin/partners', icon: Users },
]

// ============================================================
// Main Component
// ============================================================

/**
 * Admin Sidebar Component
 *
 * @description
 *   Sidebar navigation สำหรับ admin panel
 *   รองรับทั้ง desktop และ mobile views
 *
 * @returns {JSX.Element} Admin sidebar UI
 */
export default function AdminSidebar() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับดึง current pathname */
  const pathname = usePathname()

  /** Hook สำหรับ navigation */
  const router = useRouter()

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** State สำหรับ mobile drawer */
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  /** Unread notification count — แสดง badge บน /admin/notifications */
  const [unreadCount, setUnreadCount] = useState<number>(0)

  // ----------------------------------------------------------
  // Unread notification polling
  // ----------------------------------------------------------
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/notifications?status=unread&limit=1', {
        credentials: 'include',
      })
      if (!res.ok) return
      const body = await res.json().catch(() => null)
      const unread = body?.data?.summary?.unread
      if (typeof unread === 'number') setUnreadCount(unread)
    } catch {
      // ignore network errors — badge just stays stale
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    // Refresh every 60 seconds — cheap enough, keeps badge fresh
    const interval = setInterval(fetchUnreadCount, 60_000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Also refresh when path changes (e.g. admin just visited inbox)
  useEffect(() => {
    fetchUnreadCount()
  }, [pathname, fetchUnreadCount])

  // ----------------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------------
  /**
   * จัดการ logout
   *
   * ขั้นตอน:
   * 1. Confirm กับผู้ใช้
   * 2. เรียก API DELETE /api/admin/auth
   * 3. Redirect ไปหน้าแรก
   */
  const handleLogout = async () => {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      await apiFetch('/api/admin/auth', { method: 'DELETE' })
      router.push('/')
      router.refresh()
    }
  }

  // ----------------------------------------------------------
  // Sidebar Content (Reusable)
  // ----------------------------------------------------------
  /**
   * Component สำหรับ content ภายใน sidebar
   * ใช้ทั้ง desktop และ mobile
   */
  const SidebarContent = () => (
    <>
      {/* ============================================================
          Logo และ Brand Name
          ============================================================ */}
      <div className="p-6 border-b border-white/10">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3"
          onClick={() => setIsMobileOpen(false)}
        >
          {/* Logo Icon */}
          <div className="p-2 bg-slate-900 rounded-xl">
            <Compass size={24} />
          </div>
          {/* Brand Name */}
          <span className="text-xl font-bold">Got Journey Thailand</span>
        </Link>
      </div>

      {/* ============================================================
          Navigation Menu
          ============================================================ */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            // ตรวจสอบว่า menu item นี้ active หรือไม่
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            const showBadge = item.href === '/admin/notifications' && unreadCount > 0

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {/* Menu Icon */}
                  <item.icon size={20} />
                  {/* Menu Name */}
                  <span className="font-medium flex-1">{item.name}</span>
                  {/* Unread notification badge */}
                  {showBadge && (
                    <span
                      className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-semibold rounded-full bg-red-500 text-white"
                      aria-label={`${unreadCount} การแจ้งเตือนที่ยังไม่ได้อ่าน`}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ============================================================
          Logout Button
          ============================================================ */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-colors w-full"
        >
          <LogOut size={20} />
          <span className="font-medium">ออกจากระบบ</span>
        </button>
      </div>
    </>
  )

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <>
      {/* ============================================================
          Mobile Menu Button - ปุ่มเปิด/ปิด drawer (แสดงเฉพาะ mobile)
          ============================================================ */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* ============================================================
          Mobile Overlay - พื้นหลังสีดำเมื่อเปิด drawer
          ============================================================ */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ============================================================
          Desktop Sidebar - แสดงเฉพาะ desktop (lg+)
          ============================================================ */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 flex-col">
        <SidebarContent />
      </aside>

      {/* ============================================================
          Mobile Sidebar Drawer - แสดงเมื่อกดปุ่ม menu
          ============================================================ */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-slate-900 text-white z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
