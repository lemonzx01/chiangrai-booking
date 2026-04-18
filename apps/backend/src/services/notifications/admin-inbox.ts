/**
 * ============================================================
 * Admin inbox notifications
 * ============================================================
 *
 * Lightweight helper that inserts a row into `admin_notifications`.
 * Never throws — failures are logged and swallowed so that the
 * triggering request (booking, review, cancellation, etc.) keeps
 * succeeding if the inbox write fails.
 *
 * Types
 *   - booking.created
 *   - booking.cancelled
 *   - review.submitted
 *   - payment.failed
 * ============================================================
 */
import { createAdminClient } from '../../lib/supabase/server'
import { logger } from '../../lib/logger'
import { isMockMode } from '../../lib/auth'

export type AdminNotificationType =
  | 'booking.created'
  | 'booking.cancelled'
  | 'booking.paid'
  | 'review.submitted'
  | 'payment.failed'
  | string

export type AdminNotificationSeverity = 'info' | 'success' | 'warning' | 'error'

export interface CreateAdminNotificationInput {
  type: AdminNotificationType
  title: string
  body?: string
  link?: string
  data?: Record<string, unknown>
  severity?: AdminNotificationSeverity
}

/**
 * Push a new admin inbox notification.
 * Never throws.
 */
export async function createAdminNotification(input: CreateAdminNotificationInput): Promise<void> {
  try {
    // Mock mode skips the DB round-trip to keep dev tests deterministic.
    if (isMockMode()) {
      logger.info('mock admin notification', { type: input.type, title: input.title })
      return
    }

    const supabase = await createAdminClient()
    const { error } = await supabase.from('admin_notifications').insert({
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      data: input.data ?? null,
      severity: input.severity ?? 'info',
    })

    if (error) {
      logger.error('admin notification insert failed', { type: input.type, error })
    }
  } catch (error) {
    logger.error('admin notification exception', { type: input.type, error })
  }
}
