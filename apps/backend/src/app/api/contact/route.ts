/**
 * ============================================================
 * Contact API Route - ระบบติดต่อเรา
 * ============================================================
 *
 * Endpoint:
 *   - POST /api/contact - ส่งข้อความติดต่อ
 *
 * Body fields: name, email, phone (optional), message
 * ============================================================
 */
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '../../../lib/logger'
import { rateLimitAsync } from '../../../middleware/rate-limit'
import { createAdminNotification } from '../../../services/notifications/admin-inbox'

const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
  message: z.string().min(1).max(5000),
})

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimitAsync(request, '/api/contact')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json().catch(() => ({}))
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { name, email, phone, message } = parsed.data

    // Mirrors the newsletter-subscribe approach: route submissions
    // into the admin inbox instead of standing up a dedicated table.
    await createAdminNotification({
      type: 'contact.message',
      title: 'New contact form message',
      body: `${name}: ${message.slice(0, 200)}`,
      data: { name, email, phone: phone ?? null, message },
      severity: 'info',
    })

    return NextResponse.json({
      success: true,
      message: 'ส่งข้อความสำเร็จ เราจะติดต่อกลับโดยเร็วที่สุด',
    })
  } catch (error) {
    logger.error('Contact form error', { error })
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
