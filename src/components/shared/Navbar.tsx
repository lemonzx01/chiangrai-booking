/**
 * ============================================================
 * Navbar Component - แถบนำทางหลัก
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แถบนำทางหลักของเว็บไซต์
 *   - รองรับ responsive (desktop และ mobile)
 *   - เปลี่ยนสีตามการ scroll และหน้าปัจจุบัน
 *
 * คุณสมบัติ:
 *   - เมนูนำทางหลัก (หน้าแรก, แพ็คเกจ, รถเช่า, ติดต่อ)
 *   - ปุ่มสลับภาษา
 *   - เมนูผู้ใช้ (ล็อกอิน/โปรไฟล์/ล็อกเอาท์)
 *   - เมนู mobile แบบ fullscreen
 *   - ไม่แสดงในหน้า Admin
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Compass, User, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

// ============================================================
// Constants (ค่าคงที่)
// ============================================================

/**
 * รายการเมนูนำทาง
 * - key: ใช้สำหรับ i18n translation
 * - path: URL path
 */
const NAVIGATION = [
  { key: 'home', path: '/' },
  { key: 'packages', path: '/hotels' },
  { key: 'cars', path: '/cars' },
  { key: 'contact', path: '/contact' },
]

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * ข้อมูลผู้ใช้ที่ล็อกอิน
 */
interface UserData {
  /** รหัสผู้ใช้ */
  id: string
  /** อีเมล */
  email: string
  /** ชื่อ */
  name: string
}

// ============================================================
// Component Definition
// ============================================================

/**
 * Navbar component
 *
 * @description แถบนำทางหลักที่อยู่ด้านบนสุดของหน้า
 *              เปลี่ยนสีเมื่อ scroll และรองรับ mobile menu
 *              ไม่แสดงในหน้า Admin
 *
 * @returns Navbar element หรือ null (ถ้าเป็นหน้า Admin)
 */
