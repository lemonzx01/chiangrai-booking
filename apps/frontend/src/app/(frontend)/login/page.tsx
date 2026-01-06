/**
 * ============================================================
 * Login Page - หน้าเข้าสู่ระบบ (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงฟอร์มเข้าสู่ระบบ
 *   - รองรับทั้ง User และ Admin login
 *   - แสดงข้อความเมื่อสมัครสมาชิกสำเร็จ
 *
 * Route:
 *   - /login - หน้าเข้าสู่ระบบ
 *   - /login?registered=true - เมื่อมาจากหน้าสมัครสมาชิก
 *   - /login?redirect=/xxx - เมื่อต้องการ redirect กลับ
 *
 * Features:
 *   - Form login (อีเมล, รหัสผ่าน)
 *   - Loading state ระหว่างส่ง
 *   - Error handling
 *   - Success message จากการสมัคร
 *   - Redirect ตาม role (Admin -> Dashboard, User -> Profile)
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks */
import { Suspense, useState, useEffect } from 'react'

/** Next.js hooks */
import { useRouter, useSearchParams } from 'next/navigation'

/** Next.js Link component */
import Link from 'next/link'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Lucide icons สำหรับ UI */
import { LogIn, Loader2, CheckCircle } from 'lucide-react'

/** UI Components */
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ============================================================
// Login Content Component
// ============================================================

/**
 * Login Content - เนื้อหาหลักของหน้า Login
 *
 * @description
 *   Component ที่แสดงฟอร์ม login และจัดการ authentication
 *   แยกออกมาเพื่อใช้กับ Suspense (useSearchParams ต้องอยู่ใน Suspense)
 *
 * @returns {JSX.Element} Login form UI
 */
function LoginContent() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { i18n } = useTranslation()

  /** Hook สำหรับ navigation */
  const router = useRouter()

  /** Hook สำหรับดึง URL query params */
  const searchParams = useSearchParams()

  /** ภาษาปัจจุบัน */
  const lang = i18n.language

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** State สำหรับข้อมูลฟอร์ม */
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  /** State สำหรับสถานะการโหลด */
  const [loading, setLoading] = useState(false)

  /** State สำหรับข้อความ error */
  const [error, setError] = useState('')

  /** State สำหรับแสดงข้อความสมัครสำเร็จ */
  const [showRegistered, setShowRegistered] = useState(false)

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------
  /**
   * Effect: ตรวจสอบว่ามาจากหน้าสมัครสมาชิก
   */
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowRegistered(true)
    }
  }, [searchParams])

  // ----------------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------------
  /**
   * จัดการการ submit ฟอร์ม login
   *
   * ขั้นตอน:
   * 1. ส่งข้อมูลไป API
   * 2. ตรวจสอบ response
   * 3. Redirect ตาม role:
   *    - Admin -> /admin/dashboard
   *    - User -> /profile หรือ redirect param
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // ส่งข้อมูลไป API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      // Handle error response
      if (!res.ok) {
        let errorMessage = lang === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // ถ้า response ไม่ใช่ JSON ใช้ status text
          errorMessage = res.statusText || errorMessage
        }
        setError(errorMessage)
        setLoading(false)
        return
      }

      const data = await res.json()

      // ----------------------------------------------------------
      // Redirect ตาม Role
      // ----------------------------------------------------------
      if (data.user?.role === 'admin') {
        // Admin ไป Dashboard (ใช้ window.location เพื่อ full refresh)
        window.location.href = '/admin/dashboard'
      } else {
        // User ไป Profile หรือ redirect URL
        const redirect = searchParams.get('redirect') || '/profile'
        router.push(redirect)
        router.refresh()
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(lang === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'An error occurred. Please try again.')
      setLoading(false)
    }
  }

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50">
      {/* ============================================================
          Header Section - Gradient Background
          ============================================================ */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {lang === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
          </h1>
          <p className="text-xl text-white/80">
            {lang === 'th' ? 'เข้าสู่ระบบเพื่อดูประวัติการจอง' : 'Login to view your booking history'}
          </p>
        </div>
      </div>

      {/* ============================================================
          Login Form Card
          ============================================================ */}
      <div className="max-w-md mx-auto px-6 sm:px-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          {/* Success Message - แสดงเมื่อสมัครสมาชิกสำเร็จ */}
          {showRegistered && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {lang === 'th' ? 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ' : 'Registration successful! Please login.'}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* อีเมล */}
            <Input
              type="email"
              label={lang === 'th' ? 'อีเมล' : 'Email'}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@email.com"
              required
              disabled={loading}
            />

            {/* รหัสผ่าน */}
            <Input
              type="password"
              label={lang === 'th' ? 'รหัสผ่าน' : 'Password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={lang === 'th' ? 'กรอกรหัสผ่าน' : 'Enter your password'}
              required
              disabled={loading}
            />

            {/* ปุ่มเข้าสู่ระบบ */}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {lang === 'th' ? 'กำลังเข้าสู่ระบบ...' : 'Logging in...'}
                </>
              ) : (
                lang === 'th' ? 'เข้าสู่ระบบ' : 'Login'
              )}
            </Button>
          </form>

          {/* Link ไปหน้า Register */}
          <div className="mt-6 text-center">
            <p className="text-slate-500">
              {lang === 'th' ? 'ยังไม่มีบัญชี?' : "Don't have an account?"}{' '}
              <Link href="/register" className="text-indigo-600 font-semibold hover:underline">
                {lang === 'th' ? 'สมัครสมาชิก' : 'Register'}
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Page Component
// ============================================================

/**
 * Login Page Component
 *
 * @description
 *   Wrapper component ที่ใช้ Suspense สำหรับ loading state
 *   เนื่องจากใช้ useSearchParams ต้องอยู่ใน Suspense
 *
 * @returns {JSX.Element} Login page พร้อม Suspense
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
