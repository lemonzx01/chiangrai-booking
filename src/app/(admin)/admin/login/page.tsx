'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Compass, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function AdminLoginPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Login failed')
      }

      router.push('/admin/dashboard')
    } catch {
      setError(t('admin.login.error'))
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

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('admin.login.submit')}
            </Button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          © 2024 Got Journey Thailand. All rights reserved.
        </p>
      </div>
    </div>
  )
}
