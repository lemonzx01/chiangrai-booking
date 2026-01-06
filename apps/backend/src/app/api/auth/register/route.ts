/**
 * ============================================================
 * Auth Register API Route - สมัครสมาชิก
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - สมัครสมาชิกสำหรับผู้ใช้ใหม่
 *   - ตรวจสอบความถูกต้องและความปลอดภัยของรหัสผ่าน
 *   - ป้องกัน email ซ้ำ
 *
 * Endpoint:
 *   - POST /api/auth/register - สมัครสมาชิก
 *
 * Request Body:
 *   - email: อีเมล (required)
 *   - password: รหัสผ่าน (required)
 *   - name: ชื่อผู้ใช้ (required)
 *   - phone: เบอร์โทรศัพท์ (optional)
 *
 * Validations:
 *   - รหัสผ่านต้องมีความยาวขั้นต่ำ 8 ตัวอักษร
 *   - รหัสผ่านต้องมีตัวเลข ตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่
 *   - ชื่อต้องไม่เกิน 100 ตัวอักษร
 *   - Sanitize input เพื่อป้องกัน XSS
 *
 * Security:
 *   - Password hashing ด้วย bcrypt (cost factor 12)
 *   - Input sanitization
 *   - Email uniqueness check
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase Admin client สำหรับ Server-side */
import { createAdminClient } from '../../../../lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** Library สำหรับ hash password */
import bcrypt from 'bcryptjs'

/** ฟังก์ชันตรวจสอบ Mock Mode */
import { isMockMode } from '../../../../lib/auth'

/** ฟังก์ชันจัดการข้อมูล Mock */
import { findMockUser, addMockUser } from '../../../../lib/mock-data'

/** ฟังก์ชัน Utility สำหรับ validation */
import { validatePassword, sanitizeInput } from '../../../../lib/utils'

/** Type สำหรับข้อมูล User */
import type { User } from '@chiangrai/shared/types'

// ============================================================
// POST Handler - สมัครสมาชิก
// ============================================================

/**
 * สมัครสมาชิกสำหรับผู้ใช้ใหม่
 *
 * @description
 *   ขั้นตอนการทำงาน:
 *   1. ตรวจสอบข้อมูลที่จำเป็น
 *   2. Sanitize input เพื่อป้องกัน XSS
 *   3. ตรวจสอบความปลอดภัยของรหัสผ่าน
 *   4. ตรวจสอบรูปแบบอีเมล
 *   5. ตรวจสอบว่าอีเมลไม่ซ้ำ
 *   6. Hash password และบันทึกข้อมูล
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} ข้อมูล user ที่สมัครใหม่
 *
 * @example
 *   POST /api/auth/register
 *   Body: {
 *     "email": "newuser@example.com",
 *     "password": "SecurePass123!",
 *     "name": "สมชาย ใจดี",
 *     "phone": "081-234-5678"
 *   }
 */
export async function POST(request: Request) {
  try {
    // ดึงข้อมูลจาก request body
    const body = await request.json()
    const { email, password, name, phone } = body

    // ----------------------------------------------------------
    // ตรวจสอบข้อมูลที่จำเป็น
    // ----------------------------------------------------------
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'กรุณากรอกอีเมล รหัสผ่าน และชื่อ' },
        { status: 400 }
      )
    }

    // ----------------------------------------------------------
    // Sanitize Input เพื่อป้องกัน XSS
    // ----------------------------------------------------------
    const sanitizedName = sanitizeInput(name)
    const sanitizedEmail = email.toLowerCase().trim()

    // ----------------------------------------------------------
    // ตรวจสอบความปลอดภัยของรหัสผ่าน
    // ----------------------------------------------------------
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

    // ----------------------------------------------------------
    // ตรวจสอบรูปแบบอีเมล
    // ----------------------------------------------------------
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // ----------------------------------------------------------
    // ตรวจสอบความยาวชื่อ
    // ----------------------------------------------------------
    if (sanitizedName.length > 100) {
      return NextResponse.json(
        { error: 'ชื่อยาวเกินไป (สูงสุด 100 ตัวอักษร)' },
        { status: 400 }
      )
    }

    // ============================================================
    // Mock Mode: ใช้ข้อมูลจำลอง
    // ============================================================
    if (isMockMode()) {
      // ตรวจสอบว่าอีเมลไม่ซ้ำ
      const existingUser = findMockUser(sanitizedEmail)
      if (existingUser) {
        return NextResponse.json(
          { error: 'อีเมลนี้ถูกใช้งานแล้ว' },
          { status: 400 }
        )
      }

      // Hash password ด้วย cost factor 12 (เพิ่มความปลอดภัย)
      const password_hash = await bcrypt.hash(password, 12)

      // สร้าง user ใหม่
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

      // เพิ่มเข้า mock data
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

    // ============================================================
    // Production Mode: ใช้ Supabase
    // ============================================================
    const supabase = await createAdminClient()

    // ----------------------------------------------------------
    // ตรวจสอบว่าอีเมลไม่ซ้ำ
    // ----------------------------------------------------------
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

    // ----------------------------------------------------------
    // Hash password และบันทึกข้อมูล
    // ----------------------------------------------------------
    const password_hash = await bcrypt.hash(password, 12)

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

    // ตรวจสอบ Error
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
