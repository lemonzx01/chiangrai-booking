import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse, isMockMode } from '@/lib/auth'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/hotels/[id] - Get single hotel
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/hotels/[id] - Update hotel (admin only)
export async function PUT(request: Request, { params }: Params) {
  try {
    // Verify admin authorization
    const auth = await verifyAdminToken()
    if (!auth.success) {
      return unauthorizedResponse('Admin access required')
    }

    const { id } = await params
    const body = await request.json()

    // Mock Mode: Just return success
    if (isMockMode()) {
      return NextResponse.json({
        ...body,
        id,
        updated_at: new Date().toISOString(),
      })
    }

    // Production Mode: Use Supabase
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('hotels')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Update hotel error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/hotels/[id] - Delete hotel (admin only)
export async function DELETE(request: Request, { params }: Params) {
  try {
    // Verify admin authorization
    const auth = await verifyAdminToken()
    if (!auth.success) {
      return unauthorizedResponse('Admin access required')
    }

    const { id } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase.from('hotels').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