export default function Navbar() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------

  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  /** สถานะเปิด/ปิดเมนู mobile */
  const [isOpen, setIsOpen] = useState(false)

  /** สถานะ scroll แล้วหรือยัง */
  const [scrolled, setScrolled] = useState(false)

  /** ตรวจสอบว่า component mount แล้ว (ป้องกัน hydration mismatch) */
  const [mounted, setMounted] = useState(false)

  /** ข้อมูลผู้ใช้ที่ล็อกอิน */
  const [user, setUser] = useState<UserData | null>(null)

  /** สถานะเปิด/ปิดเมนูผู้ใช้ */
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // ----------------------------------------------------------
  // Computed Values
  // ----------------------------------------------------------

  /** ตรวจสอบว่าเป็นหน้า Admin หรือไม่ */
  const isAdmin = pathname?.startsWith('/admin')

  /** ตรวจสอบว่าเป็นหน้าแรกหรือไม่ */
  const isHome = pathname === '/'

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------

  /** ตั้ง mounted เป็น true และตรวจสอบ auth เมื่อ component mount */
  useEffect(() => {
    setMounted(true)
    checkAuth()
  }, [])

  /** ติดตาม scroll event */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    handleScroll() // ตรวจสอบตำแหน่ง scroll ปัจจุบัน
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /** ปิดเมนู mobile เมื่อเปลี่ยนหน้า */
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // ----------------------------------------------------------
  // Auth Functions
  // ----------------------------------------------------------

  /**
   * ตรวจสอบสถานะ authentication
   * เรียก API เพื่อดึงข้อมูลผู้ใช้
   */
  const checkAuth = async () => {
    // ตรวจสอบว่ามี user_token cookie หรือไม่
    const hasToken = document.cookie.includes('user_token')
    if (!hasToken) return

    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch {
      // ไม่ได้ล็อกอิน
    }
  }

  /**
   * ล็อกเอาท์ผู้ใช้
   */
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setUserMenuOpen(false)
      router.refresh()
    } catch {
      // เกิดข้อผิดพลาด
    }
  }

  // ----------------------------------------------------------
  // Conditional Rendering
  // ----------------------------------------------------------

  /**
   * ไม่แสดง Navbar ในหน้า Admin
   */
  if (isAdmin) return null

  // ----------------------------------------------------------
  // Computed Styles
  // ----------------------------------------------------------

  /** ใช้โหมดสีอ่อนเมื่อ scroll แล้ว หรือไม่ใช่หน้าแรก */
  const activeLightMode = scrolled || !isHome

  // ----------------------------------------------------------
  // Translation Helpers
  // ----------------------------------------------------------

  /**
   * Default labels ภาษาไทยสำหรับ SSR
   * ป้องกัน hydration mismatch
   */
  const defaultLabels: Record<string, string> = {
    home: 'หน้าแรก',
    packages: 'แพ็คเกจ',
    cars: 'รถเช่า',
    contact: 'ติดต่อ',
    bookNow: 'จองเลย',
    bookPackage: 'จองแพ็คเกจ',
  }

  /**
   * ดึง label ตาม key
   * ใช้ default label ก่อน mount เพื่อป้องกัน hydration mismatch
   */
  const getLabel = (key: string) => {
    if (!mounted) return defaultLabels[key] || key
    return t(`navbar.${key}`)
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <>
      {/* Navbar หลัก */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          activeLightMode
            ? 'bg-white/95 backdrop-blur-md shadow-sm py-3'
            : 'bg-transparent py-5 md:py-8'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center">
            {/* โลโก้ */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div
                className={`p-2 rounded-xl transition-all duration-300 ${
                  activeLightMode
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'bg-white/10 text-white backdrop-blur-lg border border-white/20'
                }`}
              >
                <Compass size={20} strokeWidth={2.5} />
              </div>
              <span
                className={`text-xl font-extrabold tracking-tight transition-all duration-300 ${
                  activeLightMode ? 'text-slate-900' : 'text-white'
                }`}
              >
                Got Journey
                <span className={activeLightMode ? 'text-indigo-600' : 'text-indigo-400'}>
                  {' '}Thailand
                </span>
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              {/* ลิงก์เมนู */}
              {NAVIGATION.map((item) => (
                <Link
                  key={item.key}
                  href={item.path}
                  className={`px-3 xl:px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                    pathname === item.path
                      ? activeLightMode
                        ? 'text-indigo-600 bg-indigo-50/80'
                        : 'text-white bg-white/20'
                      : activeLightMode
                      ? 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {getLabel(item.key)}
                </Link>
              ))}

              {/* ตัวคั่น */}
              <div
                className={`w-px h-5 mx-1 xl:mx-2 ${
                  activeLightMode ? 'bg-slate-200' : 'bg-white/20'
                }`}
              ></div>

              {/* ปุ่มสลับภาษา */}
              <LanguageSwitcher light={activeLightMode} />

              {/* เมนูผู้ใช้ */}
              {user ? (
                <div className="relative ml-2">
                  {/* ปุ่มเปิดเมนูผู้ใช้ */}
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                      activeLightMode
                        ? 'text-slate-600 hover:bg-slate-100'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <User size={18} />
                    <span className="hidden xl:inline max-w-[100px] truncate">{user.name}</span>
                  </button>

                  {/* Dropdown เมนูผู้ใช้ */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                      {/* ลิงก์โปรไฟล์ */}
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={16} />
                        {mounted ? t('navbar.profile') : 'โปรไฟล์'}
                      </Link>
                      {/* ปุ่มล็อกเอาท์ */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        {mounted ? t('navbar.logout') : 'ออกจากระบบ'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ปุ่มล็อกอิน */
                <Link
                  href="/login"
                  className={`ml-2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeLightMode
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <User size={18} />
                  <span className="hidden xl:inline">{mounted ? t('navbar.login') : 'เข้าสู่ระบบ'}</span>
                </Link>
              )}
            </div>

            {/* ปุ่มเปิด/ปิดเมนู Mobile */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-xl transition-colors"
            >
              {isOpen ? (
                <X size={24} className={activeLightMode ? 'text-slate-900' : 'text-white'} />
              ) : (
                <Menu size={24} className={activeLightMode ? 'text-slate-900' : 'text-white'} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={`lg:hidden fixed inset-0 bg-white z-40 transition-transform duration-500 ease-in-out ${
            isOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="pt-24 px-8 flex flex-col gap-8">
            {/* ลิงก์เมนู Mobile */}
            {NAVIGATION.map((item) => (
              <Link
                key={item.key}
                href={item.path}
                className="text-3xl font-black text-slate-900 hover:text-indigo-600 transition-colors"
              >
                {getLabel(item.key)}
              </Link>
            ))}

            {/* ปุ่มสลับภาษา Mobile */}
            <div className="mt-4 flex justify-center">
              <LanguageSwitcher light={true} />
            </div>

            {/* ปุ่มจองแพ็คเกจ */}
            <Link
              href="/hotels"
              className="mt-4 bg-indigo-600 text-white py-6 rounded-3xl font-black text-xl text-center shadow-xl active:scale-95 transition-all"
            >
              {getLabel('bookPackage')}
            </Link>

            {/* เมนูผู้ใช้ Mobile */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              {user ? (
                <div className="space-y-4">
                  {/* ข้อมูลผู้ใช้ */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User size={24} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  {/* ลิงก์โปรไฟล์ */}
                  <Link
                    href="/profile"
                    className="block text-center py-3 bg-slate-100 rounded-xl font-bold text-slate-700"
                  >
                    {mounted ? t('navbar.profile') : 'โปรไฟล์'}
                  </Link>
                  {/* ปุ่มล็อกเอาท์ */}
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold"
                  >
                    {mounted ? t('navbar.logout') : 'ออกจากระบบ'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* ปุ่มล็อกอิน */}
                  <Link
                    href="/login"
                    className="block text-center py-4 bg-slate-100 rounded-xl font-bold text-slate-700"
                  >
                    {mounted ? t('navbar.login') : 'เข้าสู่ระบบ'}
                  </Link>
                  {/* ปุ่มสมัครสมาชิก */}
                  <Link
                    href="/register"
                    className="block text-center py-4 bg-indigo-100 text-indigo-700 rounded-xl font-bold"
                  >
                    {mounted ? t('navbar.register') : 'สมัครสมาชิก'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
