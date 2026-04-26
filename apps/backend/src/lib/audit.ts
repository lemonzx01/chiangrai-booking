/**
 * ============================================================
 * Admin audit log writer
 * ============================================================
 *
 * Use from any admin-protected route to record what an admin
 * did. The function is fire-and-forget (returns void, swallows
 * errors) — an audit-log failure must NEVER block a successful
 * action, but we still log the failure so we know we lost a row.
 *
 * Usage:
 *   import { logAdminAction } from '@/lib/audit'
 *
 *   logAdminAction({
 *     actor: auth.user,
 *     request,
 *     action: 'booking.refund',
 *     resource_type: 'booking',
 *     resource_id: code,
 *     metadata: { amount, reason },
 *   })
 *
 * Mock mode: writes to logger as `audit:` info events instead
 * of the DB, so dev environments still produce a paper trail
 * we can grep when reproducing bugs.
 * ============================================================
 */

import { createAdminClient } from './supabase/server'
import { isMockMode } from './auth'
import { logger } from './logger'

export interface AdminActor {
  id?: string | null
  email?: string | null
}

export interface AuditEntry {
  /**
   * The admin performing the action. Pulled from requireAdmin
   * auth.user (full shape) or verifyAdminToken result.user
   * (looser shape since the token verifier types user as
   * optional). Either is fine — we extract id/email defensively.
   */
  actor: AdminActor | null | undefined
  /** Original Request — used to extract IP, UA, request-id. */
  request?: Request
  /** Action verb. Convention: '<resource>.<verb>' (e.g. 'booking.refund'). */
  action: string
  /** What kind of thing was acted on. */
  resource_type?: string | null
  /** Identifier of the thing — booking_code, uuid, anything stringable. */
  resource_id?: string | null
  /** Free-form context (refund amount, reason, before/after, etc.). */
  metadata?: Record<string, unknown> | null
}

/**
 * Best-effort audit write. Never throws.
 */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  const actor = entry.actor || null
  const row = {
    actor_id: actor?.id || null,
    actor_email: actor?.email || null,
    action: entry.action,
    resource_type: entry.resource_type || null,
    resource_id: entry.resource_id || null,
    metadata: entry.metadata || {},
    ip_address: entry.request ? extractIp(entry.request) : null,
    user_agent: entry.request?.headers.get('user-agent') || null,
    request_id: entry.request?.headers.get('x-request-id') || null,
  }

  // Mock mode: log to console / pretty logger instead of DB.
  if (isMockMode()) {
    logger.info('audit', {
      action: row.action,
      actor: row.actor_email || 'unknown',
      resource: `${row.resource_type || '?'}#${row.resource_id || '?'}`,
      metadata: row.metadata,
    })
    return
  }

  try {
    const supabase = await createAdminClient()
    const { error } = await supabase.from('admin_audit_log').insert(row)
    if (error) {
      logger.error('audit log insert failed', {
        action: row.action,
        error: error.message,
      })
    }
  } catch (err) {
    logger.error('audit log threw', {
      action: row.action,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/**
 * Extract the originating IP from a Vercel-fronted Request.
 * Vercel forwards via x-forwarded-for; we take the leftmost entry
 * (the original client) since intermediate hops can be trusted
 * within the Vercel infrastructure.
 */
function extractIp(request: Request): string | null {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip')
}
