/**
 * ============================================================
 * Partner Sidebar - เมนูด้านข้างสำหรับ Partner (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดง navigation menu สำหรับ partner
 *   - รองรับ responsive (Desktop sidebar + Mobile drawer)
 *   - จัดการ logout
 *
 * การใช้งาน:
 *   <PartnerSidebar />
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
import { useState } from 'react'

/** Next.js Link component */
import Link from 'next/link'

/** Next.js hooks สำหรับ navigation */
import { usePathname, useRouter } from 'next/navigation'

/** Lucide icons สำหรับ UI */
import { Compass, LayoutDashboard, Car, Calendar, LogOut, Menu, X } from 'lucide-react'

// ============================================================
// Constants - Navigation Menu
// ============================================================

/**
 * รายการ navigation menu สำหรับ Partner
 * แต่ละ item มี: name, href, icon
 */
const navigation = [
  { name: 'Dashboard', href: '/partner/dashboard', icon: LayoutDashboard },
  { name: 'รถเช่า', href: '/partner/cars', icon: Car },
  { name: 'การจอง', href: '/partner/bookings', icon: Calendar },
]

// ============================================================
// Main Component
// ============================================================

/**
 * Partner Sidebar Component
 *
 * @description
 *   Sidebar navigation สำหรับ partner panel
 *   รองรับทั้ง desktop และ mobile views
 *
 * @returns {JSX.Element} Partner sidebar UI
 */
export default function PartnerSidebar() {
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

  // ----------------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------------
  /**
   * จัดการ logout
   *
   * ขั้นตอน:
   * 1. Confirm กับผู้ใช้
   * 2. เรียก API DELETE /api/auth/logout
   * 3. Redirect ไปหน้าแรก
   */
  const handleLogout = async () => {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      await fetch('/api/auth/logout', { method: 'POST' })
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
          href="/partner/dashboard"
          className="flex items-center gap-3"
          onClick={() => setIsMobileOpen(false)}
        >
          {/* Logo Icon */}
          <div className="p-2 bg-indigo-600 rounded-xl">
            <Compass size={24} />
          </div>
          {/* Brand Name */}
          <span className="text-xl font-bold">Partner Dashboard</span>
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

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {/* Menu Icon */}
                  <item.icon size={20} />
                  {/* Menu Name */}
                  <span className="font-medium">{item.name}</span>
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
