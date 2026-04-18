export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

import { verifyUserToken, createToken, isMockMode } from '../../../../lib/auth'
import { createAdminClient } from '../../../../lib/supabase/server'
import { logger } from '../../../../lib/logger'

export async function GET() {
  try {
    const auth = await verifyUserToken()
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 })
    }

    const authUser = auth.user

    if (isMockMode()) {
      return NextResponse.json({
        user: {
          id: authUser.id,
          email: authUser.email,
          name: authUser.name,
          phone: null,
          email_verified: authUser.email_verified || false,
          created_at: new Date().toISOString(),
          has_password: true,
          has_google: false,
        },
      })
    }

    const supabase = await createAdminClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error || !user) {
      if (error?.code === 'PGRST116' || !user) {
        logger.error('User not found in DB', { userId: authUser.id, email: authUser.email })
        return NextResponse.json({ error: 'ไม่พบผู้ใช้ในระบบ' }, { status: 404 })
      }
      logger.error('Profile query error', { error })
      return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || null,
        email_verified: user.email_verified || false,
        created_at: user.created_at,
        has_password: !!user.password_hash,
        has_google: !!user.google_id,
      },
    })
  } catch (error) {
    logger.error('Profile GET error', { error })
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await verifyUserToken()
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 })
    }

    const authUser = auth.user
    const body = await request.json()
    const { name, phone, current_password, new_password } = body as {
      name?: unknown
      phone?: unknown
      current_password?: unknown
      new_password?: unknown
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
        return NextResponse.json({ error: 'ชื่อต้องมี 1-100 ตัวอักษร' }, { status: 400 })
      }
    }

    if (phone !== undefined && phone !== null && phone !== '') {
      if (typeof phone !== 'string' || phone.length > 20) {
        return NextResponse.json({ error: 'เบอร์โทรไม่ถูกต้อง' }, { status: 400 })
      }
    }

    if (new_password !== undefined && new_password !== null && new_password !== '') {
      if (typeof current_password !== 'string' || current_password.length === 0) {
        return NextResponse.json({ error: 'กรุณากรอกรหัสผ่านปัจจุบัน' }, { status: 400 })
      }
      if (typeof new_password !== 'string' || new_password.length < 8) {
        return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 })
      }
    }

    if (isMockMode()) {
      return NextResponse.json({
        user: {
          id: authUser.id,
          email: authUser.email,
          name: typeof name === 'string' ? name.trim() : authUser.name,
          phone: typeof phone === 'string' ? phone : null,
          email_verified: authUser.email_verified || false,
          created_at: new Date().toISOString(),
          has_password: true,
          has_google: false,
        },
        message: 'อัปเดตข้อมูลเรียบร้อย',
      })
    }

    const supabase = await createAdminClient()
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (fetchError) {
      logger.error('Profile fetch error', { error: fetchError })
      return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 })
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 })
    }

    if (typeof new_password === 'string' && new_password.length > 0) {
      if (!currentUser.password_hash) {
        return NextResponse.json(
          { error: 'บัญชีนี้ใช้ Google login ไม่สามารถเปลี่ยนรหัสผ่านได้' },
          { status: 400 }
        )
      }

      const isValidPassword = await bcrypt.compare(String(current_password), currentUser.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 })
      }
    }

    const updateData: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof name === 'string') {
      updateData.name = name.trim()
    }

    if (phone !== undefined) {
      updateData.phone = phone === '' ? null : String(phone)
    }

    if (typeof new_password === 'string' && new_password.length > 0) {
      updateData.password_hash = await bcrypt.hash(new_password, 12)
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', authUser.id)
      .select('*')
      .single()

    if (updateError) {
      logger.error('Profile update error', { error: updateError })
      return NextResponse.json({ error: 'อัปเดตข้อมูลไม่สำเร็จ' }, { status: 500 })
    }

    if (updateData.name && updateData.name !== currentUser.name) {
      const role =
        updatedUser.role === 'admin' || updatedUser.role === 'partner' ? updatedUser.role : 'user'

      const newToken = await createToken(
        {
          sub: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role,
          type: role,
          email_verified: updatedUser.email_verified || false,
        },
        '7d'
      )

      const cookieStore = await cookies()
      cookieStore.set('user_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
    }

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone || null,
        email_verified: updatedUser.email_verified || false,
        created_at: updatedUser.created_at,
        has_password: !!updatedUser.password_hash,
        has_google: !!updatedUser.google_id,
      },
      message: 'อัปเดตข้อมูลเรียบร้อย',
    })
  } catch (error) {
    logger.error('Profile PATCH error', { error })
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
