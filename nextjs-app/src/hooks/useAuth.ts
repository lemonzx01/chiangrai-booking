'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/auth')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    setUser(data.user)
    router.push('/admin/dashboard')
    return data
  }, [router])

  // Logout function
  const logout = useCallback(async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    setUser(null)
    router.push('/admin/login')
  }, [router])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  }
}

export default useAuth
