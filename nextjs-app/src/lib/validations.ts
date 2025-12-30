import { z } from 'zod'

// Booking Form Validation
export const bookingFormSchema = z.object({
  booking_type: z.enum(['HOTEL', 'CAR', 'COMBO']),
  hotel_id: z.string().uuid().optional(),
  car_id: z.string().uuid().optional(),
  check_in_date: z.string().min(1, 'กรุณาเลือกวันเช็คอิน'),
  check_out_date: z.string().min(1, 'กรุณาเลือกวันเช็คเอาท์'),
  number_of_guests: z.number().min(1, 'ต้องมีผู้เข้าพักอย่างน้อย 1 คน'),
  customer_name: z.string().min(2, 'กรุณากรอกชื่อ'),
  customer_email: z.string().email('อีเมลไม่ถูกต้อง'),
  customer_phone: z.string().min(9, 'เบอร์โทรไม่ถูกต้อง'),
  customer_line: z.string().optional(),
  special_requests: z.string().optional(),
}).refine(data => {
  // Validate that at least one of hotel_id or car_id is provided
  if (data.booking_type === 'HOTEL' && !data.hotel_id) return false
  if (data.booking_type === 'CAR' && !data.car_id) return false
  if (data.booking_type === 'COMBO' && (!data.hotel_id || !data.car_id)) return false
  return true
}, {
  message: 'กรุณาเลือกโรงแรมหรือรถที่ต้องการจอง'
})

// Hotel Form Validation
export const hotelFormSchema = z.object({
  name_th: z.string().min(2, 'กรุณากรอกชื่อโรงแรม (ภาษาไทย)'),
  name_en: z.string().min(2, 'กรุณากรอกชื่อโรงแรม (ภาษาอังกฤษ)'),
  description_th: z.string().min(10, 'กรุณากรอกรายละเอียด (ภาษาไทย)'),
  description_en: z.string().min(10, 'กรุณากรอกรายละเอียด (ภาษาอังกฤษ)'),
  location: z.string().min(2, 'กรุณากรอกที่ตั้ง'),
  star_rating: z.number().min(1).max(5),
  price_per_night: z.number().min(1, 'ราคาต้องมากกว่า 0'),
  max_guests: z.number().min(1).max(20),
  room_type_th: z.string().min(2, 'กรุณากรอกประเภทห้อง (ภาษาไทย)'),
  room_type_en: z.string().min(2, 'กรุณากรอกประเภทห้อง (ภาษาอังกฤษ)'),
  amenities_th: z.array(z.string()),
  amenities_en: z.array(z.string()),
  images: z.array(z.string().url()),
  is_active: z.boolean(),
})

// Car Form Validation
export const carFormSchema = z.object({
  name_th: z.string().min(2, 'กรุณากรอกชื่อรถ (ภาษาไทย)'),
  name_en: z.string().min(2, 'กรุณากรอกชื่อรถ (ภาษาอังกฤษ)'),
  description_th: z.string().min(10, 'กรุณากรอกรายละเอียด (ภาษาไทย)'),
  description_en: z.string().min(10, 'กรุณากรอกรายละเอียด (ภาษาอังกฤษ)'),
  car_type_th: z.string().min(2, 'กรุณากรอกประเภทรถ (ภาษาไทย)'),
  car_type_en: z.string().min(2, 'กรุณากรอกประเภทรถ (ภาษาอังกฤษ)'),
  max_passengers: z.number().min(1).max(50),
  price_per_day: z.number().min(1, 'ราคาต้องมากกว่า 0'),
  includes_th: z.array(z.string()),
  includes_en: z.array(z.string()),
  images: z.array(z.string().url()),
  is_active: z.boolean(),
})

// Admin Login Validation
export const adminLoginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
})

// Contact Form Validation
export const contactFormSchema = z.object({
  name: z.string().min(2, 'กรุณากรอกชื่อ'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  phone: z.string().optional(),
  message: z.string().min(10, 'กรุณากรอกข้อความอย่างน้อย 10 ตัวอักษร'),
})

// Checkout Validation
export const checkoutSchema = z.object({
  booking_id: z.string().uuid(),
  success_url: z.string().url(),
  cancel_url: z.string().url(),
})

// Type exports
export type BookingFormInput = z.infer<typeof bookingFormSchema>
export type HotelFormInput = z.infer<typeof hotelFormSchema>
export type CarFormInput = z.infer<typeof carFormSchema>
export type AdminLoginInput = z.infer<typeof adminLoginSchema>
export type ContactFormInput = z.infer<typeof contactFormSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
