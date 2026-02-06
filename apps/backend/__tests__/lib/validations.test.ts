import { describe, it, expect } from 'vitest'
import {
  bookingFormSchema,
  hotelFormSchema,
  carFormSchema,
  adminLoginSchema,
  contactFormSchema,
  checkoutSchema,
} from '@/lib/validations'

// ============================================================
// bookingFormSchema
// ============================================================
describe('bookingFormSchema', () => {
  const validHotelBooking = {
    booking_type: 'HOTEL' as const,
    hotel_id: '550e8400-e29b-41d4-a716-446655440000',
    check_in_date: '2024-01-15',
    check_out_date: '2024-01-18',
    number_of_guests: 2,
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '0812345678',
  }

  it('should accept valid HOTEL booking', () => {
    const result = bookingFormSchema.safeParse(validHotelBooking)
    expect(result.success).toBe(true)
  })

  it('should accept valid CAR booking', () => {
    const result = bookingFormSchema.safeParse({
      ...validHotelBooking,
      booking_type: 'CAR',
      hotel_id: undefined,
      car_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('should accept valid COMBO booking', () => {
    const result = bookingFormSchema.safeParse({
      ...validHotelBooking,
      booking_type: 'COMBO',
      car_id: '660e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('should reject HOTEL booking without hotel_id', () => {
    const result = bookingFormSchema.safeParse({
      ...validHotelBooking,
      hotel_id: undefined,
    })
    expect(result.success).toBe(false)
  })

  it('should reject CAR booking without car_id', () => {
    const result = bookingFormSchema.safeParse({
      ...validHotelBooking,
      booking_type: 'CAR',
      hotel_id: undefined,
    })
    expect(result.success).toBe(false)
  })

  it('should reject COMBO booking without car_id', () => {
    const result = bookingFormSchema.safeParse({
      ...validHotelBooking,
      booking_type: 'COMBO',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid booking_type', () => {
    const result = bookingFormSchema.safeParse({
      ...validHotelBooking,
      booking_type: 'INVALID',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty customer_name', () => {
    const result = bookingFormSchema.safeParse({
      ...validHotelBooking,
      customer_name: '',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid email', () => {
    const result = bookingFormSchema.safeParse({
      ...validHotelBooking,
      customer_email: 'not-email',
    })
    expect(result.success).toBe(false)
  })

  it('should reject too short phone', () => {
    const result = bookingFormSchema.safeParse({
      ...validHotelBooking,
      customer_phone: '123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject 0 guests', () => {
    const result = bookingFormSchema.safeParse({
      ...validHotelBooking,
      number_of_guests: 0,
    })
    expect(result.success).toBe(false)
  })

  it('should accept optional special_requests', () => {
    const result = bookingFormSchema.safeParse({
      ...validHotelBooking,
      special_requests: 'Late check-in',
    })
    expect(result.success).toBe(true)
  })

  it('should accept optional currency', () => {
    const result = bookingFormSchema.safeParse({
      ...validHotelBooking,
      currency: 'USD',
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================
// hotelFormSchema
// ============================================================
describe('hotelFormSchema', () => {
  const validHotel = {
    name_th: 'โรงแรมทดสอบ',
    name_en: 'Test Hotel',
    description_th: 'รายละเอียดโรงแรมทดสอบภาษาไทย',
    description_en: 'Test hotel description in English',
    location: 'Chiang Rai',
    star_rating: 4,
    price_per_night: 2500,
    max_guests: 4,
    room_type_th: 'ห้องดีลักซ์',
    room_type_en: 'Deluxe Room',
    amenities_th: ['สระว่ายน้ำ', 'ฟิตเนส'],
    amenities_en: ['Swimming Pool', 'Fitness'],
    images: ['https://example.com/img1.jpg'],
    is_active: true,
  }

  it('should accept valid hotel data', () => {
    const result = hotelFormSchema.safeParse(validHotel)
    expect(result.success).toBe(true)
  })

  it('should reject star_rating > 5', () => {
    const result = hotelFormSchema.safeParse({ ...validHotel, star_rating: 6 })
    expect(result.success).toBe(false)
  })

  it('should reject star_rating < 1', () => {
    const result = hotelFormSchema.safeParse({ ...validHotel, star_rating: 0 })
    expect(result.success).toBe(false)
  })

  it('should reject max_guests > 20', () => {
    const result = hotelFormSchema.safeParse({ ...validHotel, max_guests: 21 })
    expect(result.success).toBe(false)
  })

  it('should reject empty name_th', () => {
    const result = hotelFormSchema.safeParse({ ...validHotel, name_th: '' })
    expect(result.success).toBe(false)
  })

  it('should reject short description_en', () => {
    const result = hotelFormSchema.safeParse({ ...validHotel, description_en: 'short' })
    expect(result.success).toBe(false)
  })

  it('should reject price_per_night of 0', () => {
    const result = hotelFormSchema.safeParse({ ...validHotel, price_per_night: 0 })
    expect(result.success).toBe(false)
  })

  it('should reject invalid image URL', () => {
    const result = hotelFormSchema.safeParse({ ...validHotel, images: ['not-a-url'] })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// carFormSchema
// ============================================================
describe('carFormSchema', () => {
  const validCar = {
    name_th: 'รถทดสอบ',
    name_en: 'Test Car',
    description_th: 'รายละเอียดรถทดสอบภาษาไทยยาวพอ',
    description_en: 'Test car description in English long enough',
    car_type_th: 'ซีดาน',
    car_type_en: 'Sedan',
    max_passengers: 4,
    price_per_day: 1500,
    includes_th: ['น้ำมัน', 'ประกัน'],
    includes_en: ['Gas', 'Insurance'],
    images: ['https://example.com/car1.jpg'],
    is_active: true,
  }

  it('should accept valid car data', () => {
    const result = carFormSchema.safeParse(validCar)
    expect(result.success).toBe(true)
  })

  it('should reject max_passengers > 50', () => {
    const result = carFormSchema.safeParse({ ...validCar, max_passengers: 51 })
    expect(result.success).toBe(false)
  })

  it('should reject max_passengers < 1', () => {
    const result = carFormSchema.safeParse({ ...validCar, max_passengers: 0 })
    expect(result.success).toBe(false)
  })

  it('should reject empty car_type_th', () => {
    const result = carFormSchema.safeParse({ ...validCar, car_type_th: '' })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// adminLoginSchema
// ============================================================
describe('adminLoginSchema', () => {
  it('should accept valid login', () => {
    const result = adminLoginSchema.safeParse({
      email: 'admin@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const result = adminLoginSchema.safeParse({
      email: 'not-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject short password', () => {
    const result = adminLoginSchema.safeParse({
      email: 'admin@example.com',
      password: '12345',
    })
    expect(result.success).toBe(false)
  })

  it('should accept password of exactly 6 chars', () => {
    const result = adminLoginSchema.safeParse({
      email: 'admin@example.com',
      password: '123456',
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================
// contactFormSchema
// ============================================================
describe('contactFormSchema', () => {
  it('should accept valid contact form', () => {
    const result = contactFormSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'This is a test message that is long enough',
    })
    expect(result.success).toBe(true)
  })

  it('should accept optional phone', () => {
    const result = contactFormSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      phone: '0812345678',
      message: 'Long enough message here',
    })
    expect(result.success).toBe(true)
  })

  it('should reject short message', () => {
    const result = contactFormSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      message: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty name', () => {
    const result = contactFormSchema.safeParse({
      name: '',
      email: 'john@example.com',
      message: 'Long enough message here',
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// checkoutSchema
// ============================================================
describe('checkoutSchema', () => {
  it('should accept valid checkout data', () => {
    const result = checkoutSchema.safeParse({
      booking_id: '550e8400-e29b-41d4-a716-446655440000',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    })
    expect(result.success).toBe(true)
  })

  it('should reject non-UUID booking_id', () => {
    const result = checkoutSchema.safeParse({
      booking_id: 'not-uuid',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid success_url', () => {
    const result = checkoutSchema.safeParse({
      booking_id: '550e8400-e29b-41d4-a716-446655440000',
      success_url: 'not-a-url',
      cancel_url: 'https://example.com/cancel',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid cancel_url', () => {
    const result = checkoutSchema.safeParse({
      booking_id: '550e8400-e29b-41d4-a716-446655440000',
      success_url: 'https://example.com/success',
      cancel_url: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })
})
