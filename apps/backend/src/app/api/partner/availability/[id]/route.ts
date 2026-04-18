/**
 * DELETE /api/partner/availability/[id]
 *
 * Remove a block. Partner can only delete blocks on their own
 * hotels/cars; admins can delete anything.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../../lib/supabase/server'
import { requirePartner } from '../../../../../lib/authz'
import { verifyAdminToken } from '../../../../../lib/auth'
import { verifyCsrfToken } from '../../../../../lib/csrf'
import { logger } from '../../../../../lib/logger'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  const auth = await requirePartner()
  if (!auth.ok) return auth.response

  const adminCheck = await verifyAdminToken()
  const isAdmin = adminCheck.success === true

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'missing id' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Load the block and the owner of the target resource.
  const { data: block, error: loadErr } = await supabase
    .from('availability_blocks')
    .select('id, hotel_id, car_id, hotel:hotels(owner_id), car:cars(owner_id)')
    .eq('id', id)
    .single()

  if (loadErr || !block) {
    return NextResponse.json({ error: 'ไม่พบรายการบล็อก' }, { status: 404 })
  }

  if (!isAdmin) {
    const b = block as {
      hotel?: { owner_id: string | null } | null
      car?: { owner_id: string | null } | null
    }
    const hotelOwner = b.hotel?.owner_id
    const carOwner = b.car?.owner_id
    if (hotelOwner !== auth.user.id && carOwner !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error } = await supabase
    .from('availability_blocks')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('failed to delete availability block', { id, error })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
