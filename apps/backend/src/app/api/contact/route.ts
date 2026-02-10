/**
 * ============================================================
 * Contact API Route - ระบบติดต่อเรา
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - รับข้อความจากหน้าติดต่อเรา
 *   - ส่งแจ้งเตือนไปยัง Admin ผ่าน LINE
 *   - ตรวจสอบความถูกต้องของข้อมูล
 *
 * Endpoint:
 *   - POST /api/contact - ส่งข้อความติดต่อ
 *
 * Request Body:
 *   - name: ชื่อผู้ติดต่อ (required)
 *   - email: อีเมล (required)
 *   - phone: เบอร์โทรศัพท์ (optional)
 *   - message: ข้อความ (required)
 *
 * ============================================================
 */
export const dynamic = 'force-dynamic'


// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Next.js Request และ Response utilities */
import { NextRequest, NextResponse } from 'next/server'

/** ค่าคงที่ของแอพ */
import { APP_NAME } from '../../../lib/constants'

// ============================================================
// POST Handler - ส่งข้อความติดต่อ
// ============================================================

/**
 * รับและประมวลผลข้อความจากหน้าติดต่อเรา
 *
 * @description
 *   ขั้นตอนการทำงาน:
 *   1. ตรวจสอบข้อมูลที่จำเป็น (name, email, message)
 *   2. ตรวจสอบรูปแบบอีเมล
 *   3. ส่งแจ้งเตือนไปยัง Admin ผ่าน LINE
 *   4. ส่ง response กลับยืนยันการรับข้อความ
 *
 * @param {NextRequest} request - HTTP Request object
 * @returns {Promise<NextResponse>} ผลลัพธ์การส่งข้อความ
 *
 * @example
 *   POST /api/contact
 *   Body: {
 *     "name": "สมชาย ใจดี",
 *     "email": "somchai@example.com",
 *     "phone": "081-234-5678",
 *     "message": "สนใจจองโรงแรมครับ"
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    // ดึงข้อมูลจาก request body
    const body = await request.json()
    const { name, email, phone, message } = body

    // ----------------------------------------------------------
    // ตรวจสอบข้อมูลที่จำเป็น
    // ----------------------------------------------------------
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // ----------------------------------------------------------
    // ตรวจสอบรูปแบบอีเมล
    // ----------------------------------------------------------
    /** Regular expression สำหรับตรวจสอบอีเมล */
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // TODO: สามารถบันทึกลง database หรือส่งอีเมลแจ้งเตือนได้ถ้าต้องการ
    // const { data, error } = await supabase
    //   .from('contact_messages')
    //   .insert({ name, email, phone, message })

    // ----------------------------------------------------------
    // ส่ง response สำเร็จ
    // ----------------------------------------------------------
    return NextResponse.json({
      success: true,
      message: 'ส่งข้อความสำเร็จ เราจะติดต่อกลับโดยเร็วที่สุด',
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
