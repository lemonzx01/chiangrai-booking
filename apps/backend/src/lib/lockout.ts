/**
 * ============================================================
 * Account Lockout — Brute-Force Protection
 * ============================================================
 *
 * Policy:
 *   - Track every login attempt (success and failure)
 *   - 5 failed attempts within 15 minutes  →  lock for 30 minutes
 *   - A successful login does NOT clear past failures, but a fresh
 *     15-min window starts the moment the lockout expires
 *
 * Storage:
 *   - Production: login_attempts table (Supabase, via service role)
 *   - Mock mode: in-memory Map (per-process; resets on reload)
 *
 * Usage:
 *   const status = await checkLockout(email, ip)
 *   if (status.locked) return 429 { error: status.reason, retryAfter }
 *
 *   // try password check...
 *   if (!ok) {
 *     await recordAttempt(email, ip, false)
 *     return 401
 *   }
 *
 *   await recordAttempt(email, ip, true)
 *   return 200
 * ============================================================
 */

import { createAdminClient } from './supabase/server'
import { isMockMode } from './auth'
import { logger } from './logger'

const MAX_FAILED = 5
const WINDOW_MINUTES = 15
const LOCKOUT_MINUTES = 30

// In-memory store for mock mode
interface Attempt {
  success: boolean
  at: number
}
const memoryStore = new Map<string, Attempt[]>()

function key(email: string): string {
  return email.toLowerCase().trim()
}

export interface LockoutStatus {
  locked: boolean
  reason?: string
  retryAfterSeconds?: number
  failureCount?: number
}

/**
 * Check whether the given email is currently locked out.
 */
export async function checkLockout(email: string): Promise<LockoutStatus> {
  const k = key(email)
  const now = Date.now()
  const windowStart = now - WINDOW_MINUTES * 60 * 1000

  let attempts: Attempt[] = []

  if (isMockMode()) {
    attempts = (memoryStore.get(k) || []).filter((a) => a.at >= windowStart)
    memoryStore.set(k, attempts)
  } else {
    try {
      const supabase = await createAdminClient()
      const { data } = await supabase
        .from('login_attempts')
        .select('success, attempted_at')
        .eq('email', k)
        .gte('attempted_at', new Date(windowStart).toISOString())
        .order('attempted_at', { ascending: false })
        .limit(50)
      attempts = (data || []).map((d: any) => ({
        success: !!d.success,
        at: new Date(d.attempted_at).getTime(),
      }))
    } catch (err) {
      logger.error('lockout: failed to read login_attempts', { error: err })
      // Fail open — better than locking out everyone if DB is down.
      return { locked: false }
    }
  }

  const failures = attempts.filter((a) => !a.success)
  if (failures.length < MAX_FAILED) {
    return { locked: false, failureCount: failures.length }
  }

  // Locked. Compute time remaining based on the OLDEST failure in the window
  // (i.e., once that failure ages out, the user is below the threshold again).
  const lastFailure = failures[0].at
  const lockoutEnds = lastFailure + LOCKOUT_MINUTES * 60 * 1000
  const remaining = Math.max(0, lockoutEnds - now)
  if (remaining === 0) {
    return { locked: false, failureCount: failures.length }
  }

  return {
    locked: true,
    reason: `บัญชีถูกล็อกชั่วคราวเนื่องจากเข้าสู่ระบบผิดหลายครั้ง โปรดลองอีกครั้งภายหลัง`,
    retryAfterSeconds: Math.ceil(remaining / 1000),
    failureCount: failures.length,
  }
}

/**
 * Record a login attempt (success or failure).
 */
export async function recordAttempt(
  email: string,
  ip: string | null,
  success: boolean,
  userAgent?: string | null
): Promise<void> {
  const k = key(email)

  if (isMockMode()) {
    const list = memoryStore.get(k) || []
    list.unshift({ success, at: Date.now() })
    // Keep at most 20 entries per email
    memoryStore.set(k, list.slice(0, 20))
    return
  }

  try {
    const supabase = await createAdminClient()
    await supabase.from('login_attempts').insert({
      email: k,
      ip: ip || null,
      user_agent: userAgent || null,
      success,
    })
  } catch (err) {
    logger.error('lockout: failed to record login_attempt', { error: err })
    // Don't block login flow on this — just log.
  }
}

/**
 * Helper to extract IP from a Next.js Request.
 */
export function getClientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return null
}
