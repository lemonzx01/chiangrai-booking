/**
 * ============================================================
 * Authorization Helpers
 * ============================================================
 *
 * Higher-level guards built on top of verify*Token() in lib/auth.
 *
 * Why a separate file:
 *   - lib/auth handles *authentication* (who is this caller?)
 *   - lib/authz handles *authorization* (do they have permission?)
 *
 * Each helper returns either:
 *   - { ok: true, user }   — proceed with handler
 *   - { ok: false, response: NextResponse }   — return this immediately
 *
 * Usage:
 *   export async function POST(req: Request) {
 *     const auth = await requireAdmin()
 *     if (!auth.ok) return auth.response
 *     // ... auth.user.id is the admin id
 *   }
 * ============================================================
 */

import { NextResponse } from 'next/server'
import { verifyAdminToken, verifyPartnerToken, verifyUserToken } from './auth'
import { createAdminClient } from './supabase/server'

export interface AuthSuccess<U = any> {
  ok: true
  user: U
}
export interface AuthFailure {
  ok: false
  response: NextResponse
}
export type AuthResult<U = any> = AuthSuccess<U> | AuthFailure

const unauth = (msg = 'Unauthorized', code = 401): AuthFailure => ({
  ok: false,
  response: NextResponse.json({ error: msg }, { status: code }),
})

/**
 * Require an authenticated admin.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const result = await verifyAdminToken()
  if (!result.success || !result.user) {
    return unauth('Admin authentication required', 401)
  }
  return { ok: true, user: result.user }
}

/**
 * Require any authenticated user (any role).
 */
export async function requireUser(): Promise<AuthResult> {
  const result = await verifyUserToken()
  if (!result.success || !result.user) {
    return unauth('Authentication required', 401)
  }
  return { ok: true, user: result.user }
}

/**
 * Require an authenticated partner (or admin).
 */
export async function requirePartner(): Promise<AuthResult> {
  const result = await verifyPartnerToken()
  if (!result.success || !result.user) {
    return unauth('Partner authentication required', 401)
  }
  return { ok: true, user: result.user }
}

/**
 * Require that the caller owns the given resource OR is an admin.
 *
 * Looks up the resource by id, checks an owner_id field against the
 * partner/user JWT subject. Returns 403 if mismatched.
 */
export async function requireResourceOwner(
  table: 'hotels' | 'cars' | 'bookings' | 'partners' | 'coupons',
  id: string,
  ownerField: string = 'owner_id'
): Promise<AuthResult> {
  // Try admin first — admins bypass ownership.
  const adminResult = await verifyAdminToken()
  if (adminResult.success && adminResult.user) {
    return { ok: true, user: { ...adminResult.user, isAdmin: true } }
  }

  // Otherwise must be a partner/user
  const partnerResult = await verifyPartnerToken()
  if (!partnerResult.success || !partnerResult.user) {
    return unauth('Authentication required', 401)
  }

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from(table)
    .select(`id, ${ownerField}`)
    .eq('id', id)
    .single()

  if (error || !data) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not found' }, { status: 404 }),
    }
  }

  if ((data as any)[ownerField] !== partnerResult.user.id) {
    return unauth('Forbidden', 403)
  }

  return { ok: true, user: partnerResult.user }
}

/**
 * Require that the caller is the booking customer (matched by email)
 * OR the partner who owns the booked listing OR an admin.
 */
export async function requireBookingAccess(bookingId: string): Promise<AuthResult> {
  // Try admin first
  const adminResult = await verifyAdminToken()
  if (adminResult.success && adminResult.user) {
    return { ok: true, user: { ...adminResult.user, isAdmin: true } }
  }

  // Otherwise check user / partner
  const userResult = await verifyUserToken()
  const partnerResult = await verifyPartnerToken()
  const caller = userResult.success ? userResult.user : partnerResult.success ? partnerResult.user : null
  if (!caller) {
    return unauth('Authentication required', 401)
  }

  const supabase = await createAdminClient()
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, customer_email, hotel_id, car_id, hotel:hotels(owner_id), car:cars(owner_id)')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Booking not found' }, { status: 404 }),
    }
  }

  // Customer match by email
  if ((booking as any).customer_email === caller.email) {
    return { ok: true, user: caller }
  }

  // Partner match by owner_id
  const hotelOwner = (booking as any).hotel?.owner_id
  const carOwner = (booking as any).car?.owner_id
  if (hotelOwner === caller.id || carOwner === caller.id) {
    return { ok: true, user: caller }
  }

  return unauth('Forbidden', 403)
}
