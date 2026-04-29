/**
 * User wishlist — server-side persistence for authenticated users.
 *
 * GET    /api/user/wishlist                list current user's saved items
 * POST   /api/user/wishlist                add an item (idempotent)
 * DELETE /api/user/wishlist?kind=&id=      remove a single item
 * POST   /api/user/wishlist  { merge: [...] }   merge a localStorage list
 *
 * Why MERGE is its own action shape (rather than a separate
 * route): when a user logs in, the client has a localStorage
 * wishlist that needs to roll into the server-side list. One
 * request that bulk-upserts the lot is faster + simpler than
 * looping through individual POSTs.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '../../../../lib/supabase/server'
import { requireUser } from '../../../../lib/authz'
import { verifyCsrfToken } from '../../../../lib/csrf'
import { logger } from '../../../../lib/logger'

const KIND_VALUES = ['hotel', 'car'] as const

const itemSchema = z.object({
  kind: z.enum(KIND_VALUES),
  id: z.string().min(1).max(64),
  added_at: z.string().datetime().optional(),
})

const addBodySchema = z.union([
  // Single add
  itemSchema,
  // Bulk merge (login-time sync from localStorage)
  z.object({
    merge: z.array(itemSchema).max(200),
  }),
])

// ---- GET ------------------------------------------------------

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('user_wishlist')
    .select('kind, id, added_at')
    .eq('user_id', auth.user.id)
    .order('added_at', { ascending: false })
    .limit(200)

  if (error) {
    logger.error('wishlist list failed', { error: error.message })
    return NextResponse.json({ error: 'โหลดรายการไม่สำเร็จ' }, { status: 500 })
  }

  return NextResponse.json({ items: data || [] })
}

// ---- POST: single-add OR bulk-merge --------------------------

export async function POST(request: Request) {
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  const auth = await requireUser()
  if (!auth.ok) return auth.response

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = addBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const supabase = await createAdminClient()
  const userId = auth.user.id

  if ('merge' in parsed.data) {
    // Bulk: upsert each entry. ON CONFLICT (user_id, kind, id)
    // DO NOTHING means re-syncing the same localStorage twice
    // is idempotent and doesn't disturb the original added_at.
    const rows = parsed.data.merge.map((item) => ({
      user_id: userId,
      kind: item.kind,
      id: item.id,
      added_at: item.added_at || new Date().toISOString(),
    }))
    if (rows.length === 0) {
      return NextResponse.json({ merged: 0, total: 0 })
    }

    const { error } = await supabase
      .from('user_wishlist')
      .upsert(rows, {
        onConflict: 'user_id,kind,id',
        ignoreDuplicates: true,
      })
    if (error) {
      logger.error('wishlist merge failed', { error: error.message })
      return NextResponse.json({ error: 'ซิงก์รายการไม่สำเร็จ' }, { status: 500 })
    }

    // Echo total count so client can show "you have N saved" UI.
    const { count } = await supabase
      .from('user_wishlist')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    return NextResponse.json({ merged: rows.length, total: count || 0 })
  }

  // Single add path
  const { kind, id, added_at } = parsed.data
  const { error } = await supabase.from('user_wishlist').upsert(
    {
      user_id: userId,
      kind,
      id,
      added_at: added_at || new Date().toISOString(),
    },
    { onConflict: 'user_id,kind,id', ignoreDuplicates: true }
  )

  if (error) {
    logger.error('wishlist add failed', { error: error.message })
    return NextResponse.json({ error: 'เพิ่มรายการไม่สำเร็จ' }, { status: 500 })
  }

  return NextResponse.json({ success: true, kind, id })
}

// ---- DELETE ---------------------------------------------------

export async function DELETE(request: Request) {
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const kind = searchParams.get('kind')
  const id = searchParams.get('id')
  const all = searchParams.get('all')

  const supabase = await createAdminClient()

  // Clear-all (used by /wishlist "ลบทั้งหมด" when logged in)
  if (all === '1') {
    const { error } = await supabase
      .from('user_wishlist')
      .delete()
      .eq('user_id', auth.user.id)
    if (error) {
      logger.error('wishlist clear failed', { error: error.message })
      return NextResponse.json({ error: 'ลบไม่สำเร็จ' }, { status: 500 })
    }
    return NextResponse.json({ success: true, cleared: true })
  }

  if (!kind || !id || !KIND_VALUES.includes(kind as 'hotel' | 'car')) {
    return NextResponse.json(
      { error: 'kind (hotel|car) และ id เป็นค่าที่จำเป็น' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('user_wishlist')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('kind', kind)
    .eq('id', id)

  if (error) {
    logger.error('wishlist remove failed', { error: error.message })
    return NextResponse.json({ error: 'ลบรายการไม่สำเร็จ' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
