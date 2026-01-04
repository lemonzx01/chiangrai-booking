import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { isMockMode } from '@/lib/auth'
import { findMockBookingByCode } from '@/lib/mock-data'
import { CONTACT_INFO } from '@/lib/constants'
import type { Booking } from '@/types'

interface Params {
  params: Promise<{ code: string }>
}

// GET /api/bookings/[code]/invoice - Generate PDF invoice
export async function GET(request: Request, { params }: Params) {
  try {
    const { code } = await params

    let booking: Booking | null = null

    // Mock Mode
    if (isMockMode()) {
      const mockBooking = findMockBookingByCode(code)
      if (mockBooking) {
        booking = mockBooking
      }
    } else {
      // Production Mode: Use Supabase
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

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Generate PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    let y = 20

    // Header
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Got Journey Thailand', pageWidth / 2, y, { align: 'center' })
    y += 10

    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Invoice / Receipt', pageWidth / 2, y, { align: 'center' })
    y += 15

    // Booking Info Box
    pdf.setDrawColor(200, 200, 200)
    pdf.setFillColor(249, 250, 251)
    pdf.roundedRect(15, y, pageWidth - 30, 25, 3, 3, 'FD')

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Booking Code:', 20, y + 10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(booking.booking_code, 60, y + 10)

    pdf.setFont('helvetica', 'bold')
    pdf.text('Date:', 20, y + 18)
    pdf.setFont('helvetica', 'normal')
    pdf.text(new Date(booking.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }), 60, y + 18)

    // Status on right
    const statusText = booking.status
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Status: ${statusText}`, pageWidth - 20, y + 14, { align: 'right' })

    y += 35

    // Customer Info
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Customer Information', 15, y)
    y += 8

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Name: ${booking.customer_name}`, 15, y)
    y += 6
    pdf.text(`Email: ${booking.customer_email}`, 15, y)
    y += 6
    pdf.text(`Phone: ${booking.customer_phone}`, 15, y)
    if (booking.customer_line) {
      y += 6
      pdf.text(`Line ID: ${booking.customer_line}`, 15, y)
    }
    y += 12

    // Booking Details
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Booking Details', 15, y)
    y += 8

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')

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

    pdf.text(`Check-in: ${checkInDate}`, 15, y)
    y += 6
    pdf.text(`Check-out: ${checkOutDate}`, 15, y)
    y += 6
    pdf.text(`Guests: ${booking.number_of_guests}`, 15, y)
    y += 12

    // Service Details Table
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Services', 15, y)
    y += 8

    // Table Header
    pdf.setFillColor(79, 70, 229) // indigo-600
    pdf.setTextColor(255, 255, 255)
    pdf.rect(15, y, pageWidth - 30, 8, 'F')
    pdf.setFontSize(10)
    pdf.text('Description', 20, y + 5.5)
    pdf.text('Amount', pageWidth - 20, y + 5.5, { align: 'right' })
    y += 8

    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'normal')

    // Hotel Row
    if (booking.hotel) {
      pdf.setFillColor(249, 250, 251)
      pdf.rect(15, y, pageWidth - 30, 12, 'F')
      pdf.text(`Hotel: ${booking.hotel.name_en}`, 20, y + 5)
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`${booking.hotel.room_type_en}`, 20, y + 9)
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)

      const hotelPrice = booking.hotel.price_per_night
      const nights = Math.ceil(
        (new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24)
      )
      pdf.text(`${hotelPrice.toLocaleString()} THB x ${nights} nights`, pageWidth - 20, y + 7, { align: 'right' })
      y += 12
    }

    // Car Row
    if (booking.car) {
      pdf.setFillColor(255, 255, 255)
      pdf.rect(15, y, pageWidth - 30, 12, 'F')
      pdf.text(`Car: ${booking.car.name_en}`, 20, y + 5)
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`${booking.car.car_type_en}`, 20, y + 9)
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)

      const carPrice = booking.car.price_per_day
      const days = Math.ceil(
        (new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24)
      )
      pdf.text(`${carPrice.toLocaleString()} THB x ${days} days`, pageWidth - 20, y + 7, { align: 'right' })
      y += 12
    }

    // Total
    y += 5
    pdf.setDrawColor(200, 200, 200)
    pdf.line(15, y, pageWidth - 15, y)
    y += 8

    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Total:', 15, y)
    pdf.setTextColor(79, 70, 229) // indigo-600
    pdf.text(`${booking.total_price.toLocaleString()} THB`, pageWidth - 20, y, { align: 'right' })
    pdf.setTextColor(0, 0, 0)

    // Special Requests
    if (booking.special_requests) {
      y += 15
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Special Requests:', 15, y)
      y += 6
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      const splitText = pdf.splitTextToSize(booking.special_requests, pageWidth - 40)
      pdf.text(splitText, 15, y)
    }

    // Footer
    y = pdf.internal.pageSize.getHeight() - 30
    pdf.setDrawColor(200, 200, 200)
    pdf.line(15, y, pageWidth - 15, y)
    y += 8

    pdf.setFontSize(9)
    pdf.setTextColor(100, 100, 100)
    pdf.text('Got Journey Thailand', pageWidth / 2, y, { align: 'center' })
    y += 4
    pdf.text(CONTACT_INFO.email + ' | ' + CONTACT_INFO.phone, pageWidth / 2, y, { align: 'center' })
    y += 4
    pdf.text('Thank you for choosing us!', pageWidth / 2, y, { align: 'center' })

    // Generate PDF Buffer
    const pdfBuffer = pdf.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${booking.booking_code}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Generate invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}
