/**
 * ============================================================
 * Set Session API Route - สร้าง user_token cookie
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ดึง session จาก NextAuth
 *   - สร้าง user_token JWT cookie สำหรับ frontend
 *
 * Endpoint:
 *   - GET /api/auth/set-session - ดึง session และสร้าง cookie
 *
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createToken } from '../../../../lib/auth'
import { auth } from '../../../../lib/auth/nextauth'

/**
 * GET - ดึง NextAuth session แล้วส่ง token ไปให้ frontend
 */
export async function GET(request: NextRequest) {
  try {
    // ดึง session จาก NextAuth
    const session = await auth()
    
    console.log('[DEBUG] set-session: session =', session)

    if (!session?.user) {
      // ถ้าไม่มี session redirect ไปหน้า login
      return NextResponse.redirect(new URL('/login?error=no_session', 'http://localhost:3000'))
    }

    const user = session.user as any

    // สร้าง JWT token สำหรับ user
    const token = await createToken({
      sub: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role || 'user',
    }, '7d') // หมดอายุใน 7 วัน

    console.log('[DEBUG] set-session: token created for', user.email)

    // Redirect ไป frontend พร้อม token ใน URL
    // Frontend จะสร้าง cookie เอง
    const redirectUrl = new URL('/auth/callback', 'http://localhost:3000')
    redirectUrl.searchParams.set('token', token)
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Set session error:', error)
    return NextResponse.redirect(new URL('/login?error=session_error', 'http://localhost:3000'))
  }
}

/**
 * POST - รับ user data แล้วสร้าง cookie (สำหรับ fallback)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user } = body

    if (!user?.id || !user?.email) {
      return NextResponse.json(
        { success: false, error: 'Missing user data' },
        { status: 400 }
      )
    }

    // สร้าง JWT token สำหรับ user
    const token = await createToken({
      sub: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role || 'user',
    }, '7d') // หมดอายุใน 7 วัน

    // ตั้งค่า cookie
    const cookieStore = await cookies()
    cookieStore.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set session error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
