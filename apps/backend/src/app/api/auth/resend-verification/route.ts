export const dynamic = 'force-dynamic'

import { createAdminClient } from '../../../../lib/supabase/server'
import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { getJwtSecret, isMockMode, verifyUserToken } from '../../../../lib/auth'
import { sendEmail } from '../../../../services/notifications/email'
import { renderEmailVerificationEmail } from '../../../../services/notifications/templates/emailVerification'
import { rateLimitAsync } from '../../../../middleware/rate-limit'
import { logger } from '../../../../lib/logger'

export async function POST(request: Request) {
  try {
    const rateLimitResponse = await rateLimitAsync(request, '/api/auth/resend-verification')
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

    // Log verification link for development (when no email service)
    if (!process.env.RESEND_API_KEY) {
      logger.info('[DEV] Email verification link', { verifyLink })
    }

    const verify = renderEmailVerificationEmail({
      userName: user.name,
      verifyLink,
    })
    sendEmail({
      to: user.email,
      subject: verify.subject,
      html: verify.html,
    }).catch((err) => {
      logger.error('[EMAIL] Failed to send verification email', { error: err })
    })

    return NextResponse.json({
      message: 'ส่งอีเมลยืนยันแล้ว กรุณาตรวจสอบอีเมลของคุณ',
    })
  } catch (error) {
    logger.error('Resend verification error', { error })
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
