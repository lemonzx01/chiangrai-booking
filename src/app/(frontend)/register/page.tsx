/**
 * ============================================================
 * Register Page - หน้าสมัครสมาชิก (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงฟอร์มสมัครสมาชิก
 *   - Validate ข้อมูลก่อนส่ง
 *   - ส่งข้อมูลไป API เพื่อสร้างบัญชี
 *
 * Route:
 *   - /register - หน้าสมัครสมาชิก
 *
 * Features:
 *   - Form กรอกข้อมูล (ชื่อ, อีเมล, โทร, รหัสผ่าน)
 *   - Validation รหัสผ่าน (ขั้นต่ำ 6 ตัว, ต้องตรงกัน)
 *   - Loading state ระหว่างส่ง
 *   - Error handling
 *   - Redirect ไป /login เมื่อสำเร็จ
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks สำหรับจัดการ state */
import { useState } from 'react'

/** Next.js hooks สำหรับ navigation */
import { useRouter } from 'next/navigation'

/** Next.js Link component */
import Link from 'next/link'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Lucide icons สำหรับ UI */
import { UserPlus, Loader2 } from 'lucide-react'

/** UI Components */
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ============================================================
// Main Component
// ============================================================

/**
 * หน้าสมัครสมาชิก
 *
 * @description
 *   แสดงฟอร์มสมัครสมาชิกพร้อม validation
 *   เมื่อสำเร็จจะ redirect ไปหน้า login
 *
 * @returns {JSX.Element} Register page UI
 */
export default function RegisterPage() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { i18n } = useTranslation()

  /** Hook สำหรับ navigation */
  const router = useRouter()

  /** ภาษาปัจจุบัน */
  const lang = i18n.language

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** State สำหรับข้อมูลฟอร์ม */
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  /** State สำหรับสถานะการโหลด */
  const [loading, setLoading] = useState(false)

  /** State สำหรับข้อความ error */
  const [error, setError] = useState('')

  // ----------------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------------
  /**
   * จัดการการ submit ฟอร์ม
   *
   * ขั้นตอน:
   * 1. Validate รหัสผ่านตรงกัน
   * 2. Validate รหัสผ่านขั้นต่ำ 6 ตัว
   * 3. ส่งข้อมูลไป API
   * 4. Redirect ไป login เมื่อสำเร็จ
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

    setLoading(true)

    // ----------------------------------------------------------
    // ส่งข้อมูลไป API
    // ----------------------------------------------------------
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
        }),
      })

      const data = await res.json()

      // Handle error response
      if (!res.ok) {
        setError(data.error || (lang === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'))
        return
      }

      // Success - redirect to login พร้อม flag
      router.push('/login?registered=true')
    } catch {
      setError(lang === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'An error occurred. Please try again.')
    } finally {
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
            {lang === 'th' ? 'สมัครสมาชิก' : 'Create Account'}
          </h1>
          <p className="text-xl text-white/80">
            {lang === 'th' ? 'สร้างบัญชีเพื่อจองง่ายขึ้น' : 'Create an account for easier booking'}
          </p>
        </div>
      </div>

      {/* ============================================================
          Register Form Card
          ============================================================ */}
      <div className="max-w-md mx-auto px-6 sm:px-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ชื่อ-นามสกุล */}
            <Input
              label={lang === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={lang === 'th' ? 'กรอกชื่อ-นามสกุล' : 'Enter your full name'}
              required
              disabled={loading}
            />

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

            {/* โทรศัพท์ (ไม่บังคับ) */}
            <Input
              type="tel"
              label={lang === 'th' ? 'เบอร์โทรศัพท์ (ไม่บังคับ)' : 'Phone (Optional)'}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="081-234-5678"
              disabled={loading}
            />

            {/* รหัสผ่าน */}
            <Input
              type="password"
              label={lang === 'th' ? 'รหัสผ่าน' : 'Password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={lang === 'th' ? 'อย่างน้อย 6 ตัวอักษร' : 'At least 6 characters'}
              required
              disabled={loading}
            />

            {/* ยืนยันรหัสผ่าน */}
            <Input
              type="password"
              label={lang === 'th' ? 'ยืนยันรหัสผ่าน' : 'Confirm Password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder={lang === 'th' ? 'กรอกรหัสผ่านอีกครั้ง' : 'Enter password again'}
              required
              disabled={loading}
            />

            {/* ปุ่มสมัคร */}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {lang === 'th' ? 'กำลังสมัคร...' : 'Creating...'}
                </>
              ) : (
                lang === 'th' ? 'สมัครสมาชิก' : 'Create Account'
              )}
            </Button>
          </form>

          {/* Link ไปหน้า Login */}
          <div className="mt-6 text-center">
            <p className="text-slate-500">
              {lang === 'th' ? 'มีบัญชีอยู่แล้ว?' : 'Already have an account?'}{' '}
              <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
                {lang === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
