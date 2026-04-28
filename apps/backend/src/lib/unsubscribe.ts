/**
 * ============================================================
 * Unsubscribe token signing
 * ============================================================
 *
 * Email links can't carry an authentication cookie — the user
 * clicks from their inbox, possibly hours later, on a device
 * that isn't logged in. We sign the email address into the
 * URL so the page can authenticate the request without
 * requiring login.
 *
 * Token format:
 *   base64url(email).base64url(hmac_sha256(secret, email))
 *
 * Why HMAC, not JWT:
 *   - We don't need expiry (a stale unsubscribe link is fine
 *     to honor — the user is still asking to opt out).
 *   - HMAC is simpler, smaller, and avoids the "jose claim
 *     surprise" vector.
 *
 * The secret is the same JWT_SECRET we use for cookies — one
 * less knob to rotate. If JWT_SECRET rotates, all outstanding
 * unsubscribe links from past campaign emails go stale, but
 * recipients can always reply to the email or use a fresh link
 * from a future campaign.
 * ============================================================
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from './supabase/server'

const SEPARATOR = '.'

function getSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 16) {
    // Fall back to a constant in dev so mock-mode tests work
    // without env setup. Production startup should already
    // have failed if JWT_SECRET is missing — this path only
    // runs in test / mock mode.
    return 'mock-mode-unsubscribe-secret-do-not-use-in-prod'
  }
  return s
}

/** Base64url encode (no padding, URL-safe). */
function b64url(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf, 'utf8') : buf
  return b
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function b64urlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/')
  const padLen = (4 - (padded.length % 4)) % 4
  return Buffer.from(padded + '='.repeat(padLen), 'base64')
}

/**
 * Build an unsubscribe token for the given email address.
 *
 * Lowercases the email so the verify step is case-insensitive
 * (most email providers treat addresses case-insensitively for
 * the local part anyway).
 */
export function signUnsubscribeToken(email: string): string {
  const e = email.trim().toLowerCase()
  const sig = createHmac('sha256', getSecret()).update(e).digest()
  return `${b64url(e)}${SEPARATOR}${b64url(sig)}`
}

/**
 * Verify a token. Returns the canonical (lowercased) email on
 * success, or null on any failure. Uses timing-safe compare so
 * an attacker can't infer secret bytes by measuring response
 * time on probe requests.
 */
export function verifyUnsubscribeToken(token: string): string | null {
  if (!token || typeof token !== 'string') return null
  const parts = token.split(SEPARATOR)
  if (parts.length !== 2) return null
  try {
    const email = b64urlDecode(parts[0]).toString('utf8')
    const sig = b64urlDecode(parts[1])
    const expected = createHmac('sha256', getSecret()).update(email).digest()
    if (sig.length !== expected.length) return null
    if (!timingSafeEqual(sig, expected)) return null
    return email
  } catch {
    return null
  }
}

/**
 * Check the unsubscribe denylist for an email. Used by the
 * campaign sender to skip recipients who opted out.
 *
 * Mock mode hits the in-memory mock table; production hits
 * Supabase via the service-role client.
 */
export async function isUnsubscribed(email: string): Promise<boolean> {
  if (!email) return false
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('email_unsubscribes')
    .select('email')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  return !!data
}

/**
 * Idempotently add an email to the denylist. Inserts a fresh
 * row OR updates the unsubscribed_at + reason if the address
 * was already on the list — keeps audit-trail accuracy without
 * a unique-violation error path.
 */
export async function addUnsubscribe(
  email: string,
  reason?: string,
  categories?: string[]
): Promise<void> {
  const e = email.trim().toLowerCase()
  if (!e) return
  const supabase = await createAdminClient()
  // upsert on the primary key — if the row exists, update
  // unsubscribed_at + reason so the latest opt-out wins.
  await supabase.from('email_unsubscribes').upsert(
    {
      email: e,
      reason: reason || null,
      categories: categories || [],
      unsubscribed_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  )
}

/**
 * Remove an email from the denylist (re-subscribe). Used when
 * a user changes their mind on the preferences page.
 */
export async function removeUnsubscribe(email: string): Promise<void> {
  const e = email.trim().toLowerCase()
  if (!e) return
  const supabase = await createAdminClient()
  await supabase.from('email_unsubscribes').delete().eq('email', e)
}
