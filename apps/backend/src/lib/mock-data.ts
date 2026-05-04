import type { Admin, Booking, Payment, DashboardStats, User } from '@chiangrai/shared/types'
import { BookingStatus, BookingType, PaymentStatus, Currency } from '@chiangrai/shared/types'
import { MOCK_HOTELS, MOCK_CARS } from './constants'

// Mock Admin User
// Password: admin123
export const MOCK_ADMINS: Admin[] = [
  {
    id: 'mock-admin-1',
    email: 'admin@gotjourneythailand.com',
    password_hash: '$2b$10$.Vgi5RAg0fL4fDICUI09e.FOqJC59dyVNfk71aKGf1aPFMNKNIaX2', // admin123
    name: 'Admin User',
    role: 'admin',
    is_active: true,
    last_login: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    updated_at: new Date().toISOString(),
  },
]

// Mock Users (in-memory storage for demo)
// Password: user123 (สำหรับทุก user)
export const MOCK_USERS: User[] = [
  {
    id: 'mock-user-1',
    email: 'user@example.com',
    password_hash: '$2b$10$zjdWZKUMHmolFwiAfWAz6uyHntIxMfgJCstmwHE56nJj31rQw/JWS', // user123
    name: 'ผู้ใช้ทดสอบ',
    role: 'user',
    phone: '+66 81 234 5678',
    is_active: true,
    // Phase-1 referral + loyalty seed: this user is the
    // "main demo user" — has shared their code with 3 friends
    // (see MOCK_REFERRALS) and earned points from 3 paid
    // bookings. The counter (138) matches the ledger sum of
    // 25 + 50 + 78 - 15 in MOCK_LOYALTY_LEDGER.
    referral_code: 'ABCDEFGH',
    loyalty_points: 138,
    email_verified: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  } as User,
  // Three referees attributed to user-1's code. Created in the
  // referral flow, so they all have email_verified=true and a
  // user_token-able profile.
  {
    id: 'mock-user-2',
    email: 'niran@example.com',
    password_hash: '$2b$10$zjdWZKUMHmolFwiAfWAz6uyHntIxMfgJCstmwHE56nJj31rQw/JWS',
    name: 'Niran K.',
    role: 'user',
    phone: '+66 89 111 2222',
    is_active: true,
    email_verified: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  } as User,
  {
    id: 'mock-user-3',
    email: 'aor@example.com',
    password_hash: '$2b$10$zjdWZKUMHmolFwiAfWAz6uyHntIxMfgJCstmwHE56nJj31rQw/JWS',
    name: 'อรณิชา ส.',
    role: 'user',
    phone: '+66 89 333 4444',
    is_active: true,
    email_verified: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  } as User,
  {
    id: 'mock-user-4',
    email: 'somchai@example.com',
    password_hash: '$2b$10$zjdWZKUMHmolFwiAfWAz6uyHntIxMfgJCstmwHE56nJj31rQw/JWS',
    name: 'สมชาย ใจดี',
    role: 'user',
    phone: '+66 89 555 6666',
    is_active: true,
    email_verified: false, // intentional — pending verify
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  } as User,
  // Partner โรงแรม
  {
    id: 'mock-partner-hotel-1',
    email: 'hotel@example.com',
    password_hash: '$2b$10$zjdWZKUMHmolFwiAfWAz6uyHntIxMfgJCstmwHE56nJj31rQw/JWS', // user123
    name: 'โรงแรมพาร์ทเนอร์',
    role: 'partner',
    phone: '+66 82 345 6789',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Partner คนขับรถ
  {
    id: 'mock-partner-car-1',
    email: 'driver@example.com',
    password_hash: '$2b$10$zjdWZKUMHmolFwiAfWAz6uyHntIxMfgJCstmwHE56nJj31rQw/JWS', // user123
    name: 'คนขับรถพาร์ทเนอร์',
    role: 'partner',
    phone: '+66 83 456 7890',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Partner ทั่วไป (สำหรับทดสอบ)
  {
    id: 'mock-partner-1',
    email: 'partner@example.com',
    password_hash: '$2b$10$zjdWZKUMHmolFwiAfWAz6uyHntIxMfgJCstmwHE56nJj31rQw/JWS', // user123
    name: 'พาร์ทเนอร์ทดสอบ',
    role: 'partner',
    phone: '+66 84 567 8901',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
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

// ============================================================
// Mock Data — peripheral tables for a populated demo
// ============================================================
//
// Most of the admin pages and analytics widgets read from these
// tables. Without seed data they render empty states forever in
// mock mode, which makes evaluating the UX painful. Each block
// below is a small, self-consistent set tuned so:
//
//   - dates/timestamps are anchored relative to NOW so the data
//     always looks "recent" no matter when you boot
//   - foreign-key-ish references (hotel_id, customer_email,
//     user_id) line up with MOCK_HOTELS / MOCK_USERS / MOCK_CARS
//     above, so joins on the mock client return real rows
//   - a few rows are deliberately in mid-funnel states (review
//     pending mod, referral pending, expired coupon) so the
//     filtered-list views aren't all-green-paths

const NOW = Date.now()
const day = (n: number) => new Date(NOW + n * 24 * 60 * 60 * 1000).toISOString()
const hour = (n: number) => new Date(NOW + n * 60 * 60 * 1000).toISOString()

// --- Coupons -------------------------------------------------
// Seven coupons covering the catalogue of states the admin UI
// filters on: active percent, active fixed, low-min-spend gate,
// expired, future-start, referral reward (email-bound), loyalty
// redemption (email-bound). Two of them are bound to the demo
// users so testing the redeem path "just works."
export const MOCK_COUPONS = [
  {
    id: 'mock-coupon-welcome10',
    code: 'WELCOME10',
    description: 'ส่วนลดต้อนรับสมาชิกใหม่ 10%',
    discount_type: 'PERCENT' as const,
    discount_value: 10,
    min_spend: 0,
    max_discount: 500,
    applies_to: 'ALL' as const,
    starts_at: day(-30),
    expires_at: day(60),
    is_active: true,
    bound_to_email: null,
    source: null,
    created_at: day(-30),
    updated_at: day(-30),
  },
  {
    id: 'mock-coupon-summer500',
    code: 'SUMMER500',
    description: 'ส่วนลด ฿500 สำหรับการจองโรงแรม',
    discount_type: 'FIXED' as const,
    discount_value: 500,
    min_spend: 3000,
    max_discount: null,
    applies_to: 'HOTEL' as const,
    starts_at: day(-14),
    expires_at: day(45),
    is_active: true,
    bound_to_email: null,
    source: null,
    created_at: day(-14),
    updated_at: day(-14),
  },
  {
    id: 'mock-coupon-rentcar15',
    code: 'RENTCAR15',
    description: 'รถเช่าลด 15% — เฉพาะ booking รถ',
    discount_type: 'PERCENT' as const,
    discount_value: 15,
    min_spend: 1500,
    max_discount: 800,
    applies_to: 'CAR' as const,
    starts_at: day(-7),
    expires_at: day(30),
    is_active: true,
    bound_to_email: null,
    source: null,
    created_at: day(-7),
    updated_at: day(-7),
  },
  {
    id: 'mock-coupon-songkran',
    code: 'SONGKRAN24',
    description: 'แคมเปญสงกรานต์ที่ผ่านมา (หมดอายุแล้ว)',
    discount_type: 'PERCENT' as const,
    discount_value: 20,
    min_spend: 0,
    max_discount: 1000,
    applies_to: 'ALL' as const,
    starts_at: day(-90),
    expires_at: day(-30),
    is_active: false,
    bound_to_email: null,
    source: null,
    created_at: day(-100),
    updated_at: day(-30),
  },
  {
    id: 'mock-coupon-newyear',
    code: 'NEWYEAR2027',
    description: 'แคมเปญปีใหม่ — ยังไม่เริ่ม',
    discount_type: 'PERCENT' as const,
    discount_value: 25,
    min_spend: 5000,
    max_discount: 2000,
    applies_to: 'ALL' as const,
    starts_at: day(60),
    expires_at: day(120),
    is_active: true,
    bound_to_email: null,
    source: null,
    created_at: day(-1),
    updated_at: day(-1),
  },
  // Email-bound: mock referral reward sitting in user@example.com's wallet
  {
    id: 'mock-coupon-gift-ref',
    code: 'GIFT-NIRAN-A1B2',
    description: 'Welcome gift — thanks for trying us out',
    discount_type: 'PERCENT' as const,
    discount_value: 10,
    min_spend: 0,
    max_discount: 500,
    applies_to: 'ALL' as const,
    starts_at: day(-3),
    expires_at: day(87),
    is_active: true,
    bound_to_email: 'user@example.com',
    source: 'referral_referee',
    created_at: day(-3),
    updated_at: day(-3),
  },
  // Email-bound: mock loyalty redemption sitting in user@example.com's wallet
  {
    id: 'mock-coupon-redeem-loyalty',
    code: 'REDEEM-XK3PQR94',
    description: 'Loyalty redemption — ฿100 off',
    discount_type: 'FIXED' as const,
    discount_value: 100,
    min_spend: 0,
    max_discount: null,
    applies_to: 'ALL' as const,
    starts_at: day(-1),
    expires_at: day(89),
    is_active: true,
    bound_to_email: 'user@example.com',
    source: 'loyalty_redeem',
    created_at: day(-1),
    updated_at: day(-1),
  },
]

// --- Reviews -------------------------------------------------
// Four approved + two pending so the moderation UI has both an
// "approved" tab AND a meaningful "pending" tab to triage. Each
// review references one of the seeded hotels or cars so the
// public detail-page reviews-section has content too.
export const MOCK_REVIEWS = [
  {
    id: 'mock-review-1',
    hotel_id: MOCK_HOTELS[0].id,
    car_id: null,
    customer_name: 'สมชาย ใจดี',
    customer_email: 'somchai@example.com',
    rating: 5,
    comment: 'ห้องสะอาด พนักงานน่ารัก วิวทะเลสวยมาก แนะนำเลย',
    is_approved: true,
    spam_score: 0,
    created_at: day(-12),
    updated_at: day(-12),
  },
  {
    id: 'mock-review-2',
    hotel_id: MOCK_HOTELS[0].id,
    car_id: null,
    customer_name: 'Niran K.',
    customer_email: 'niran@example.com',
    rating: 4,
    comment: 'Pool villa was great but breakfast options could be more varied.',
    is_approved: true,
    spam_score: 5,
    created_at: day(-8),
    updated_at: day(-8),
  },
  {
    id: 'mock-review-3',
    hotel_id: MOCK_HOTELS[1].id,
    car_id: null,
    customer_name: 'อรณิชา ส.',
    customer_email: 'aor@example.com',
    rating: 5,
    comment: 'รีสอร์ทบรรยากาศดีมาก ขับ SUV ขึ้นดอยสนุกสุดๆ ไกด์ก็เป็นกันเอง',
    is_approved: true,
    spam_score: 2,
    created_at: day(-5),
    updated_at: day(-5),
  },
  {
    id: 'mock-review-4',
    hotel_id: null,
    car_id: MOCK_CARS[0].id,
    customer_name: 'Mark T.',
    customer_email: 'mark@example.com',
    rating: 5,
    comment: 'Convertible was immaculate. Pickup at the airport was painless.',
    is_approved: true,
    spam_score: 0,
    created_at: day(-3),
    updated_at: day(-3),
  },
  {
    id: 'mock-review-5-pending',
    hotel_id: MOCK_HOTELS[2].id,
    car_id: null,
    customer_name: 'Anonymous',
    customer_email: 'spam@bot.tld',
    rating: 1,
    comment: 'Buy crypto now!!! Click http://scam.example/win $$$',
    is_approved: false,
    spam_score: 95,
    created_at: hour(-3),
    updated_at: hour(-3),
  },
  {
    id: 'mock-review-6-pending',
    hotel_id: null,
    car_id: MOCK_CARS[0].id,
    customer_name: 'พี่หนุ่ม',
    customer_email: 'pn@example.com',
    rating: 4,
    comment: 'รถสวย แต่ส่งช้านิดนึง ครั้งหน้าอยากให้ตรงเวลามากกว่านี้',
    is_approved: false,
    spam_score: 8,
    created_at: hour(-1),
    updated_at: hour(-1),
  },
]

// --- Partners ------------------------------------------------
// Two partners: one who owns a hotel, one who owns the car. The
// owner_ids on hotel-1 and car-1 above are stamped "mock-partner-..."
// to match. partners is a row in the users table with role='partner'
// per migration 0007 — for the mock client it lives in its own
// `partners` array, but we mirror minimal fields here.
export const MOCK_PARTNERS = [
  {
    id: 'mock-partner-hotel-1',
    name: 'Phuket Ocean Drive Co., Ltd',
    email: 'partner-phuket@example.com',
    phone: '076-555-0101',
    business_type: 'HOTEL' as const,
    stripe_account_id: null,
    stripe_onboarding_complete: false,
    is_active: true,
    created_at: day(-180),
    updated_at: day(-30),
  },
  {
    id: 'mock-partner-car-1',
    name: 'Chiang Rai Premium Cars',
    email: 'partner-cars@example.com',
    phone: '053-555-0202',
    business_type: 'CAR' as const,
    stripe_account_id: 'acct_mock_partner_car_1',
    stripe_onboarding_complete: true,
    is_active: true,
    created_at: day(-120),
    updated_at: day(-7),
  },
]

// --- Admin notifications ------------------------------------
// Mix of unread + read, varied severity, so the bell badge in
// the sidebar shows a count and the inbox has filterable rows.
export const MOCK_ADMIN_NOTIFICATIONS = [
  {
    id: 'mock-notif-1',
    type: 'BOOKING',
    title: 'การจองใหม่',
    message: 'ลูกค้า สมชาย ใจดี จองแพ็คเกจภูเก็ต ฿38,700',
    link: '/admin/bookings',
    is_read: false,
    created_at: hour(-2),
  },
  {
    id: 'mock-notif-2',
    type: 'REVIEW',
    title: 'รีวิวรอตรวจสอบ',
    message: 'มีรีวิวใหม่ที่ระบบสงสัยว่าเป็น spam (score 95)',
    link: '/admin/reviews?status=pending',
    is_read: false,
    created_at: hour(-3),
  },
  {
    id: 'mock-notif-3',
    type: 'PARTNER',
    title: 'พาร์ทเนอร์ใหม่ลงทะเบียน',
    message: 'Chiang Rai Premium Cars ส่งเอกสารยืนยันแล้ว — รอตรวจสอบ',
    link: '/admin/partners',
    is_read: true,
    created_at: day(-7),
  },
  {
    id: 'mock-notif-4',
    type: 'CANCELLATION',
    title: 'ยกเลิกการจอง',
    message: 'Booking TE26-AB12 ถูกยกเลิก — refund 100% (฿8,900)',
    link: '/admin/bookings',
    is_read: true,
    created_at: day(-2),
  },
]

// --- Referrals ----------------------------------------------
// One pending, one qualified, one rewarded — gives the admin
// /admin/referrals page a row in each filter chip and the
// dashboard analytics widget a non-zero conversion rate.
export const MOCK_REFERRALS = [
  {
    id: 'mock-ref-1',
    referrer_id: 'mock-user-1',
    referee_id: 'mock-user-2',
    referral_code: 'ABCDEFGH',
    status: 'rewarded',
    qualified_at: day(-5),
    rewarded_at: day(-5),
    referrer_coupon_code: 'GIFT-OWNER-X1Y2',
    referee_coupon_code: 'GIFT-NIRAN-A1B2',
    created_at: day(-10),
  },
  {
    id: 'mock-ref-2',
    referrer_id: 'mock-user-1',
    referee_id: 'mock-user-3',
    referral_code: 'ABCDEFGH',
    status: 'qualified',
    qualified_at: day(-1),
    rewarded_at: null,
    referrer_coupon_code: null,
    referee_coupon_code: null,
    created_at: day(-3),
  },
  {
    id: 'mock-ref-3',
    referrer_id: 'mock-user-1',
    referee_id: 'mock-user-4',
    referral_code: 'ABCDEFGH',
    status: 'pending',
    qualified_at: null,
    rewarded_at: null,
    referrer_coupon_code: null,
    referee_coupon_code: null,
    created_at: day(-1),
  },
]

// --- Loyalty ledger -----------------------------------------
// The demo user (user@example.com / mock-user-1) has earned and
// spent some points. Counter on users.loyalty_points should sum
// to match — set in the user row itself (138 = 25+50+78-15).
export const MOCK_LOYALTY_LEDGER = [
  {
    id: 'mock-loy-1',
    user_id: 'mock-user-1',
    delta: 25,
    kind: 'earn',
    source_type: 'booking',
    source_id: 'mock-booking-1',
    reason: 'จองสำเร็จ TE25-AAA1 (฿2,500)',
    created_at: day(-30),
  },
  {
    id: 'mock-loy-2',
    user_id: 'mock-user-1',
    delta: 50,
    kind: 'earn',
    source_type: 'booking',
    source_id: 'mock-booking-2',
    reason: 'จองสำเร็จ TE25-BBB2 (฿5,000)',
    created_at: day(-20),
  },
  {
    id: 'mock-loy-3',
    user_id: 'mock-user-1',
    delta: 78,
    kind: 'earn',
    source_type: 'booking',
    source_id: 'mock-booking-3',
    reason: 'จองสำเร็จ TE25-CCC3 (฿7,800)',
    created_at: day(-10),
  },
  {
    id: 'mock-loy-4',
    user_id: 'mock-user-1',
    delta: -15,
    kind: 'redeem',
    source_type: 'coupon',
    source_id: 'REDEEM-XK3PQR94',
    reason: 'แลกแต้มเป็นคูปอง ฿100 off (รหัส REDEEM-XK3PQR94)',
    created_at: day(-1),
  },
]

// --- User wishlist ------------------------------------------
// The demo user has a few saved listings so /wishlist shows real
// content when they log in.
export const MOCK_WISHLIST = [
  {
    user_id: 'mock-user-1',
    kind: 'hotel',
    id: MOCK_HOTELS[1].id,
    added_at: day(-5),
  },
  {
    user_id: 'mock-user-1',
    kind: 'hotel',
    id: MOCK_HOTELS[2].id,
    added_at: day(-2),
  },
  {
    user_id: 'mock-user-1',
    kind: 'car',
    id: MOCK_CARS[0].id,
    added_at: day(-1),
  },
]

// --- Admin audit log ----------------------------------------
// Recent admin actions so the audit-log query has rows. Rotates
// through the action verbs we use (booking.refund, hotel.delete,
// referral.void, coupon.create) so any "filter by action" query
// produces results.
export const MOCK_ADMIN_AUDIT_LOG = [
  {
    id: 'mock-audit-1',
    actor_id: 'mock-admin-1',
    actor_email: 'admin@gotjourneythailand.com',
    action: 'booking.refund',
    resource_type: 'booking',
    resource_id: 'TE26-AB12',
    metadata: { amount: 8900, reason: 'ลูกค้าขอยกเลิก' },
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    request_id: 'mock-req-001',
    created_at: day(-2),
  },
  {
    id: 'mock-audit-2',
    actor_id: 'mock-admin-1',
    actor_email: 'admin@gotjourneythailand.com',
    action: 'coupon.create',
    resource_type: 'coupon',
    resource_id: 'mock-coupon-summer500',
    metadata: { code: 'SUMMER500', discount_type: 'FIXED', discount_value: 500 },
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    request_id: 'mock-req-002',
    created_at: day(-14),
  },
  {
    id: 'mock-audit-3',
    actor_id: 'mock-admin-1',
    actor_email: 'admin@gotjourneythailand.com',
    action: 'review.approve',
    resource_type: 'review',
    resource_id: 'mock-review-3',
    metadata: { rating: 5 },
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    request_id: 'mock-req-003',
    created_at: day(-5),
  },
]

