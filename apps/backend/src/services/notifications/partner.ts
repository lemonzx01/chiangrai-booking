/**
 * ============================================================
 * Partner Notification Service - แจ้งเตือน Partner
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ส่งอีเมลแจ้งเตือน Partner เมื่อมีการจองรถ/โรงแรมของตัวเอง
 *   - ส่งอีเมลแจ้งเตือน Admin เมื่อมีการจอง
 *
 * ============================================================
 */

import { createAdminClient } from '../../lib/supabase/server'
import { sendEmail } from './email'
import { Booking } from '@chiangrai/shared/types'

/**
 * ส่งอีเมลแจ้งเตือน Partner เมื่อมีการจองรถ/โรงแรม
 *
 * @param ownerId - รหัสเจ้าของ (user ID)
 * @param booking - ข้อมูลการจอง
 */
export async function sendPartnerBookingNotification(
  ownerId: string,
  booking: Booking
): Promise<void> {
  try {
    const supabase = await createAdminClient()

    // ดึงข้อมูล owner จาก users table
    const { data: owner, error: ownerError } = await supabase
      .from('users')
      .select('*')
      .eq('id', ownerId)
      .eq('role', 'partner')
      .single()

    if (ownerError || !owner) {
      console.error('Error fetching owner:', ownerError)
      return
    }

    // หาข้อมูลรถหรือโรงแรม
    const item = booking.hotel || booking.car
    const itemName = item?.name_th || item?.name_en || 'รายการ'

    // สร้างเนื้อหาอีเมล
    const subject = `มีการจองใหม่: ${itemName}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">มีการจองใหม่!</h2>
        <p>สวัสดีคุณ ${owner.name},</p>
        <p>มีลูกค้าจอง${booking.booking_type === 'HOTEL' ? 'โรงแรม' : 'รถเช่า'}ของคุณแล้ว:</p>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">รายละเอียดการจอง</h3>
          <p><strong>รหัสการจอง:</strong> ${booking.booking_code}</p>
          <p><strong>รายการ:</strong> ${itemName}</p>
          <p><strong>ลูกค้า:</strong> ${booking.customer_name}</p>
          <p><strong>อีเมล:</strong> ${booking.customer_email}</p>
          <p><strong>โทรศัพท์:</strong> ${booking.customer_phone}</p>
          <p><strong>วันที่:</strong> ${new Date(booking.check_in_date).toLocaleDateString('th-TH')} - ${new Date(booking.check_out_date).toLocaleDateString('th-TH')}</p>
          <p><strong>ราคารวม:</strong> ${booking.total_price.toLocaleString()} ${booking.currency}</p>
        </div>

        <p>กรุณาตรวจสอบและยืนยันการจองในระบบ</p>
        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          นี่เป็นอีเมลอัตโนมัติ กรุณาอย่าตอบกลับ
        </p>
      </div>
    `

    // ส่งอีเมล
    await sendEmail({
      to: owner.email,
      subject,
      html,
    })

    console.log(`Partner notification sent to ${owner.email}`)
  } catch (error) {
    console.error('Error sending partner notification:', error)
    // ไม่ throw error เพื่อไม่ให้กระทบ payment flow
  }
}

/**
 * ส่งอีเมลแจ้งเตือน Admin เมื่อมีการจอง
 *
 * @param booking - ข้อมูลการจอง
 */
export async function sendAdminBookingNotification(booking: Booking): Promise<void> {
  try {
    const supabase = await createAdminClient()

    // ดึงรายการ admin ทั้งหมด
    const { data: admins, error: adminError } = await supabase
      .from('admins')
      .select('email, name')
      .eq('is_active', true)

    if (adminError || !admins || admins.length === 0) {
      console.error('Error fetching admins:', adminError)
      return
    }

    // หาข้อมูลรถหรือโรงแรม
    const item = booking.hotel || booking.car
    const itemName = item?.name_th || item?.name_en || 'รายการ'

    // สร้างเนื้อหาอีเมล
    const subject = `มีการจองใหม่: ${booking.booking_code}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">มีการจองใหม่ในระบบ</h2>
        <p>มีลูกค้าจอง${booking.booking_type === 'HOTEL' ? 'โรงแรม' : 'รถเช่า'}แล้ว:</p>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">รายละเอียดการจอง</h3>
          <p><strong>รหัสการจอง:</strong> ${booking.booking_code}</p>
          <p><strong>รายการ:</strong> ${itemName}</p>
          <p><strong>ลูกค้า:</strong> ${booking.customer_name}</p>
          <p><strong>อีเมล:</strong> ${booking.customer_email}</p>
          <p><strong>โทรศัพท์:</strong> ${booking.customer_phone}</p>
          <p><strong>วันที่:</strong> ${new Date(booking.check_in_date).toLocaleDateString('th-TH')} - ${new Date(booking.check_out_date).toLocaleDateString('th-TH')}</p>
          <p><strong>ราคารวม:</strong> ${booking.total_price.toLocaleString()} ${booking.currency}</p>
        </div>

        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          นี่เป็นอีเมลอัตโนมัติ กรุณาอย่าตอบกลับ
        </p>
      </div>
    `

    // ส่งอีเมลให้ admin ทุกคน
    await Promise.all(
      admins.map((admin: any) =>
        sendEmail({
          to: admin.email,
          subject,
          html,
        })
      )
    )

    console.log(`Admin notifications sent to ${admins.length} admins`)
  } catch (error) {
    console.error('Error sending admin notification:', error)
    // ไม่ throw error เพื่อไม่ให้กระทบ payment flow
  }
}
