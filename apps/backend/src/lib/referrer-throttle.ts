/**
 * ============================================================
 * Referrer notification throttle
 * ============================================================
 *
 * Per-referrer cap on signup-notification emails. The endpoint-level
 * IP rate limit blocks bulk-signup attacks from a single origin, but
 * an attacker with a botnet could still spread signups across IPs.
 * To prevent inbox flooding, this module caps notifications-per-
 * referrer to 5 per 24h. Above that threshold we silently drop sends
 * — the referral itself is still recorded; the referrer just doesn't
 * get an email storm.
 *
 * Stored in-memory: each serverless instance has its own counter.
 * That's an acceptable upper bound for this kind of soft anti-abuse
 * since cold starts are infrequent and the worst case is a few extra
 * emails. If we ever need exact global counts, swap the Map for a
 * Vercel KV / Redis backend — the call site doesn't change.
 *
 * Lives outside route.ts because Next.js App Router only allows
 * specific exports (GET, POST, …) from a route module. Putting the
 * helper here keeps it test-importable without breaking the build's
 * route-shape validator.
 * ============================================================
 */

const REFERRER_NOTIFY_MAX = 5
const REFERRER_NOTIFY_WINDOW_MS = 24 * 60 * 60 * 1000

interface ReferrerNotifyEntry {
  count: number
  windowStart: number
}

const referrerNotifyMap = new Map<string, ReferrerNotifyEntry>()

/**
 * Returns true if we should send a notification to this referrer
 * right now. Increments the counter as a side-effect when the
 * answer is true — caller doesn't need to remember to update.
 */
export function shouldNotifyReferrer(referrerId: string): boolean {
  const now = Date.now()
  const existing = referrerNotifyMap.get(referrerId)

  // No entry, or the window has rolled over → fresh start.
  if (!existing || now - existing.windowStart > REFERRER_NOTIFY_WINDOW_MS) {
    referrerNotifyMap.set(referrerId, { count: 1, windowStart: now })
    return true
  }

  if (existing.count >= REFERRER_NOTIFY_MAX) {
    return false
  }

  existing.count++
  return true
}

/** Test hook — clears all counters. Call between test cases. */
export function _resetReferrerThrottleForTest(): void {
  referrerNotifyMap.clear()
}
