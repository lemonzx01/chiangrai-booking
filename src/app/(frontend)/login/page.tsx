'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { LogIn, Loader2, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

function LoginContent() {
  const { i18n } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const lang = i18n.language

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegistered, setShowRegistered] = useState(false)

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowRegistered(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      // Check if response is ok before parsing JSON
      if (!res.ok) {
        let errorMessage = lang === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = res.statusText || errorMessage
        }
        setError(errorMessage)
        setLoading(false)
        return
      }

      const data = await res.json()

      // Success - redirect based on role
      if (data.user?.role === 'admin') {
        // Admin goes to dashboard
        window.location.href = '/admin/dashboard'
      } else {
        // User goes to profile or redirect
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

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50">
      {/* Header */}
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

      <div className="max-w-md mx-auto px-6 sm:px-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          {showRegistered && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {lang === 'th' ? 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ' : 'Registration successful! Please login.'}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label={lang === 'th' ? 'อีเมล' : 'Email'}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@email.com"
              required
              disabled={loading}
            />

            <Input
              type="password"
              label={lang === 'th' ? 'รหัสผ่าน' : 'Password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={lang === 'th' ? 'กรอกรหัสผ่าน' : 'Enter your password'}
              required
              disabled={loading}
            />

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
