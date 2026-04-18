/**
 * ============================================================
 * Set Cookie API Route - สร้าง user_token cookie
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - รับ JWT token แล้วสร้าง cookie
 *   - ใช้สำหรับ OAuth callback flow
 *
 * Endpoint:
 *   - POST /api/auth/set-cookie
 *
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '../../../../lib/logger'

/**
 * POST - รับ token แล้วสร้าง cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      )
    }

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
    logger.error('Set cookie error', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to set cookie' },
      { status: 500 }
    )
  }
}
