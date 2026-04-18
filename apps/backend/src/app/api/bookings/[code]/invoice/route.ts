/**
 * ============================================================
 * Invoice API Route - สร้างใบเสร็จรับเงิน PDF
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - สร้างใบเสร็จรับเงินในรูปแบบ PDF
 *   - แสดงข้อมูลการจอง ลูกค้า และบริการที่จอง
 *   - รองรับทั้งการจองโรงแรมและรถเช่า
 *
 * Endpoint:
 *   - GET /api/bookings/[code]/invoice - ดาวน์โหลด PDF ใบเสร็จ
 *
 * Response:
 *   - Content-Type: application/pdf
 *   - Content-Disposition: attachment (ดาวน์โหลดไฟล์)
 *
 * Dependencies:
 *   - jsPDF: สำหรับสร้างเอกสาร PDF
 *
 * ============================================================
 */
export const dynamic = 'force-dynamic'


// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase client สำหรับ Server-side */
import { createClient } from '../../../../../lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** Library สำหรับสร้าง PDF */
import { jsPDF } from 'jspdf'

/** Thai font registration for jsPDF */
import { registerThaiFont, fontForWeight } from '../../../../../lib/pdf-fonts'

/** ฟังก์ชันตรวจสอบ Mock Mode */
import { isMockMode } from '../../../../../lib/auth'

/** ข้อมูล Mock สำหรับการทดสอบ */
import { findMockBookingByCode } from '../../../../../lib/mock-data'

/** ข้อมูลติดต่อบริษัท */
import { CONTACT_INFO } from '../../../../../lib/constants'

/** Type สำหรับข้อมูลการจอง */
import type { Booking } from '@chiangrai/shared/types'
import { logger } from '../../../../../lib/logger'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Interface สำหรับ Dynamic Route Parameters
 *
 * @interface Params
 * @property {Promise<{ code: string }>} params - Promise ที่มีรหัสการจอง
 */
interface Params {
  params: Promise<{ code: string }>
}

// ============================================================
// GET Handler - สร้างใบเสร็จ PDF
// ============================================================

/**
 * สร้างใบเสร็จรับเงินในรูปแบบ PDF
 *
 * @description
 *   สร้าง PDF ที่ประกอบด้วย:
 *   - Header: ชื่อบริษัท และหัวข้อ Invoice
 *   - Booking Info: รหัสการจอง วันที่ สถานะ
 *   - Customer Info: ชื่อ อีเมล เบอร์โทร LINE ID
 *   - Booking Details: วันเช็คอิน/เช็คเอาท์ จำนวนผู้เข้าพัก
 *   - Services Table: รายการบริการที่จอง พร้อมราคา
 *   - Total: ราคารวม
 *   - Footer: ข้อมูลติดต่อบริษัท
 *
 * @param {Request} request - HTTP Request object
 * @param {Params} params - Route parameters ที่มีรหัสการจอง
 * @returns {Promise<NextResponse>} PDF file หรือ error
 *
 * @example
 *   GET /api/bookings/BK-ABC123/invoice
 *   // Returns: PDF file download
 */
