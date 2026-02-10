/**
 * ============================================================
 * Auth Callback Page - รับ token หลัง OAuth login
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - รับ JWT token จาก URL parameter
 *   - สร้าง user_token cookie
 *   - Redirect ไปหน้า profile
 *
 * Flow:
 *   1. Backend OAuth success → redirect มาที่นี่พร้อม token
 *   2. สร้าง cookie จาก token
 *   3. Redirect ไปหน้าที่ต้องการ
 *
 * ============================================================
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // ดึง token จาก URL parameter
        const token = searchParams.get('token')
        
        if (!token) {
          setError('ไม่พบ token')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        // เรียก API เพื่อสร้าง cookie (ผ่าน proxy ไป backend)
        const res = await fetch('/api/auth/set-cookie', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
          credentials: 'include',
        })

        if (!res.ok) {
          setError('ไม่สามารถสร้าง session ได้')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        // ตั้ง flag cookie ให้ Navbar รู้ว่า login แล้ว
        document.cookie = 'logged_in=1; path=/; max-age=604800'

        // Redirect ไปหน้าแรก (ใช้ full page reload เพื่อให้ Navbar re-mount)
        window.location.href = '/'
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
        setTimeout(() => router.push('/login'), 2000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-600 mb-2">{error}</p>
            <p className="text-slate-500">กำลังกลับไปหน้าเข้าสู่ระบบ...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600">กำลังเข้าสู่ระบบ...</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
