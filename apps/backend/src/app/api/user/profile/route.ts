export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { verifyUserToken, createToken, isMockMode } from '../../../../lib/auth'
import { createAdminClient } from '../../../../lib/supabase/server'

export async function GET() {
  try {
    const auth = await verifyUserToken()
    if (!auth.success) {
      return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 })
    }

    if (isMockMode()) {
      return NextResponse.json({
        user: {
          id: auth.user.id,
          email: auth.user.email,
          name: auth.user.name,
          phone: null,
          email_verified: auth.user.email_verified || false,
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
      .eq('id', auth.user.id)
      .single()

    if (error || !user) {
      if (error?.code === 'PGRST116' || !user) {
        console.error('User not found in DB. JWT user ID:', auth.user.id, 'email:', auth.user.email)
        return NextResponse.json({ error: 'ไม่พบผู้ใช้ในระบบ' }, { status: 404 })
      }
      console.error('Profile query error:', error)
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
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await verifyUserToken()
    if (!auth.success) {
      return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, current_password, new_password } = body

    // Validation
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

    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ error: 'กรุณากรอกรหัสผ่านปัจจุบัน' }, { status: 400 })
      }
      if (new_password.length < 8) {
        return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 })
      }
    }

    if (isMockMode()) {
      return NextResponse.json({
        user: {
          id: auth.user.id,
          email: auth.user.email,
          name: name?.trim() || auth.user.name,
          phone: phone || null,
          email_verified: auth.user.email_verified || false,
          created_at: new Date().toISOString(),
          has_password: true,
          has_google: false,
        },
        message: 'อัปเดตข้อมูลเรียบร้อย',
      })
    }

    const supabase = await createAdminClient()

    // Get current user data for password verification
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', auth.user.id)
      .single()

    if (fetchError) {
      console.error('Profile fetch error:', fetchError)
      return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 })
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 })
    }

    // Password change validation
    if (new_password) {
      if (!currentUser.password_hash) {
        return NextResponse.json(
          { error: 'บัญชีนี้ใช้ Google login ไม่สามารถเปลี่ยนรหัสผ่านได้' },
          { status: 400 }
        )
      }

      const isValidPassword = await bcrypt.compare(current_password, currentUser.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 })
      }
    }

    // Build update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) {
      updateData.name = name.trim()
    }

    if (phone !== undefined) {
      updateData.phone = phone === '' ? null : phone
    }

    if (new_password) {
      updateData.password_hash = await bcrypt.hash(new_password, 12)
    }

    // Update in Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', auth.user.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'อัปเดตข้อมูลไม่สำเร็จ' }, { status: 500 })
    }

    // Re-issue JWT token if name changed (so Navbar updates)
    if (updateData.name && updateData.name !== currentUser.name) {
      const newToken = await createToken({
        sub: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        type: 'user',
        email_verified: updatedUser.email_verified || false,
      }, '7d')

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
    console.error('Profile PATCH error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