export async function GET(request: Request, { params }: Params) {
  try {
    // ดึงรหัสการจองจาก params
    const { code } = await params

    /** ข้อมูลการจอง */
    let booking: Booking | null = null

    // ----------------------------------------------------------
    // ดึงข้อมูลการจอง
    // ----------------------------------------------------------

    // Mock Mode: ใช้ข้อมูลจำลอง
    if (isMockMode()) {
      const mockBooking = findMockBookingByCode(code)
      if (mockBooking) {
        booking = mockBooking
      }
    } else {
      // Production Mode: ดึงจาก Supabase
      const supabase = await createClient()
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          hotel:hotels(*),
          car:cars(*)
        `)
        .eq('booking_code', code)
        .single()

      if (data) {
        booking = data as Booking
      }
    }

    // ตรวจสอบว่าพบการจองหรือไม่
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // ----------------------------------------------------------
    // สร้างเอกสาร PDF
    // ----------------------------------------------------------
    const pdf = new jsPDF({
      orientation: 'portrait', // แนวตั้ง
      unit: 'mm', // หน่วยมิลลิเมตร
      format: 'a4', // ขนาด A4
    })

    // Register Thai font if the TTF is present in public/fonts/.
    // See apps/backend/public/fonts/README.md for setup.
    const thai = await registerThaiFont(pdf)
    const setWeight = (w: 'normal' | 'bold') => {
      const [family, style] = fontForWeight(thai, w)
      pdf.setFont(family, style)
    }

    // Prefer Thai strings when the font is available, English otherwise.
    const hotel = booking.hotel as
      | { name_th?: string; name_en: string; room_type_th?: string; room_type_en: string; price_per_night: number }
      | undefined
    const car = booking.car as
      | { name_th?: string; name_en: string; car_type_th?: string; car_type_en: string; price_per_day: number }
      | undefined
    const hotelName = thai.enabled && hotel?.name_th ? hotel.name_th : hotel?.name_en
    const hotelRoom = thai.enabled && hotel?.room_type_th ? hotel.room_type_th : hotel?.room_type_en
    const carName = thai.enabled && car?.name_th ? car.name_th : car?.name_en
    const carType = thai.enabled && car?.car_type_th ? car.car_type_th : car?.car_type_en

    /** ความกว้างหน้า */
    const pageWidth = pdf.internal.pageSize.getWidth()

    /** ตำแหน่ง Y ปัจจุบัน (เลื่อนลงเรื่อยๆ) */
    let y = 20

    // ----------------------------------------------------------
    // Header Section
    // ----------------------------------------------------------
    pdf.setFontSize(24)
    setWeight('bold')
    pdf.text('Got Journey Thailand', pageWidth / 2, y, { align: 'center' })
    y += 10

    pdf.setFontSize(14)
    setWeight('normal')
    pdf.text(
      thai.enabled ? 'ใบเสร็จรับเงิน / Invoice' : 'Invoice / Receipt',
      pageWidth / 2,
      y,
      { align: 'center' }
    )
    y += 15

    // ----------------------------------------------------------
    // Booking Info Box (กล่องข้อมูลการจอง)
    // ----------------------------------------------------------
    pdf.setDrawColor(200, 200, 200) // สีเส้นขอบ
    pdf.setFillColor(249, 250, 251) // สีพื้นหลัง
    pdf.roundedRect(15, y, pageWidth - 30, 25, 3, 3, 'FD') // วาดกล่อง

    // รหัสการจอง
    pdf.setFontSize(12)
    setWeight('bold')
    pdf.text(thai.enabled ? 'รหัสการจอง:' : 'Booking Code:', 20, y + 10)
    setWeight('normal')
    pdf.text(booking.booking_code, 60, y + 10)

    // วันที่สร้างการจอง
    setWeight('bold')
    pdf.text(thai.enabled ? 'วันที่:' : 'Date:', 20, y + 18)
    setWeight('normal')
    pdf.text(new Date(booking.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }), 60, y + 18)

    // สถานะการจอง (ด้านขวา)
    const statusText = booking.status
    setWeight('bold')
    pdf.text(`Status: ${statusText}`, pageWidth - 20, y + 14, { align: 'right' })

    y += 35

    // ----------------------------------------------------------
    // Customer Information Section
    // ----------------------------------------------------------
    pdf.setFontSize(14)
    setWeight('bold')
    pdf.text(thai.enabled ? 'ข้อมูลลูกค้า' : 'Customer Information', 15, y)
    y += 8

    pdf.setFontSize(11)
    setWeight('normal')
    pdf.text(
      `${thai.enabled ? 'ชื่อ' : 'Name'}: ${booking.customer_name}`,
      15,
      y
    )
    y += 6
    pdf.text(
      `${thai.enabled ? 'อีเมล' : 'Email'}: ${booking.customer_email}`,
      15,
      y
    )
    y += 6
    pdf.text(
      `${thai.enabled ? 'เบอร์โทร' : 'Phone'}: ${booking.customer_phone}`,
      15,
      y
    )
    y += 12

    // ----------------------------------------------------------
    // Booking Details Section
    // ----------------------------------------------------------
    pdf.setFontSize(14)
    setWeight('bold')
    pdf.text(thai.enabled ? 'รายละเอียดการจอง' : 'Booking Details', 15, y)
    y += 8

    pdf.setFontSize(11)
    setWeight('normal')

    // จัดรูปแบบวันที่
    const checkInDate = new Date(booking.check_in_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const checkOutDate = new Date(booking.check_out_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    pdf.text(`${thai.enabled ? 'เช็คอิน' : 'Check-in'}: ${checkInDate}`, 15, y)
    y += 6
    pdf.text(`${thai.enabled ? 'เช็คเอาท์' : 'Check-out'}: ${checkOutDate}`, 15, y)
    y += 6
    pdf.text(
      `${thai.enabled ? 'ผู้เข้าพัก' : 'Guests'}: ${booking.number_of_guests}`,
      15,
      y
    )
    y += 12

    // ----------------------------------------------------------
    // Services Table Section
    // ----------------------------------------------------------
    pdf.setFontSize(14)
    setWeight('bold')
    pdf.text(thai.enabled ? 'บริการ' : 'Services', 15, y)
    y += 8

    // Table Header (หัวตาราง)
    pdf.setFillColor(79, 70, 229) // สี indigo-600
    pdf.setTextColor(255, 255, 255) // สีขาว
    pdf.rect(15, y, pageWidth - 30, 8, 'F')
    pdf.setFontSize(10)
    pdf.text(thai.enabled ? 'รายการ' : 'Description', 20, y + 5.5)
    pdf.text(thai.enabled ? 'จำนวนเงิน' : 'Amount', pageWidth - 20, y + 5.5, { align: 'right' })
    y += 8

    pdf.setTextColor(0, 0, 0) // กลับเป็นสีดำ
    setWeight('normal')

    // ----------------------------------------------------------
    // Hotel Row (แถวโรงแรม)
    // ----------------------------------------------------------
    if (hotel) {
      pdf.setFillColor(249, 250, 251)
      pdf.rect(15, y, pageWidth - 30, 12, 'F')
      pdf.text(`${thai.enabled ? 'โรงแรม' : 'Hotel'}: ${hotelName}`, 20, y + 5)

      // ประเภทห้อง (ตัวเล็กสีเทา)
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`${hotelRoom}`, 20, y + 9)
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)

      // คำนวณราคา
      const hotelPrice = hotel.price_per_night
      const nights = Math.ceil(
        (new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24)
      )
      pdf.text(
        `${hotelPrice.toLocaleString()} THB x ${nights} ${thai.enabled ? 'คืน' : 'nights'}`,
        pageWidth - 20,
        y + 7,
        { align: 'right' }
      )
      y += 12
    }

    // ----------------------------------------------------------
    // Car Row (แถวรถเช่า)
    // ----------------------------------------------------------
    if (car) {
      pdf.setFillColor(255, 255, 255)
      pdf.rect(15, y, pageWidth - 30, 12, 'F')
      pdf.text(`${thai.enabled ? 'รถ' : 'Car'}: ${carName}`, 20, y + 5)

      // ประเภทรถ (ตัวเล็กสีเทา)
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`${carType}`, 20, y + 9)
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)

      // คำนวณราคา
      const carPrice = car.price_per_day
      const days = Math.ceil(
        (new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24)
      )
      pdf.text(
        `${carPrice.toLocaleString()} THB x ${days} ${thai.enabled ? 'วัน' : 'days'}`,
        pageWidth - 20,
        y + 7,
        { align: 'right' }
      )
      y += 12
    }

    // ----------------------------------------------------------
    // Total Section (ราคารวม)
    // ----------------------------------------------------------
    y += 5
    pdf.setDrawColor(200, 200, 200)
    pdf.line(15, y, pageWidth - 15, y) // เส้นคั่น
    y += 8

    pdf.setFontSize(14)
    setWeight('bold')
    pdf.text(thai.enabled ? 'รวม:' : 'Total:', 15, y)
    pdf.setTextColor(79, 70, 229) // สี indigo-600
    pdf.text(`${booking.total_price.toLocaleString()} THB`, pageWidth - 20, y, { align: 'right' })
    pdf.setTextColor(0, 0, 0)

    // ----------------------------------------------------------
    // Special Requests (ถ้ามี)
    // ----------------------------------------------------------
    if (booking.special_requests) {
      y += 15
      pdf.setFontSize(12)
      setWeight('bold')
      pdf.text(thai.enabled ? 'คำขอพิเศษ:' : 'Special Requests:', 15, y)
      y += 6
      pdf.setFontSize(10)
      setWeight('normal')

      // ตัดข้อความให้พอดีกับความกว้าง
      const splitText = pdf.splitTextToSize(booking.special_requests, pageWidth - 40)
      pdf.text(splitText, 15, y)
    }

    // ----------------------------------------------------------
    // Footer Section
    // ----------------------------------------------------------
    y = pdf.internal.pageSize.getHeight() - 30
    pdf.setDrawColor(200, 200, 200)
    pdf.line(15, y, pageWidth - 15, y) // เส้นคั่น
    y += 8

    pdf.setFontSize(9)
    pdf.setTextColor(100, 100, 100)
    setWeight('normal')
    pdf.text('Got Journey Thailand', pageWidth / 2, y, { align: 'center' })
    y += 4
    pdf.text(CONTACT_INFO.email + ' | ' + CONTACT_INFO.phone, pageWidth / 2, y, { align: 'center' })
    y += 4
    pdf.text(
      thai.enabled ? 'ขอบคุณที่ใช้บริการ' : 'Thank you for choosing us!',
      pageWidth / 2,
      y,
      { align: 'center' }
    )

    // ----------------------------------------------------------
    // ส่งออก PDF
    // ----------------------------------------------------------
    const pdfBuffer = pdf.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${booking.booking_code}.pdf"`,
      },
    })
  } catch (error) {
    logger.error('Generate invoice error', { error })
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}
