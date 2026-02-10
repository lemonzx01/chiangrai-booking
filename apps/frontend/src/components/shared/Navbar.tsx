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
import { usePathname } from 'next/navigation'
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

  /** ตั้ง mounted เป็น true */
  useEffect(() => {
    setMounted(true)
  }, [])

  /** ตรวจสอบ auth เมื่อ mount (login/logout ใช้ full page reload ทำให้ re-mount เสมอ) */
  useEffect(() => {
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
    // Reset body scroll lock
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    
    setIsOpen(false)
  }, [pathname])

  /** Lock body scroll when mobile menu is open */
  useEffect(() => {
    const isMobileView = window.innerWidth < 1024
    
    if (isOpen && isMobileView) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      return () => {
        const scrollY = document.body.style.top
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1)
        }
      }
    } else {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ----------------------------------------------------------
  // Auth Functions
  // ----------------------------------------------------------

  /**
   * ตรวจสอบสถานะ authentication
   * เรียก API เพื่อดึงข้อมูลผู้ใช้ (เฉพาะตอน mount)
   * Login/Logout ใช้ window.location.href ทำให้ mount ใหม่เสมอ
   */
  const checkAuth = async () => {
    // ถ้าไม่มี logged_in cookie → ไม่ต้องเรียก API (ป้องกัน 401 ใน console)
    const hasLoggedInCookie = document.cookie.split(';').some(c => c.trim().startsWith('logged_in='))
    if (!hasLoggedInCookie) {
      setUser(null)
      return
    }

    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        // Token หมดอายุ → ลบ cookie
        document.cookie = 'logged_in=; path=/; max-age=0'
        setUser(null)
      }
    } catch {
      setUser(null)
    }
  }

  /**
   * ล็อกเอาท์ผู้ใช้
   * ใช้ window.location.href เพื่อ full page reload (ล้าง state ทุกหน้า)
   */
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore - ยังคง redirect ออก
    }
    document.cookie = 'logged_in=; path=/; max-age=0'
    window.location.href = '/'
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
            : 'bg-transparent py-4 sm:py-5 md:py-8'
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
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(!isOpen)
              }}
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
        {isOpen && (
          <div
            className="lg:hidden fixed top-0 left-0 right-0 bottom-0 bg-white z-[60] flex flex-col"
            style={{ height: '100vh', width: '100vw' }}
          >
            {/* Header with back button - Fixed */}
            <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
              }}
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors -ml-1"
            >
              <X size={20} />
              <span className="text-sm font-semibold">{mounted ? t('common.back') : 'กลับ'}</span>
            </button>
            <h2 className="text-base font-bold text-slate-900">{mounted ? (t('navbar.menu') || 'เมนู') : 'เมนู'}</h2>
            <div className="w-16"></div>
          </div>

          {/* Scrollable content */}
          <div 
            className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-1"
            style={{ 
              minHeight: 0,
              height: 'calc(100vh - 64px)',
              flex: '1 1 auto'
            }}
          >
            {/* ลิงก์เมนู Mobile */}
            {NAVIGATION.map((item) => (
              <Link
                key={item.key}
                href={item.path}
                className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors min-h-[44px] py-3 px-2 rounded-lg hover:bg-slate-50 flex items-center"
              >
                {getLabel(item.key)}
              </Link>
            ))}

            {/* Divider */}
            <div className="h-px bg-slate-200 my-2"></div>

            {/* ปุ่มสลับภาษา Mobile */}
            <div className="px-2 py-2">
              <LanguageSwitcher light={true} />
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200 my-2"></div>

            {/* ปุ่มจองแพ็คเกจ */}
            <Link
              href="/hotels"
              className="mx-2 mt-2 bg-indigo-600 text-white min-h-[44px] py-3 rounded-lg font-bold text-base text-center shadow-md active:scale-95 transition-all flex items-center justify-center"
            >
              {getLabel('bookPackage')}
            </Link>

            {/* เมนูผู้ใช้ Mobile */}
            <div className="mt-2 pt-2 border-t border-slate-200">
              {user ? (
                <div className="space-y-2 px-2">
                  {/* ข้อมูลผู้ใช้ */}
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  {/* ลิงก์โปรไฟล์ */}
                  <Link
                    href="/profile"
                    className="block text-center min-h-[44px] py-2.5 bg-slate-100 rounded-lg font-semibold text-sm text-slate-700 flex items-center justify-center"
                  >
                    {mounted ? t('navbar.profile') : 'โปรไฟล์'}
                  </Link>
                  {/* ปุ่มล็อกเอาท์ */}
                  <button
                    onClick={handleLogout}
                    className="w-full min-h-[44px] py-2.5 bg-red-50 text-red-600 rounded-lg font-semibold text-sm flex items-center justify-center"
                  >
                    {mounted ? t('navbar.logout') : 'ออกจากระบบ'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 px-2">
                  {/* ปุ่มล็อกอิน */}
                  <Link
                    href="/login"
                    className="block text-center min-h-[44px] py-2.5 bg-slate-100 rounded-lg font-semibold text-sm text-slate-700 flex items-center justify-center"
                  >
                    {mounted ? t('navbar.login') : 'เข้าสู่ระบบ'}
                  </Link>
                  {/* ปุ่มสมัครสมาชิก */}
                  <Link
                    href="/register"
                    className="block text-center min-h-[44px] py-2.5 bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-sm flex items-center justify-center"
                  >
                    {mounted ? t('navbar.register') : 'สมัครสมาชิก'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </nav>
    </>
  )
}
