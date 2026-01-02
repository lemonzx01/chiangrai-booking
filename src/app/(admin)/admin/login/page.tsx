'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Compass } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function AdminLoginPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Check if already logged in
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
        // Not logged in, continue
      }
    }
    checkAuth()
  }, [router])

  // Load saved email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('admin_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('admin_email', email)
      } else {
        localStorage.removeItem('admin_email')
      }

      // Reset loading before redirect
      setLoading(false)
      
      // Use window.location for reliable redirect (forces full page reload)
      window.location.href = '/admin/dashboard'
    } catch (err: any) {
      setError(err.message || t('admin.login.error') || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-600 rounded-xl">
              <Compass size={28} className="text-white" />
            </div>
            <span className="text-3xl font-black text-white">Got Journey Thailand</span>
          </div>
          <p className="text-slate-400">Admin Dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            {t('admin.login.title')}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label={t('admin.login.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
            <Input
              type="password"
              label={t('admin.login.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm text-center font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading} disabled={loading}>
              {t('admin.login.submit') || 'เข้าสู่ระบบ'}
            </Button>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                <strong className="text-slate-700">Mock Mode:</strong> admin@gotjourneythailand.com / admin123
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          © 2024 Got Journey Thailand. All rights reserved.
        </p>
      </div>
    </div>
  )
}
