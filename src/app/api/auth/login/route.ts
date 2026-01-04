import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { getJwtSecret, isMockMode } from '@/lib/auth'
import { findMockUser, findMockAdmin } from '@/lib/mock-data'

// POST /api/auth/login - Unified login for both user and admin
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const secret = getJwtSecret()

    // Mock Mode
    if (isMockMode()) {
      // First check if it's an admin
      const mockAdmin = findMockAdmin(email)

      if (mockAdmin) {
        // Check admin password (mock mode: admin123 or hashed)
        const isValidPassword = password === 'admin123' ||
          await bcrypt.compare(password, mockAdmin.password_hash).catch(() => false)

        if (!isValidPassword) {
          return NextResponse.json(
            { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
            { status: 401 }
          )
        }

        // Create admin JWT token
        const token = await new SignJWT({
          sub: mockAdmin.id,
          email: mockAdmin.email,
          name: mockAdmin.name,
          role: 'admin',
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('24h')
          .setIssuedAt()
          .sign(secret)

        // Set admin cookie
        cookieStore.set('admin_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 24 hours
          path: '/',
        })

        return NextResponse.json({
          user: {
            id: mockAdmin.id,
            email: mockAdmin.email,
            name: mockAdmin.name,
            role: 'admin',
          },
        })
      }

      // Check if it's a regular user
      const mockUser = findMockUser(email)

      if (!mockUser) {
        return NextResponse.json(
          { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
          { status: 401 }
        )
      }

      // Check user password (mock mode: user123 or hashed)
      const isValidPassword = password === 'user123' ||
        await bcrypt.compare(password, mockUser.password_hash).catch(() => false)

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
          { status: 401 }
        )
      }

      // Create user JWT token
      const token = await new SignJWT({
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        type: 'user',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(secret)

      // Set user cookie
      cookieStore.set('user_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return NextResponse.json({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: 'user',
        },
      })
    }

    // Production Mode: Use Supabase
    const supabase = await createAdminClient()

    // First check if it's an admin
    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (admin) {
      // Verify admin password
      const isValidPassword = await bcrypt.compare(password, admin.password_hash)

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
          { status: 401 }
        )
      }

      // Update last login
      await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id)

      // Create admin JWT token
      const token = await new SignJWT({
        sub: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .setIssuedAt()
        .sign(secret)

      // Set admin cookie
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      })

      return NextResponse.json({
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'admin',
        },
      })
    }

    // Check if it's a regular user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // Verify user password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // Create user JWT token
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'user',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(secret)

    // Set user cookie
    cookieStore.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'user',
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
