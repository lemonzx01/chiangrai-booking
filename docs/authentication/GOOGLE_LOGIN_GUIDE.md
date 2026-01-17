# 🔐 คู่มือติดตั้ง Google Login ด้วย NextAuth.js

คู่มือฉบับสมบูรณ์สำหรับติดตั้งระบบ Login ด้วย Google ใน Next.js App Router

---

## 📋 สารบัญ

1. [Environment Variables (.env.local)](#1-environment-variables-envlocal)
2. [NextAuth Configuration](#2-nextauth-configuration)
3. [หน้า Login พร้อมปุ่ม Google](#3-หน้า-login-พร้อมปุ่ม-google)
4. [การเช็คสถานะ Login และแสดงข้อมูล User](#4-การเช็คสถานะ-login-และแสดงข้อมูล-user)

---

## 1. Environment Variables (.env.local)

### 📍 ตำแหน่งไฟล์
- **Backend**: `apps/backend/.env.local` หรือ `.env.local` (root)
- **Frontend**: `apps/frontend/.env.local` (ถ้าต้องการ)

### 🔑 ตัวแปรที่ต้องตั้งค่า

```bash
# ============================================
# Google OAuth Credentials
# ============================================
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# ============================================
# NextAuth Secret (สำคัญมาก!)
# ============================================
# ใช้สำหรับ sign JWT tokens
# ต้องมีความยาวอย่างน้อย 32 ตัวอักษร
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars
# หรือใช้ JWT_SECRET แทนได้
JWT_SECRET=your-jwt-secret-key-min-32-chars

# ============================================
# App URLs
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### ⚠️ หมายเหตุสำคัญ

1. **Backend Port**: Backend รันที่ port **3001** (ไม่ใช่ 3000)
2. **Callback URL**: ต้องตั้งค่าใน Google Cloud Console เป็น:
   ```
   http://localhost:3001/api/auth/callback/google
   ```
   **ไม่ใช่** `http://localhost:3000` ❌

---

## 2. NextAuth Configuration

### 📁 ไฟล์: `apps/backend/src/lib/auth/nextauth.ts`

โค้ดนี้มีอยู่แล้วในโปรเจกต์ของคุณ แต่ให้ตรวจสอบว่า:

```typescript
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // ... providers อื่นๆ
  ],
  
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // จัดการข้อมูล user เมื่อ login ด้วย Google
      if (account?.provider === 'google' && profile) {
        // บันทึกข้อมูล user ลง database
        // ...
        token.id = dbUser.id
        token.email = dbUser.email
        token.name = dbUser.name
        token.role = dbUser.role || 'user'
      }
      return token
    },
    
    async session({ session, token }) {
      // เพิ่มข้อมูล user ใน session
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
}
```

### 📁 ไฟล์: `apps/backend/src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '../../../../lib/auth/nextauth'

// NextAuth v5 with Next.js App Router
const { handlers } = NextAuth(authOptions as any)

export const GET = handlers.GET
export const POST = handlers.POST
```

---

## 3. หน้า Login พร้อมปุ่ม Google

### 📁 ไฟล์: `apps/frontend/src/app/(frontend)/login/page.tsx`

โค้ดปุ่ม Google Login (มีอยู่แล้ว แต่ปรับปรุงให้ดีขึ้น):

```typescript
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = () => {
    setLoading(true)
    
    // กำหนด Backend URL
    // Development: http://localhost:3001
    // Production: ใช้ environment variable
    const backendUrl = 
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      (typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : window.location.origin.replace(':3000', ':3001'))
    
    // Callback URL หลังจาก login สำเร็จ
    const callbackUrl = searchParams.get('redirect') || '/profile'
    
    // Redirect ไปยัง NextAuth Google sign-in
    window.location.href = `${backendUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          เข้าสู่ระบบ
        </h1>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-300 rounded-xl text-slate-900 hover:bg-slate-50 hover:border-slate-400 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Google Logo */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          
          <span className="font-medium">
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
          </span>
        </button>
      </div>
    </div>
  )
}
```

---

## 4. การเช็คสถานะ Login และแสดงข้อมูล User

### 4.1 เช็คว่า User Login หรือยัง (Client Component)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: string
  image?: string
}

export default function ProtectedPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // เรียก API เพื่อดึงข้อมูล user
      const res = await fetch('/api/auth/me', {
        credentials: 'include', // ส่ง cookies
      })
      
      if (!res.ok) {
        // ไม่ได้ login -> redirect ไปหน้า login
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
        return
      }
      
      const data = await res.json()
      setUser(data.user)
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>กำลังโหลด...</div>
  }

  if (!user) {
    return null // จะ redirect ไป login
  }

  return (
    <div>
      <h1>ยินดีต้อนรับ, {user.name}!</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      {user.image && (
        <img src={user.image} alt={user.name} className="w-20 h-20 rounded-full" />
      )}
    </div>
  )
}
```

### 4.2 แสดงข้อมูล User ใน Navbar

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  image?: string
}

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch {
      // ไม่ได้ login
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/')
      router.refresh()
    } catch {
      // Error
    }
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold">
              Logo
            </a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* แสดงรูปโปรไฟล์ */}
                {user.image && (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                
                {/* แสดงชื่อ */}
                <span className="text-slate-700">{user.name}</span>
                
                {/* ปุ่ม Logout */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                เข้าสู่ระบบ
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
```

### 4.3 Server Component - เช็ค Auth (Server-side)

```typescript
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  // ตรวจสอบ cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('next-auth.session-token') || 
                cookieStore.get('__Secure-next-auth.session-token')

  if (!token) {
    redirect('/login')
  }

  // ดึงข้อมูล user จาก API
  const res = await fetch('http://localhost:3001/api/auth/me', {
    headers: {
      Cookie: cookieStore.toString(),
    },
  })

  if (!res.ok) {
    redirect('/login')
  }

  const data = await res.json()
  const user = data.user

  return (
    <div>
      <h1>ยินดีต้อนรับ, {user.name}!</h1>
      <p>Email: {user.email}</p>
    </div>
  )
}
```

---

## 🔧 API Endpoints ที่ต้องมี

### 1. GET `/api/auth/me` - ดึงข้อมูล User ปัจจุบัน

**Backend**: `apps/backend/src/app/api/auth/me/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth/nextauth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 2. POST `/api/auth/logout` - ออกจากระบบ

**Backend**: `apps/backend/src/app/api/auth/logout/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  
  // ลบ session cookies
  cookieStore.delete('next-auth.session-token')
  cookieStore.delete('__Secure-next-auth.session-token')

  return NextResponse.json({ message: 'Logged out successfully' })
}
```

---

## ✅ Checklist การตั้งค่า

- [ ] ตั้งค่า `GOOGLE_CLIENT_ID` ใน `.env.local`
- [ ] ตั้งค่า `GOOGLE_CLIENT_SECRET` ใน `.env.local`
- [ ] ตั้งค่า `NEXTAUTH_SECRET` หรือ `JWT_SECRET` ใน `.env.local`
- [ ] ตั้งค่า Callback URL ใน Google Cloud Console เป็น `http://localhost:3001/api/auth/callback/google`
- [ ] รัน Backend ที่ port 3001
- [ ] รัน Frontend ที่ port 3000
- [ ] ทดสอบ Login ด้วย Google

---

## 🐛 Troubleshooting

### ❌ "redirect_uri_mismatch"
- ตรวจสอบว่า Callback URL ใน Google Cloud Console เป็น `http://localhost:3001/api/auth/callback/google`
- **ไม่ใช่** `http://localhost:3000` ❌

### ❌ "invalid_client"
- ตรวจสอบว่า `GOOGLE_CLIENT_ID` และ `GOOGLE_CLIENT_SECRET` ถูกต้อง
- Restart backend server หลังจากแก้ไข `.env.local`

### ❌ Frontend ไม่ redirect ไป Google
- ตรวจสอบว่า backend รันอยู่ที่ port 3001
- ตรวจสอบ URL ใน `handleGoogleLogin` function

---

## 📚 Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Next.js App Router](https://nextjs.org/docs/app)
