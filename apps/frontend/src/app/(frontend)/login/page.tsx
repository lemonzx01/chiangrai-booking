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

/** API Utilities */
import { getBackendUrl } from '@/lib/api'

// ============================================================
// Google Login Button Component
// ============================================================

/**
 * GoogleLoginButton - ปุ่มเข้าสู่ระบบด้วย Google
 * 
 * @description
 *   ใช้ form POST ส่งไป NextAuth v5 beta เพราะ GET ไม่ทำงาน
 *   Form จะถูกซ่อนไว้และ submit ด้วย JavaScript
 */
interface GoogleLoginButtonProps {
  callbackUrl: string
  loading: boolean
  setLoading: (loading: boolean) => void
  lang: string
}

function GoogleLoginButton({ callbackUrl, loading, setLoading, lang }: GoogleLoginButtonProps) {
  const handleGoogleLogin = async () => {
    setLoading(true)
    
    // ใช้ origin เดียวกับ frontend เพื่อให้ proxy rewrites ทำงาน
    // rewrites จะ forward /api/* ไปยัง backend อัตโนมัติ
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const fullCallbackUrl = `${baseUrl}${callbackUrl}`
    
    try {
      // First, get CSRF token from NextAuth (ผ่าน proxy)
      const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, {
        credentials: 'include',
      })
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.csrfToken
      
      // Create a hidden form and submit it (ผ่าน proxy)
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = `${baseUrl}/api/auth/signin/google`
      form.style.display = 'none'
      
      // Add CSRF token
      const csrfInput = document.createElement('input')
      csrfInput.type = 'hidden'
      csrfInput.name = 'csrfToken'
      csrfInput.value = csrfToken
      form.appendChild(csrfInput)
      
      // Add callback URL
      const callbackInput = document.createElement('input')
      callbackInput.type = 'hidden'
      callbackInput.name = 'callbackUrl'
      callbackInput.value = fullCallbackUrl
      form.appendChild(callbackInput)
      
      // Append form to body and submit
      document.body.appendChild(form)
      form.submit()
    } catch (error) {
      console.error('Google login error:', error)
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      className="w-full inline-flex items-center justify-center gap-3 font-medium rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 hover:border-slate-400 shadow-sm min-h-[44px] sm:min-h-0"
      onClick={handleGoogleLogin}
      disabled={loading}
    >
      {/* Google Logo with actual colors */}
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span className="text-slate-900 font-medium">
        {loading 
          ? (lang === 'th' ? 'กำลังเชื่อมต่อ...' : 'Connecting...')
          : (lang === 'th' ? 'เข้าสู่ระบบด้วย Google' : 'Sign in with Google')
        }
      </span>
    </button>
  )
}

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

  /** State สำหรับแสดงข้อความรีเซ็ตรหัสผ่านสำเร็จ */
  const [showPasswordReset, setShowPasswordReset] = useState(false)

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------
  /**
   * Effect: ถ้า login อยู่แล้ว ให้ redirect ไปหน้าที่ต้องการ
   */
  useEffect(() => {
    const checkIfLoggedIn = async () => {
      // เช็ค logged_in cookie ก่อน - ถ้าไม่มี ไม่ต้องเรียก API
      const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('logged_in='))
      if (!hasCookie) return

      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const redirect = searchParams.get('redirect') || '/'
          router.push(redirect)
        } else {
          // token หมดอายุ - ลบ logged_in cookie
          document.cookie = 'logged_in=; path=/; max-age=0'
        }
      } catch {
        // Not logged in - show login form
      }
    }
    checkIfLoggedIn()
  }, [router, searchParams])

  /**
   * Effect: ตรวจสอบว่ามาจากหน้าสมัครสมาชิกหรือรีเซ็ตรหัสผ่าน
   */
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowRegistered(true)
    }
    if (searchParams.get('password_reset') === 'true') {
      setShowPasswordReset(true)
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

      // ตั้ง flag cookie ให้ Navbar รู้ว่า login แล้ว (ป้องกัน 401 ใน console)
      document.cookie = 'logged_in=1; path=/; max-age=604800'

      // ----------------------------------------------------------
      // Redirect ตาม Role
      // ----------------------------------------------------------
      if (data.user?.role === 'admin') {
        // Admin ไป Dashboard (ใช้ window.location เพื่อ full refresh)
        window.location.href = '/admin/dashboard'
      } else {
        // User ไปหน้าแรก หรือ redirect URL (ใช้ full page reload เพื่อให้ Navbar re-mount)
        const redirect = searchParams.get('redirect') || '/'
        window.location.href = redirect
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

          {/* Success Message - แสดงเมื่อรีเซ็ตรหัสผ่านสำเร็จ */}
          {showPasswordReset && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {lang === 'th' ? 'รีเซ็ตรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่' : 'Password reset successful! Please login with your new password.'}
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

            {/* ลิงก์ลืมรหัสผ่าน */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {lang === 'th' ? 'ลืมรหัสผ่าน?' : 'Forgot password?'}
              </Link>
            </div>

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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">
                {lang === 'th' ? 'หรือ' : 'Or'}
              </span>
            </div>
          </div>

          {/* Google Login Button - Uses form POST for NextAuth v5 */}
          <GoogleLoginButton 
            callbackUrl={searchParams.get('redirect') || '/profile'}
            loading={loading}
            setLoading={setLoading}
            lang={lang}
          />

          {/* Links */}
          <div className="mt-6 space-y-3 text-center">
            {/* Link ไปหน้า Register */}
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
