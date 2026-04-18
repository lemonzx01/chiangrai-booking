/**
 * GET /api/partner/resources
 *
 * Returns the hotels/rooms/cars owned by the authenticated partner,
 * so the partner UI can populate resource pickers (calendar, bookings,
 * etc.) without duplicating ownership logic across routes.
 *
 * Admins get back EVERYTHING — useful when they impersonate a partner
 * view for support.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/server'
import { requirePartner } from '../../../../lib/authz'
import { verifyAdminToken } from '../../../../lib/auth'
import { logger } from '../../../../lib/logger'

export async function GET() {
  const auth = await requirePartner()
  if (!auth.ok) return auth.response

  const adminCheck = await verifyAdminToken()
  const isAdmin = adminCheck.success === true
  const userId = auth.user.id

  const supabase = await createAdminClient()

  try {
    let hotelsQuery = supabase
      .from('hotels')
      .select('id, name_th, name_en, owner_id')
      .order('name_th', { ascending: true })
    let carsQuery = supabase
      .from('cars')
      .select('id, name_th, name_en, owner_id')
      .order('name_th', { ascending: true })

    if (!isAdmin) {
      hotelsQuery = hotelsQuery.eq('owner_id', userId)
      carsQuery = carsQuery.eq('owner_id', userId)
    }

    const [hotelsRes, carsRes] = await Promise.all([hotelsQuery, carsQuery])

    if (hotelsRes.error) throw hotelsRes.error
    if (carsRes.error) throw carsRes.error

    // Room types — only for the hotels the caller owns.
    const hotelIds = ((hotelsRes.data as Array<{ id: string }> | null) || []).map((h) => h.id)

    let roomTypes: Array<{ id: string; hotel_id: string; name_th: string; name_en: string | null }> = []
    if (hotelIds.length > 0) {
      const { data: rtData, error: rtErr } = await supabase
        .from('room_types')
        .select('id, hotel_id, name_th, name_en')
        .in('hotel_id', hotelIds)

      if (rtErr) {
        logger.warn('failed to list room_types for partner', { error: rtErr })
      } else {
        roomTypes = (rtData as typeof roomTypes) || []
      }
    }

    return NextResponse.json({
      hotels: hotelsRes.data || [],
      cars: carsRes.data || [],
      room_types: roomTypes,
      is_admin: isAdmin,
    })
  } catch (error) {
    logger.error('partner resources lookup failed', { error })
    return NextResponse.json({ error: 'Failed to load resources' }, { status: 500 })
  }
}
