import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminNotification } from '../../../../services/notifications/admin-inbox'
import { logger } from '../../../../lib/logger'
import { rateLimitAsync } from '../../../../middleware/rate-limit'

export const dynamic = 'force-dynamic'

const subscribeSchema = z.object({
  email: z.string().email().max(254),
})

export async function POST(request: Request) {
  try {
    const rateLimitResponse = await rateLimitAsync(request, '/api/email/subscribe')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json().catch(() => ({}))
    const parsed = subscribeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    // For first-launch scale we lean on the existing admin inbox
    // instead of standing up a dedicated subscribers table. Migrate
    // when volume justifies it.
    await createAdminNotification({
      type: 'newsletter.subscribed',
      title: 'New newsletter subscriber',
      body: email,
      data: { email },
      severity: 'info',
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error('newsletter subscribe failed', { error })
    return NextResponse.json(
      { error: 'Subscription failed' },
      { status: 500 }
    )
  }
}
