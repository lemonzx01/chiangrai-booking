/**
 * ============================================================
 * Forgot Password Page - หน้าลืมรหัสผ่าน (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงฟอร์มสำหรับขอรีเซ็ตรหัสผ่าน
 *   - ส่งอีเมลลิงก์รีเซ็ตรหัสผ่าน
 *
 * Route:
 *   - /forgot-password - หน้าลืมรหัสผ่าน
 *
 * Features:
 *   - Form กรอกอีเมล
 *   - ส่งอีเมลลิงก์รีเซ็ตรหัสผ่าน
 *   - แสดงข้อความยืนยันเมื่อส่งอีเมลสำเร็จ
 *   - Link กลับไปหน้า login
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks */
import { useState } from 'react'

/** Next.js Link component */
import Link from 'next/link'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Lucide icons สำหรับ UI */
import { Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'

/** UI Components */
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ============================================================
// Main Component
// ============================================================

/**
 * หน้าลืมรหัสผ่าน
 *
 * @description
 *   แสดงฟอร์มสำหรับกรอกอีเมลเพื่อขอรีเซ็ตรหัสผ่าน
 *   เมื่อส่งสำเร็จจะแสดงข้อความยืนยัน
 *
 * @returns {JSX.Element} Forgot password page UI
 */
export default function ForgotPasswordPage() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { i18n } = useTranslation()

  /** ภาษาปัจจุบัน */
  const lang = i18n.language

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** State สำหรับอีเมล */
  const [email, setEmail] = useState('')

  /** State สำหรับสถานะการโหลด */
  const [loading, setLoading] = useState(false)

  /** State สำหรับข้อความ error */
  const [error, setError] = useState('')

  /** State สำหรับแสดงข้อความสำเร็จ */
  const [success, setSuccess] = useState(false)

  // ----------------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------------
  /**
   * จัดการการ submit ฟอร์ม
   *
   * ขั้นตอน:
   * 1. Validate อีเมล
   * 2. ส่งข้อมูลไป API
   * 3. แสดงข้อความสำเร็จ
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      // ส่งข้อมูลไป API
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      // Handle error response
      if (!res.ok) {
        setError(data.error || (lang === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'))
        setLoading(false)
        return
      }

      // Success - แสดงข้อความสำเร็จ
      setSuccess(true)
      setLoading(false)
    } catch {
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
            {lang === 'th' ? 'ลืมรหัสผ่าน' : 'Forgot Password'}
          </h1>
          <p className="text-xl text-white/80">
            {lang === 'th' ? 'กรอกอีเมลเพื่อรีเซ็ตรหัสผ่าน' : 'Enter your email to reset your password'}
          </p>
        </div>
      </div>

      {/* ============================================================
          Forgot Password Form Card
          ============================================================ */}
      <div className="max-w-md mx-auto px-6 sm:px-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">
                  {lang === 'th' ? 'ส่งอีเมลสำเร็จ!' : 'Email sent successfully!'}
                </p>
                <p className="mt-1 text-xs">
                  {lang === 'th' 
                    ? 'กรุณาตรวจสอบอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน' 
                    : 'Please check your email to reset your password'}
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
              {/* อีเมล */}
              <Input
                type="email"
                label={lang === 'th' ? 'อีเมล' : 'Email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                disabled={loading}
              />

              {/* ปุ่มส่งอีเมล */}
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {lang === 'th' ? 'กำลังส่งอีเมล...' : 'Sending email...'}
                  </>
                ) : (
                  lang === 'th' ? 'ส่งอีเมลรีเซ็ตรหัสผ่าน' : 'Send Reset Link'
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

          {/* Link ไปหน้า Register */}
          <div className="mt-4 text-center">
            <p className="text-slate-500 text-sm">
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
