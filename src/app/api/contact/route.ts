import { NextRequest, NextResponse } from 'next/server'
import { sendLineNotification } from '@/services/notifications/line'
import { APP_NAME, CONTACT_INFO } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Send LINE notification to admin
    const lineMessage = `
📩 ${APP_NAME} - ข้อความใหม่จากหน้าติดต่อเรา

👤 ชื่อ: ${name}
📧 อีเมล: ${email}
📞 โทร: ${phone || 'ไม่ระบุ'}

💬 ข้อความ:
${message}
`

    await sendLineNotification(lineMessage)

    // TODO: You can also save to database here if needed
    // const { data, error } = await supabase
    //   .from('contact_messages')
    //   .insert({ name, email, phone, message })

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
