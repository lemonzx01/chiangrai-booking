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
import { logger } from '../../lib/logger'
import { Booking, BookingType } from '@chiangrai/shared/types'
import { renderPartnerBookingNotificationEmail } from './templates/partnerBookingNotification'
import { renderAdminBookingNotificationEmail } from './templates/adminBookingNotification'

/**
 * ส่งอีเมลแจ้งเตือน Partner เมื่อมีการจองรถ/โรงแรม
 *
 * @param ownerId - รหัสเจ้าของ (user ID)
 * @param booking - ข้อมูลการจอง (รองรับทั้ง Booking interface และ database row)
 */
export async function sendPartnerBookingNotification(
  ownerId: string,
  booking: Booking | { booking_type: BookingType | string; [key: string]: any }
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
      logger.error('partner notification: owner fetch failed', { ownerId, error: ownerError })
      return
    }

    // หาข้อมูลรถหรือโรงแรม
    const item = booking.hotel || booking.car
    const itemName = item?.name_th || item?.name_en || 'รายการ'

    const { subject, html } = renderPartnerBookingNotificationEmail({
      ownerName: owner.name,
      bookingCode: booking.booking_code,
      itemName,
      bookingType: booking.booking_type,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone || null,
      checkIn: booking.check_in_date,
      checkOut: booking.check_out_date,
      totalPrice: booking.total_price,
      currency: booking.currency,
    })

    await sendEmail({ to: owner.email, subject, html })

    logger.info('partner notification sent', { to: owner.email })
  } catch (error) {
    logger.error('partner notification failed', { error })
    // ไม่ throw error เพื่อไม่ให้กระทบ payment flow
  }
}

/**
 * ส่งอีเมลแจ้งเตือน Admin เมื่อมีการจอง
 *
 * @param booking - ข้อมูลการจอง (รองรับทั้ง Booking interface และ database row)
 */
export async function sendAdminBookingNotification(
  booking: Booking | { booking_type: BookingType | string; [key: string]: any }
): Promise<void> {
  try {
    const supabase = await createAdminClient()

    // ดึงรายการ admin ทั้งหมด
    const { data: admins, error: adminError } = await supabase
      .from('admins')
      .select('email, name')
      .eq('is_active', true)

    if (adminError || !admins || admins.length === 0) {
      logger.error('admin notification: admins fetch failed', { error: adminError })
      return
    }

    // หาข้อมูลรถหรือโรงแรม
    const item = booking.hotel || booking.car
    const itemName = item?.name_th || item?.name_en || 'รายการ'

    const { subject, html } = renderAdminBookingNotificationEmail({
      bookingCode: booking.booking_code,
      itemName,
      bookingType: booking.booking_type,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone || null,
      checkIn: booking.check_in_date,
      checkOut: booking.check_out_date,
      totalPrice: booking.total_price,
      currency: booking.currency,
    })

    // ส่งอีเมลให้ admin ทุกคน
    await Promise.all(
      admins.map((admin: any) => sendEmail({ to: admin.email, subject, html }))
    )

    logger.info('admin notifications sent', { count: admins.length })
  } catch (error) {
    logger.error('admin notification failed', { error })
    // ไม่ throw error เพื่อไม่ให้กระทบ payment flow
  }
}
