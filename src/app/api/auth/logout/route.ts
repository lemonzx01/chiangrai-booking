import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST /api/auth/logout - User logout
export async function POST() {
  try {
    const cookieStore = await cookies()

    // Delete user token cookie
    cookieStore.delete('user_token')

    return NextResponse.json({ message: 'ออกจากระบบสำเร็จ' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
