/**
 * ============================================================
 * Reset Password Page - หน้ารีเซ็ตรหัสผ่าน (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงฟอร์มสำหรับรีเซ็ตรหัสผ่าน
 *   - ใช้ token จาก URL เพื่อยืนยันตัวตน
 *
 * Route:
 *   - /reset-password?token=xxx - หน้ารีเซ็ตรหัสผ่าน
 *
 * Features:
 *   - Form กรอกรหัสผ่านใหม่
 *   - Validate รหัสผ่านต้องตรงกัน
 *   - ตรวจสอบ token จาก URL
 *   - Redirect ไป login เมื่อสำเร็จ
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
import { Key, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'

/** UI Components */
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ============================================================
// Reset Password Content Component
// ============================================================

/**
 * Reset Password Content - เนื้อหาหลักของหน้า Reset Password
 */
function ResetPasswordContent() {
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
    password: '',
    confirmPassword: '',
  })

  /** State สำหรับสถานะการโหลด */
  const [loading, setLoading] = useState(false)

  /** State สำหรับสถานะการตรวจสอบ token */
  const [verifying, setVerifying] = useState(true)

  /** State สำหรับข้อความ error */
  const [error, setError] = useState('')

  /** State สำหรับแสดงข้อความสำเร็จ */
  const [success, setSuccess] = useState(false)

  /** Token จาก URL */
  const token = searchParams.get('token')

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------
  /**
   * Effect: ตรวจสอบ token เมื่อ mount
   */
  useEffect(() => {
    if (!token) {
      setError(lang === 'th' ? 'ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน' : 'Reset token not found')
      setVerifying(false)
      return
    }

    // ตรวจสอบว่า token ถูกต้องหรือไม่
    const validateToken = async () => {
      try {
        const res = await fetch(`/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
        const data = await res.json()

        if (!res.ok || !data.valid) {
          setError(
            data.error || 
            (lang === 'th' ? 'Token ไม่ถูกต้องหรือหมดอายุแล้ว' : 'Invalid or expired token')
          )
          setVerifying(false)
          return
        }

        // Token ถูกต้อง
        setVerifying(false)
      } catch (err) {
        setError(lang === 'th' ? 'เกิดข้อผิดพลาดในการตรวจสอบ token' : 'Error validating token')
        setVerifying(false)
      }
    }

    validateToken()
  }, [token, lang])

  // ----------------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------------
  /**
   * จัดการการ submit ฟอร์ม
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // ----------------------------------------------------------
    // Validation
    // ----------------------------------------------------------
    // ตรวจสอบรหัสผ่านตรงกัน
    if (formData.password !== formData.confirmPassword) {
      setError(lang === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match')
      return
    }

    // ตรวจสอบความยาวรหัสผ่าน
    if (formData.password.length < 6) {
      setError(lang === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters')
      return
    }

    if (!token) {
      setError(lang === 'th' ? 'ไม่พบ token' : 'Token not found')
      return
    }

    setLoading(true)

    try {
      // ส่งข้อมูลไป API
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      })

      const data = await res.json()

      // Handle error response
      if (!res.ok) {
        setError(data.error || (lang === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'))
        setLoading(false)
        return
      }

      // Success
      setSuccess(true)
      setLoading(false)

      // Redirect ไป login หลังจาก 3 วินาที
      setTimeout(() => {
        router.push('/login?password_reset=true')
      }, 3000)
    } catch {
      setError(lang === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'An error occurred. Please try again.')
      setLoading(false)
    }
  }

  // ----------------------------------------------------------
  // Loading State
  // ----------------------------------------------------------
  if (verifying) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">
            {lang === 'th' ? 'กำลังตรวจสอบ...' : 'Verifying...'}
          </p>
        </div>
      </div>
    )
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
            {lang === 'th' ? 'รีเซ็ตรหัสผ่าน' : 'Reset Password'}
          </h1>
          <p className="text-xl text-white/80">
            {lang === 'th' ? 'ตั้งรหัสผ่านใหม่' : 'Set your new password'}
          </p>
        </div>
      </div>

      {/* ============================================================
          Reset Password Form Card
          ============================================================ */}
      <div className="max-w-md mx-auto px-6 sm:px-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <Key className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">
                  {lang === 'th' ? 'รีเซ็ตรหัสผ่านสำเร็จ!' : 'Password reset successful!'}
                </p>
                <p className="mt-1 text-xs">
                  {lang === 'th' 
                    ? 'กำลังเปลี่ยนไปหน้าเข้าสู่ระบบ...' 
                    : 'Redirecting to login page...'}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Form - แสดงเฉพาะเมื่อยังไม่สำเร็จ */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* รหัสผ่านใหม่ */}
              <Input
                type="password"
                label={lang === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={lang === 'th' ? 'กรอกรหัสผ่านใหม่' : 'Enter new password'}
                required
                disabled={loading}
              />

              {/* ยืนยันรหัสผ่าน */}
              <Input
                type="password"
                label={lang === 'th' ? 'ยืนยันรหัสผ่าน' : 'Confirm Password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder={lang === 'th' ? 'กรอกรหัสผ่านอีกครั้ง' : 'Confirm new password'}
                required
                disabled={loading}
              />

              {/* ปุ่มรีเซ็ตรหัสผ่าน */}
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {lang === 'th' ? 'กำลังรีเซ็ตรหัสผ่าน...' : 'Resetting password...'}
                  </>
                ) : (
                  lang === 'th' ? 'รีเซ็ตรหัสผ่าน' : 'Reset Password'
                )}
              </Button>
            </form>
          )}

          {/* Link กลับไปหน้า Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 hover:underline"
            >
              <ArrowLeft size={16} />
              {lang === 'th' ? 'กลับไปหน้าเข้าสู่ระบบ' : 'Back to login'}
            </Link>
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
 * Reset Password Page Component
 *
 * @description
 *   Wrapper component ที่ใช้ Suspense สำหรับ loading state
 *   เนื่องจากใช้ useSearchParams ต้องอยู่ใน Suspense
 *
 * @returns {JSX.Element} Reset password page พร้อม Suspense
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
