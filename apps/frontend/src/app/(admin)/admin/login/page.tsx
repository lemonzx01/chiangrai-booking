/**
 * ============================================================
 * Admin Login Page - หน้าเข้าสู่ระบบ Admin (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงฟอร์มเข้าสู่ระบบสำหรับ Admin
 *   - ตรวจสอบ authentication และ redirect
 *   - รองรับ "จดจำอีเมล" ผ่าน localStorage
 *
 * Route:
 *   - /admin/login - หน้า login สำหรับ admin
 *
 * Features:
 *   - ตรวจสอบ auth ก่อน (ถ้า login แล้ว redirect ไป dashboard)
 *   - Form login (อีเมล, รหัสผ่าน)
 *   - Checkbox จดจำอีเมล
 *   - Error handling และ loading state
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks สำหรับจัดการ state และ lifecycle */
import { useState, useEffect } from 'react'

/** Next.js hooks สำหรับ navigation */
import { useRouter } from 'next/navigation'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Lucide icon สำหรับ logo */
import { Compass } from 'lucide-react'

/** UI Components */
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ============================================================
// Main Component
// ============================================================

/**
 * หน้า Login สำหรับ Admin
 *
 * @description
 *   แสดงฟอร์ม login พร้อมตรวจสอบ auth ก่อน
 *   ถ้า login แล้วจะ redirect ไป dashboard
 *
 * @returns {JSX.Element} Admin login page UI
 */
export default function AdminLoginPage() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { t } = useTranslation()

  /** Hook สำหรับ navigation */
  const router = useRouter()

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** State สำหรับอีเมล */
  const [email, setEmail] = useState('')

  /** State สำหรับรหัสผ่าน */
  const [password, setPassword] = useState('')

  /** State สำหรับข้อความ error */
  const [error, setError] = useState('')

  /** State สำหรับสถานะการโหลด */
  const [loading, setLoading] = useState(false)

  /** State สำหรับ checkbox จดจำอีเมล */
  const [rememberMe, setRememberMe] = useState(false)

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------
  /**
   * Effect: ตรวจสอบว่า login แล้วหรือยัง
   *
   * ถ้า login แล้ว -> redirect ไป /admin/dashboard
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/auth')
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            router.push('/admin/dashboard')
          }
        }
      } catch {
        // ยังไม่ได้ login, ดำเนินการต่อ
      }
    }
    checkAuth()
  }, [router])

  /**
   * Effect: โหลดอีเมลที่บันทึกไว้จาก localStorage
   *
   * ถ้ามีอีเมลที่บันทึกไว้ -> กรอกให้อัตโนมัติ
   */
  useEffect(() => {
    const savedEmail = localStorage.getItem('admin_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  // ----------------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------------
  /**
   * จัดการการ submit ฟอร์ม login
   *
   * ขั้นตอน:
   * 1. ส่งข้อมูลไป API /api/admin/login
   * 2. ถ้าสำเร็จ -> บันทึกอีเมล (ถ้าเลือก remember me)
   * 3. Redirect ไป /admin/dashboard
   *
   * @param {React.FormEvent} e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // ----------------------------------------------------------
      // เรียก API เพื่อ login
      // ----------------------------------------------------------
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      // Handle error response
      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // ----------------------------------------------------------
      // จัดการ "จดจำอีเมล"
      // ----------------------------------------------------------
      if (rememberMe) {
        localStorage.setItem('admin_email', email)
      } else {
        localStorage.removeItem('admin_email')
      }

      // Reset loading ก่อน redirect
      setLoading(false)

      // ----------------------------------------------------------
      // Redirect ไป Dashboard
      // ----------------------------------------------------------
      // ใช้ window.location เพื่อ full page reload
      window.location.href = '/admin/dashboard'
    } catch (err: any) {
      setError(err.message || t('admin.login.error') || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง')
      setLoading(false)
    }
  }

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md">
        {/* ============================================================
            Logo และ Brand Name
            ============================================================ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            {/* Logo Icon */}
            <div className="p-3 bg-indigo-600 rounded-xl">
              <Compass size={28} className="text-white" />
            </div>
            {/* Brand Name */}
            <span className="text-3xl font-black text-white">Got Journey Thailand</span>
          </div>
          <p className="text-slate-400">Admin Dashboard</p>
        </div>

        {/* ============================================================
            Login Form Card
            ============================================================ */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            {t('admin.login.title')}
          </h1>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* อีเมล Input */}
            <Input
              type="email"
              label={t('admin.login.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />

            {/* รหัสผ่าน Input */}
            <Input
              type="password"
              label={t('admin.login.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {/* Checkbox จดจำอีเมล */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  จดจำอีเมล
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm text-center font-medium">{error}</p>
              </div>
            )}

            {/* ปุ่มเข้าสู่ระบบ */}
            <Button type="submit" className="w-full" loading={loading} disabled={loading}>
              {t('admin.login.submit') || 'เข้าสู่ระบบ'}
            </Button>
          </form>
        </div>

        {/* ============================================================
            Footer - Copyright
            ============================================================ */}
        <p className="text-center text-slate-500 text-sm mt-6">
          © 2024 Got Journey Thailand. All rights reserved.
        </p>
      </div>
    </div>
  )
}
