'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Mail, Loader2, CheckCircle, XCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

function VerifyEmailContent() {
  const { i18n } = useTranslation()
  const searchParams = useSearchParams()
  const lang = i18n.language

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError(lang === 'th' ? 'ไม่พบลิงก์ยืนยัน' : 'Verification link not found')
      setLoading(false)
      return
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || (lang === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'))
        } else {
          setSuccess(true)
        }
      } catch {
        setError(lang === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'An error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    verifyEmail()
  }, [token, lang])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">
            {lang === 'th' ? 'กำลังยืนยันอีเมล...' : 'Verifying email...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {lang === 'th' ? 'ยืนยันอีเมล' : 'Email Verification'}
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 sm:px-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {success ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {lang === 'th' ? 'ยืนยันอีเมลสำเร็จ!' : 'Email Verified!'}
              </h2>
              <p className="text-slate-500 mb-6">
                {lang === 'th'
                  ? 'อีเมลของคุณได้รับการยืนยันเรียบร้อยแล้ว'
                  : 'Your email has been verified successfully.'}
              </p>
              <Link href="/profile">
                <Button size="lg" className="w-full">
                  {lang === 'th' ? 'ไปหน้าโปรไฟล์' : 'Go to Profile'}
                </Button>
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {lang === 'th' ? 'ยืนยันไม่สำเร็จ' : 'Verification Failed'}
              </h2>
              <p className="text-red-600 mb-6">{error}</p>
              <Link href="/profile">
                <Button variant="outline" size="lg" className="w-full">
                  {lang === 'th' ? 'ไปหน้าโปรไฟล์' : 'Go to Profile'}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
