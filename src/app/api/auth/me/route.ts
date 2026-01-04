import { NextResponse } from 'next/server'
import { verifyUserToken } from '@/lib/auth'

// GET /api/auth/me - Get current user info
export async function GET() {
  try {
    const auth = await verifyUserToken()

    if (!auth.success) {
      return NextResponse.json(
        { error: 'ไม่ได้เข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: auth.user,
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
