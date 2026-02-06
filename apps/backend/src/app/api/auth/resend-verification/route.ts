import { createAdminClient } from '../../../../lib/supabase/server'
import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { getJwtSecret, isMockMode, verifyUserToken } from '../../../../lib/auth'
import { sendEmail } from '../../../../services/notifications/email'
import { rateLimitMiddleware } from '../../../../middleware/rate-limit'

export async function POST(request: Request) {
  try {
    const rateLimitResponse = rateLimitMiddleware(request, '/api/auth/resend-verification')
    if (rateLimitResponse) {
      return NextResponse.json(
        { error: 'ส่งได้สูงสุด 3 ครั้งต่อชั่วโมง กรุณาลองใหม่ภายหลัง' },
        { status: 429 }
      )
    }

    if (isMockMode()) {
      return NextResponse.json({
        message: 'ส่งอีเมลยืนยันแล้ว กรุณาตรวจสอบอีเมลของคุณ',
      })
    }

    // ดึง email จาก authenticated user หรือ body
    const auth = await verifyUserToken()
    let email: string

    if (auth.success) {
      email = auth.user!.email
    } else {
      const body = await request.json()
      email = body.email
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, email_verified')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (!user) {
      // ไม่เปิดเผยว่ามี email หรือไม่
      return NextResponse.json({
        message: 'ส่งอีเมลยืนยันแล้ว กรุณาตรวจสอบอีเมลของคุณ',
      })
    }

    if (user.email_verified) {
      return NextResponse.json({
        message: 'อีเมลนี้ยืนยันแล้ว',
        already_verified: true,
      })
    }

    const secret = getJwtSecret()
    const verificationToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      type: 'email_verification',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(secret)

    const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`

    sendEmail({
      to: user.email,
      subject: 'ยืนยันอีเมล - Got Journey Thailand',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">ยืนยันอีเมลของคุณ</h1>
          <p>สวัสดีคุณ ${user.name},</p>
          <p>กรุณาคลิกลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              ยืนยันอีเมล
            </a>
          </div>
          <p style="color: #6B7280; font-size: 14px;">
            หรือคัดลอกลิงก์นี้:<br>
            <a href="${verifyLink}" style="color: #4F46E5; word-break: break-all;">${verifyLink}</a>
          </p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง
          </p>
        </div>
      `,
    }).catch((err) => {
      console.error('[EMAIL] Failed to send verification email:', err)
    })

    return NextResponse.json({
      message: 'ส่งอีเมลยืนยันแล้ว กรุณาตรวจสอบอีเมลของคุณ',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
