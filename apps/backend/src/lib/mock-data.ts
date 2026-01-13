import type { Admin, Booking, Payment, DashboardStats, User } from '@chiangrai/shared/types'
import { BookingStatus, BookingType, PaymentStatus, Currency } from '@chiangrai/shared/types'
import { MOCK_HOTELS, MOCK_CARS } from './constants'

// Mock Admin User
// Password: admin123
export const MOCK_ADMINS: Admin[] = [
  {
    id: 'mock-admin-1',
    email: 'admin@gotjourneythailand.com',
    password_hash: '$2b$10$lPt1AdU6oNLOjRAUACyK1OAdyxixtcOR3ZrsrbRC/MfuIYaXoZt6K',
    name: 'Admin User',
    role: 'admin',
    is_active: true,
    last_login: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    updated_at: new Date().toISOString(),
  },
]

// Mock Users (in-memory storage for demo)
// Password: user123
export const MOCK_USERS: User[] = [
  {
    id: 'mock-user-1',
    email: 'user@example.com',
    password_hash: '$2b$10$lPt1AdU6oNLOjRAUACyK1OAdyxixtcOR3ZrsrbRC/MfuIYaXoZt6K',
    name: 'ผู้ใช้ทดสอบ',
    phone: '+66 81 234 5678',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Helper to add new user (for mock mode)
export function addMockUser(user: User): User {
  MOCK_USERS.push(user)
  return user
}

// Helper to find user by email
export function findMockUser(email: string): User | undefined {
  return MOCK_USERS.find(user => user.email === email && user.is_active)
}

// Helper to find user by id
export function findMockUserById(id: string): User | undefined {
  return MOCK_USERS.find(user => user.id === id && user.is_active)
}

// Helper to get bookings by customer email
export function getMockBookingsByEmail(email: string): Booking[] {
  return MOCK_BOOKINGS.filter(b => b.customer_email === email)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Helper to generate booking code
function generateBookingCode(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TE${dateStr}-${random}`
}

// Helper to calculate nights/days
export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

// Mock Bookings
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'mock-booking-1',
    booking_code: generateBookingCode(),
    booking_type: BookingType.HOTEL,
    hotel_id: MOCK_HOTELS[0].id,
    check_in_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    check_out_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
    number_of_guests: 2,
    customer_name: 'สมชาย ใจดี',
    customer_email: 'somchai@example.com',
    customer_phone: '+66 81 234 5678',
    customer_line: '@somchai123',
    special_requests: 'ต้องการห้องที่มองเห็นทะเล',
    total_price: MOCK_HOTELS[0].price_per_night * 3,
    currency: MOCK_HOTELS[0].currency,
    status: BookingStatus.CONFIRMED,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    hotel: MOCK_HOTELS[0],
  },
  {
    id: 'mock-booking-2',
    booking_code: generateBookingCode(),
    booking_type: BookingType.CAR,
    car_id: MOCK_CARS[0].id,
    check_in_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
    check_out_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 days from now
    number_of_guests: 2,
    customer_name: 'John Smith',
    customer_email: 'john.smith@example.com',
    customer_phone: '+66 82 345 6789',
    total_price: MOCK_CARS[0].price_per_day * 3,
    currency: MOCK_CARS[0].currency,
    status: BookingStatus.PAID,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    car: MOCK_CARS[0],
  },
  {
    id: 'mock-booking-3',
    booking_code: generateBookingCode(),
    booking_type: BookingType.HOTEL,
    hotel_id: MOCK_HOTELS[1].id,
    check_in_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
    check_out_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
    number_of_guests: 4,
    customer_name: 'มานะ ขยันดี',
    customer_email: 'mana@example.com',
    customer_phone: '+66 83 456 7890',
    total_price: MOCK_HOTELS[1].price_per_night * 3,
    currency: MOCK_HOTELS[1].currency,
    status: BookingStatus.COMPLETED,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    hotel: MOCK_HOTELS[1],
  },
  {
    id: 'mock-booking-4',
    booking_code: generateBookingCode(),
    booking_type: BookingType.COMBO,
    hotel_id: MOCK_HOTELS[2].id,
    car_id: MOCK_CARS[1].id,
    check_in_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    check_out_date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 18 days from now
    number_of_guests: 2,
    customer_name: 'Sarah Johnson',
    customer_email: 'sarah.j@example.com',
    customer_phone: '+66 84 567 8901',
    customer_line: '@sarahj',
    special_requests: 'Honeymoon package - please arrange flowers',
    total_price: (MOCK_HOTELS[2].price_per_night * 4) + (MOCK_CARS[1].price_per_day * 4),
    currency: MOCK_HOTELS[2].currency, // ใช้ currency จากโรงแรม
    status: BookingStatus.PENDING,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    hotel: MOCK_HOTELS[2],
    car: MOCK_CARS[1],
  },
  {
    id: 'mock-booking-5',
    booking_code: generateBookingCode(),
    booking_type: BookingType.CAR,
    car_id: MOCK_CARS[1].id,
    check_in_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days ago
    check_out_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    number_of_guests: 7,
    customer_name: 'ครอบครัว สุขสันต์',
    customer_email: 'family@example.com',
    customer_phone: '+66 85 678 9012',
    total_price: MOCK_CARS[1].price_per_day * 3,
    currency: MOCK_CARS[1].currency,
    status: BookingStatus.COMPLETED,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    car: MOCK_CARS[1],
  },
  {
    id: 'mock-booking-6',
    booking_code: generateBookingCode(),
    booking_type: BookingType.HOTEL,
    hotel_id: MOCK_HOTELS[0].id,
    check_in_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 21 days from now
    check_out_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 25 days from now
    number_of_guests: 2,
    customer_name: 'David Lee',
    customer_email: 'david.lee@example.com',
    customer_phone: '+66 86 789 0123',
    total_price: MOCK_HOTELS[0].price_per_night * 4,
    currency: MOCK_HOTELS[0].currency,
    status: BookingStatus.CONFIRMED,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    hotel: MOCK_HOTELS[0],
  },
  {
    id: 'mock-booking-7',
    booking_code: generateBookingCode(),
    booking_type: BookingType.CAR,
    car_id: MOCK_CARS[0].id,
    check_in_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 20 days ago
    check_out_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 18 days ago
    number_of_guests: 2,
    customer_name: 'นิดา รักสวย',
    customer_email: 'nida@example.com',
    customer_phone: '+66 87 890 1234',
    total_price: MOCK_CARS[0].price_per_day * 2,
    currency: MOCK_CARS[0].currency,
    status: BookingStatus.CANCELLED,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    updated_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(), // 19 days ago
    car: MOCK_CARS[0],
  },
  {
    id: 'mock-booking-8',
    booking_code: generateBookingCode(),
    booking_type: BookingType.HOTEL,
    hotel_id: MOCK_HOTELS[1].id,
    check_in_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    check_out_date: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 33 days from now
    number_of_guests: 4,
    customer_name: 'วิไล ใจกว้าง',
    customer_email: 'wilai@example.com',
    customer_phone: '+66 88 901 2345',
    total_price: MOCK_HOTELS[1].price_per_night * 3,
    currency: MOCK_HOTELS[1].currency,
    status: BookingStatus.PENDING,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    hotel: MOCK_HOTELS[1],
  },
  // Mock booking สำหรับทดสอบหน้า checkout (ยังไม่มี payment)
  {
    id: 'mock-booking-checkout-1',
    booking_code: 'BK-CHECKOUT-001',
    booking_type: BookingType.HOTEL,
    hotel_id: MOCK_HOTELS[0].id,
    check_in_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    check_out_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 8 days from now
    number_of_guests: 2,
    customer_name: 'Test User',
    customer_email: 'test@example.com',
    customer_phone: '+66 99 999 9999',
    total_price: MOCK_HOTELS[0].price_per_night * 3,
    currency: Currency.THB,
    status: BookingStatus.PENDING,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    hotel: MOCK_HOTELS[0],
  },
  {
    id: 'mock-booking-checkout-2',
    booking_code: 'BK-CHECKOUT-002',
    booking_type: BookingType.CAR,
    car_id: MOCK_CARS[0].id,
    check_in_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
    check_out_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    number_of_guests: 4,
    customer_name: 'International Customer',
    customer_email: 'international@example.com',
    customer_phone: '+1 555 123 4567',
    total_price: MOCK_CARS[0].price_per_day * 3,
    currency: Currency.USD,
    status: BookingStatus.PENDING,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    car: MOCK_CARS[0],
  },
]

// Mock Payments
export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'mock-payment-1',
    booking_id: MOCK_BOOKINGS[1].id, // John Smith's booking
    stripe_checkout_session_id: 'cs_test_1234567890',
    amount: MOCK_BOOKINGS[1].total_price,
    currency: Currency.THB,
    status: PaymentStatus.SUCCEEDED,
    paid_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    booking: MOCK_BOOKINGS[1],
  },
  {
    id: 'mock-payment-2',
    booking_id: MOCK_BOOKINGS[2].id, // มานะ's booking
    stripe_checkout_session_id: 'cs_test_0987654321',
    amount: MOCK_BOOKINGS[2].total_price,
    currency: Currency.THB,
    status: PaymentStatus.SUCCEEDED,
    paid_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    booking: MOCK_BOOKINGS[2],
  },
  {
    id: 'mock-payment-3',
    booking_id: MOCK_BOOKINGS[4].id, // ครอบครัว สุขสันต์'s booking
    stripe_checkout_session_id: 'cs_test_1122334455',
    amount: MOCK_BOOKINGS[4].total_price,
    currency: Currency.THB,
    status: PaymentStatus.SUCCEEDED,
    paid_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    booking: MOCK_BOOKINGS[4],
  },
  {
    id: 'mock-payment-4',
    booking_id: MOCK_BOOKINGS[5].id, // David Lee's booking
    stripe_checkout_session_id: 'cs_test_5566778899',
    amount: MOCK_BOOKINGS[5].total_price,
    currency: Currency.THB,
    status: PaymentStatus.PENDING,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    booking: MOCK_BOOKINGS[5],
  },
  // เพิ่ม mock payments สำหรับทดสอบ payment history
  {
    id: 'mock-payment-5',
    booking_id: MOCK_BOOKINGS[0].id, // สมชาย ใจดี's booking
    stripe_checkout_session_id: 'cs_test_9988776655',
    stripe_payment_intent_id: 'pi_test_9988776655',
    amount: MOCK_BOOKINGS[0].total_price,
    currency: Currency.THB,
    status: PaymentStatus.SUCCEEDED,
    paid_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    booking: MOCK_BOOKINGS[0],
  },
  {
    id: 'mock-payment-6',
    booking_id: MOCK_BOOKINGS[3].id, // Sarah Johnson's booking
    stripe_checkout_session_id: 'cs_test_1122334455',
    amount: MOCK_BOOKINGS[3].total_price,
    currency: Currency.USD,
    status: PaymentStatus.SUCCEEDED,
    paid_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    booking: MOCK_BOOKINGS[3],
  },
  {
    id: 'mock-payment-7',
    booking_id: MOCK_BOOKINGS[6].id, // David Lee's booking
    stripe_checkout_session_id: 'cs_test_2233445566',
    amount: MOCK_BOOKINGS[6].total_price,
    currency: Currency.THB,
    status: PaymentStatus.FAILED,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    booking: MOCK_BOOKINGS[6],
  },
  {
    id: 'mock-payment-8',
    booking_id: MOCK_BOOKINGS[1].id, // John Smith's booking (refunded)
    stripe_checkout_session_id: 'cs_test_3344556677',
    stripe_payment_intent_id: 'pi_test_3344556677',
    amount: MOCK_BOOKINGS[1].total_price,
    currency: Currency.THB,
    status: PaymentStatus.REFUNDED,
    paid_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    updated_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days ago
    booking: MOCK_BOOKINGS[1],
  },
]

// Calculate Dashboard Stats from Mock Data
export function calculateMockStats(): DashboardStats {
  const totalBookings = MOCK_BOOKINGS.length
  const totalRevenue = MOCK_PAYMENTS
    .filter(p => p.status === PaymentStatus.SUCCEEDED)
    .reduce((sum, p) => sum + p.amount, 0)
  
  const pendingBookings = MOCK_BOOKINGS.filter(
    b => b.status === BookingStatus.PENDING
  ).length
  
  const confirmedBookings = MOCK_BOOKINGS.filter(
    b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PAID
  ).length
  
  const totalHotels = MOCK_HOTELS.length
  const totalCars = MOCK_CARS.length

  return {
    totalBookings,
    totalRevenue,
    pendingBookings,
    confirmedBookings,
    totalHotels,
    totalCars,
  }
}

// Helper function to find admin by email (for mock login)
export function findMockAdmin(email: string): Admin | undefined {
  return MOCK_ADMINS.find(admin => admin.email === email && admin.is_active)
}

// Helper function to find booking by code
export function findMockBookingByCode(code: string): Booking | undefined {
  return MOCK_BOOKINGS.find(booking => booking.booking_code === code)
}

// Helper function to get bookings with filters
export function getMockBookings(filters?: {
  status?: BookingStatus
  booking_type?: BookingType
  limit?: number
  offset?: number
}): Booking[] {
  let bookings = [...MOCK_BOOKINGS]

  if (filters?.status) {
    bookings = bookings.filter(b => b.status === filters.status)
  }

  if (filters?.booking_type) {
    bookings = bookings.filter(b => b.booking_type === filters.booking_type)
  }

  // Sort by created_at descending (newest first)
  bookings.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const offset = filters?.offset || 0
  const limit = filters?.limit || bookings.length

  return bookings.slice(offset, offset + limit)
}

