import { createAdminClient } from '../../../../lib/supabase/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getJwtSecret, isMockMode } from '../../../../lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    if (isMockMode()) {
      return NextResponse.json({
        message: 'ยืนยันอีเมลสำเร็จ',
      })
    }

    const secret = getJwtSecret()

    let payload: any
    try {
      const verified = await jwtVerify(token, secret)
      payload = verified.payload
    } catch {
      return NextResponse.json(
        { error: 'ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุ' },
        { status: 400 }
      )
    }

    if (payload.type !== 'email_verification') {
      return NextResponse.json(
        { error: 'Invalid token type' },
        { status: 400 }
      )
    }

    const userId = payload.sub as string

    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error verifying email:', error)
      return NextResponse.json(
        { error: 'ไม่สามารถยืนยันอีเมลได้' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'ยืนยันอีเมลสำเร็จ',
    })
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
