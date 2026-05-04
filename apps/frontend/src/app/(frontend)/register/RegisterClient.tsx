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
import { useState, useEffect, Suspense } from 'react'

/** Next.js hooks สำหรับ navigation */
import { useRouter, useSearchParams } from 'next/navigation'

/** Next.js Link component */
import Link from 'next/link'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Lucide icons สำหรับ UI */
import { UserPlus, Loader2, Gift } from 'lucide-react'

/** UI Components */
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ============================================================
// Main Component
// ============================================================

/**
 * Client component for the register page. Held separately from
 * page.tsx so the page itself can stay a Server Component and
 * export `generateMetadata` (which reads `?ref` to render a
 * dynamic OG image preview when the link is shared).
 *
 * @description
 *   แสดงฟอร์มสมัครสมาชิกพร้อม validation
 *   เมื่อสำเร็จจะ redirect ไปหน้า login
 *
 * @returns {JSX.Element} Register page UI
 */
export default function RegisterClient() {
  // useSearchParams must run inside a Suspense boundary on Next 14.
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageInner />
    </Suspense>
  )
}

function RegisterPageFallback() {
  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  )
}

function RegisterPageInner() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { i18n } = useTranslation()

  /** Hook สำหรับ navigation */
  const router = useRouter()

  /** Hook สำหรับ query params (?ref=...) */
  const searchParams = useSearchParams()

  /** ภาษาปัจจุบัน */
  const lang = i18n.language

  // ----------------------------------------------------------
  // Referral capture
  // ----------------------------------------------------------
  // The ref param flows: marketing link → /register?ref=CODE → here →
  // POST body. We normalize once on read and keep a stable string in
  // state so re-renders don't re-parse the URL.
  const [referralCode, setReferralCode] = useState<string>('')

  useEffect(() => {
    const raw = searchParams.get('ref')
    if (!raw) return
    const normalized = raw.trim().toUpperCase()
    // Defensive: only accept the alphabet our generator uses, in case
    // someone hand-types a code with spaces or punctuation.
    if (/^[A-Z0-9]{4,16}$/.test(normalized)) {
      setReferralCode(normalized)
    }
  }, [searchParams])

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
          // Pass through the referral code if one was on the URL.
          // Backend treats it as advisory — invalid/missing codes
          // never block registration.
          ref: referralCode || undefined,
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
      <div className="bg-white border-b border-slate-200 py-12">
        <div className="max-w-md mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-medium text-slate-900 mb-3 tracking-tight">
            {lang === 'th' ? 'สมัครสมาชิก' : 'Create Account'}
          </h1>
          <p className="text-base text-slate-500 font-light">
            {lang === 'th' ? 'สร้างบัญชีเพื่อจองง่ายขึ้น' : 'Create an account for easier booking'}
          </p>
        </div>
      </div>

      {/* ============================================================
          Register Form Card
          ============================================================ */}
      <div className="max-w-md mx-auto px-6 sm:px-8 mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          {/* Referral Banner — shown when ?ref=CODE is on the URL */}
          {referralCode && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <Gift className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-emerald-800">
                  {lang === 'th'
                    ? 'คุณได้รับการแนะนำจากเพื่อน!'
                    : 'You were referred by a friend!'}
                </p>
                <p className="text-emerald-700 mt-0.5">
                  {lang === 'th'
                    ? `รหัสแนะนำ: ${referralCode} — ทั้งคุณและเพื่อนจะได้รับส่วนลดเมื่อจองครั้งแรก`
                    : `Referral code: ${referralCode} — you'll both get a discount on your first booking`}
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
