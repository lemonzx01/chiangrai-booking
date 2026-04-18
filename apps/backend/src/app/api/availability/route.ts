export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/server'
import { isMockMode } from '../../../lib/auth'
import { checkRoomAvailability, checkCarAvailability } from '../../../lib/availability'
import { logger } from '../../../lib/logger'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomTypeId = searchParams.get('room_type_id')
    const carId = searchParams.get('car_id')
    const checkIn = searchParams.get('check_in_date')
    const checkOut = searchParams.get('check_out_date')

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'check_in_date and check_out_date are required' },
        { status: 400 }
      )
    }

    if (!roomTypeId && !carId) {
      return NextResponse.json(
        { error: 'room_type_id or car_id is required' },
        { status: 400 }
      )
    }

    if (isMockMode()) {
      return NextResponse.json({
        available: true,
        remaining: 5,
        total: 5,
      })
    }

    const supabase = await createAdminClient()

    if (roomTypeId) {
      const result = await checkRoomAvailability(supabase, roomTypeId, checkIn, checkOut)
      return NextResponse.json(result)
    }

    if (carId) {
      const result = await checkCarAvailability(supabase, carId, checkIn, checkOut)
      return NextResponse.json(result)
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    logger.error('Availability check error', { error })
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
