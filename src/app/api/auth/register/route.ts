import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { isMockMode } from '@/lib/auth'
import { findMockUser, addMockUser } from '@/lib/mock-data'
import { validatePassword, sanitizeInput } from '@/lib/utils'
import type { User } from '@/types'

// POST /api/auth/register - User registration
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, phone } = body

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'กรุณากรอกอีเมล รหัสผ่าน และชื่อ' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name)
    const sanitizedEmail = email.toLowerCase().trim()

    // Password validation with strong policy
    const passwordValidation = validatePassword(password, 'th')
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'รหัสผ่านไม่ปลอดภัย',
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Name validation (prevent too long names)
    if (sanitizedName.length > 100) {
      return NextResponse.json(
        { error: 'ชื่อยาวเกินไป (สูงสุด 100 ตัวอักษร)' },
        { status: 400 }
      )
    }

    // Mock Mode
    if (isMockMode()) {
      // Check if user already exists
      const existingUser = findMockUser(sanitizedEmail)
      if (existingUser) {
        return NextResponse.json(
          { error: 'อีเมลนี้ถูกใช้งานแล้ว' },
          { status: 400 }
        )
      }

      // Hash password with higher cost factor for security
      const password_hash = await bcrypt.hash(password, 12)

      // Create new user
      const newUser: User = {
        id: `mock-user-${Date.now()}`,
        email: sanitizedEmail,
        password_hash,
        name: sanitizedName,
        phone: phone ? sanitizeInput(phone) : undefined,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      addMockUser(newUser)

      return NextResponse.json({
        message: 'สมัครสมาชิกสำเร็จ',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      }, { status: 201 })
    }

    // Production Mode: Use Supabase
    const supabase = await createAdminClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', sanitizedEmail)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมลนี้ถูกใช้งานแล้ว' },
        { status: 400 }
      )
    }

    // Hash password with higher cost factor for security
    const password_hash = await bcrypt.hash(password, 12)

    // Insert new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: sanitizedEmail,
        password_hash,
        name: sanitizedName,
        phone: phone ? sanitizeInput(phone) : null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Register error:', error)
      return NextResponse.json(
        { error: 'ไม่สามารถสมัครสมาชิกได้' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'สมัครสมาชิกสำเร็จ',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
