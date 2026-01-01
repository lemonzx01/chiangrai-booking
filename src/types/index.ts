// Enums
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum BookingType {
  HOTEL = 'HOTEL',
  CAR = 'CAR',
  COMBO = 'COMBO'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

// Database Types
export interface Hotel {
  id: string
  name_th: string
  name_en: string
  description_th: string
  description_en: string
  location: string
  star_rating: number
  price_per_night: number
  max_guests: number
  room_type_th: string
  room_type_en: string
  amenities_th: string[]
  amenities_en: string[]
  images: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Car {
  id: string
  name_th: string
  name_en: string
  description_th: string
  description_en: string
  car_type_th: string
  car_type_en: string
  max_passengers: number
  price_per_day: number
  includes_th: string[]
  includes_en: string[]
  images: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  booking_code: string
  booking_type: BookingType
  hotel_id?: string
  car_id?: string
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_line?: string
  special_requests?: string
  total_price: number
  status: BookingStatus
  created_at: string
  updated_at: string
  // Relations (optional, for joined queries)
  hotel?: Hotel
  car?: Car
}

export interface Payment {
  id: string
  booking_id: string
  stripe_payment_intent_id?: string
  stripe_checkout_session_id?: string
  amount: number
  currency: string
  status: PaymentStatus
  paid_at?: string
  created_at: string
  updated_at: string
  // Relations
  booking?: Booking
}

export interface Admin {
  id: string
  email: string
  password_hash: string
  name: string
  role: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

// Helper types for localized content
export type LocalizedString = {
  th: string
  en: string
}

export type LocalizedArray = {
  th: string[]
  en: string[]
}

// Utility function to get localized value
export function getLocalized<T>(
  item: { [key: string]: T },
  field: string,
  lang: 'th' | 'en'
): T {
  return item[`${field}_${lang}`] as T
}

// Create localized object from flat fields
export function toLocalizedHotel(hotel: Hotel, lang: 'th' | 'en') {
  return {
    ...hotel,
    name: hotel[`name_${lang}`],
    description: hotel[`description_${lang}`],
    room_type: hotel[`room_type_${lang}`],
    amenities: hotel[`amenities_${lang}`],
  }
}

export function toLocalizedCar(car: Car, lang: 'th' | 'en') {
  return {
    ...car,
    name: car[`name_${lang}`],
    description: car[`description_${lang}`],
    car_type: car[`car_type_${lang}`],
    includes: car[`includes_${lang}`],
  }
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

// Form Types
export interface BookingFormData {
  booking_type: BookingType
  hotel_id?: string
  car_id?: string
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_line?: string
  special_requests?: string
}

export interface HotelFormData {
  name_th: string
  name_en: string
  description_th: string
  description_en: string
  location: string
  star_rating: number
  price_per_night: number
  max_guests: number
  room_type_th: string
  room_type_en: string
  amenities_th: string[]
  amenities_en: string[]
  images: string[]
  is_active: boolean
}

export interface CarFormData {
  name_th: string
  name_en: string
  description_th: string
  description_en: string
  car_type_th: string
  car_type_en: string
  max_passengers: number
  price_per_day: number
  includes_th: string[]
  includes_en: string[]
  images: string[]
  is_active: boolean
}

// Dashboard Stats
export interface DashboardStats {
  totalBookings: number
  totalRevenue: number
  pendingBookings: number
  confirmedBookings: number
  totalHotels: number
  totalCars: number
}

// Navigation
export interface NavItem {
  label: LocalizedString
  href: string
}
