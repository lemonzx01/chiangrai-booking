import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyUserToken, isMockMode } from '@/lib/auth'
import { getMockBookingsByEmail } from '@/lib/mock-data'

// GET /api/user/bookings - Get current user's bookings
export async function GET() {
  try {
    // Verify user is logged in
    const auth = await verifyUserToken()

    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // Mock Mode
    if (isMockMode()) {
      const bookings = getMockBookingsByEmail(auth.user.email)
      return NextResponse.json({
        data: bookings,
        total: bookings.length,
      })
    }

    // Production Mode: Use Supabase
    const supabase = await createClient()

    const { data: bookings, error, count } = await supabase
      .from('bookings')
      .select(`
        *,
        hotel:hotels(*),
        car:cars(*)
      `, { count: 'exact' })
      .eq('customer_email', auth.user.email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get bookings error:', error)
      return NextResponse.json(
        { error: 'ไม่สามารถดึงข้อมูลการจองได้' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: bookings,
      total: count,
    })
  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
