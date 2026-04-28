/**
 * GET  /api/email-preferences?token=...      look up status
 * POST /api/email-preferences                 toggle subscription
 *
 * Public endpoints — no cookie auth required. The token in
 * the URL is an HMAC-signed email (see lib/unsubscribe.ts).
 *
 * Why public:
 *   The customer is likely clicking from an email on a device
 *   they're not logged into. Forcing login here would tank
 *   the unsubscribe rate, which would push spam reports up,
 *   which hurts our deliverability for ALL future emails.
 *   Industry consensus: one-click unsubscribe is the right
 *   behavior, and signing the email into the token is enough
 *   to keep it from being spoofable.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  verifyUnsubscribeToken,
  isUnsubscribed,
  addUnsubscribe,
  removeUnsubscribe,
} from '../../../lib/unsubscribe'
import { logger } from '../../../lib/logger'

// ---- GET: read current status -------------------------------

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (!token) {
    return NextResponse.json(
      { error: 'token is required' },
      { status: 400 }
    )
  }

  const email = verifyUnsubscribeToken(token)
  if (!email) {
    return NextResponse.json(
      { error: 'ลิงก์ไม่ถูกต้องหรือหมดอายุ' },
      { status: 400 }
    )
  }

  try {
    const unsubscribed = await isUnsubscribed(email)
    return NextResponse.json({
      email,
      unsubscribed,
    })
  } catch (err) {
    logger.error('email-preferences read failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { error: 'ไม่สามารถตรวจสอบสถานะได้' },
      { status: 500 }
    )
  }
}

// ---- POST: change subscription state -------------------------

const updateSchema = z.object({
  token: z.string().min(1),
  // unsubscribed=true means "I want to opt out".
  unsubscribed: z.boolean(),
  reason: z.string().max(500).optional(),
})

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลไม่ครบถ้วน', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const email = verifyUnsubscribeToken(parsed.data.token)
  if (!email) {
    return NextResponse.json(
      { error: 'ลิงก์ไม่ถูกต้องหรือหมดอายุ' },
      { status: 400 }
    )
  }

  try {
    if (parsed.data.unsubscribed) {
      await addUnsubscribe(email, parsed.data.reason)
      logger.info('user unsubscribed', { email })
    } else {
      await removeUnsubscribe(email)
      logger.info('user re-subscribed', { email })
    }
    return NextResponse.json({
      success: true,
      email,
      unsubscribed: parsed.data.unsubscribed,
    })
  } catch (err) {
    logger.error('email-preferences update failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { error: 'บันทึกการเปลี่ยนแปลงไม่สำเร็จ' },
      { status: 500 }
    )
  }
}
