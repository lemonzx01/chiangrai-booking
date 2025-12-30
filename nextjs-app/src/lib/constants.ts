import type { NavItem } from '@/types'

// Navigation Items
export const NAVIGATION: NavItem[] = [
  {
    label: { th: 'หน้าแรก', en: 'Home' },
    href: '/',
  },
  {
    label: { th: 'แพ็คเกจเที่ยว', en: 'Packages' },
    href: '/hotels',
  },
  {
    label: { th: 'รถเช่า', en: 'Car Rentals' },
    href: '/cars',
  },
  {
    label: { th: 'ติดต่อเรา', en: 'Contact' },
    href: '/contact',
  },
]

// Admin Navigation
export const ADMIN_NAVIGATION = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    label: 'โรงแรม/แพ็คเกจ',
    href: '/admin/hotels',
    icon: 'Building2',
  },
  {
    label: 'รถเช่า',
    href: '/admin/cars',
    icon: 'Car',
  },
  {
    label: 'การจอง',
    href: '/admin/bookings',
    icon: 'Calendar',
  },
]

// Booking Status Labels
export const BOOKING_STATUS_LABELS = {
  PENDING: { th: 'รอดำเนินการ', en: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { th: 'ยืนยันแล้ว', en: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  PAID: { th: 'ชำระเงินแล้ว', en: 'Paid', color: 'bg-green-100 text-green-800' },
  CANCELLED: { th: 'ยกเลิก', en: 'Cancelled', color: 'bg-red-100 text-red-800' },
  COMPLETED: { th: 'เสร็จสิ้น', en: 'Completed', color: 'bg-gray-100 text-gray-800' },
}

// Booking Type Labels
export const BOOKING_TYPE_LABELS = {
  HOTEL: { th: 'โรงแรม', en: 'Hotel' },
  CAR: { th: 'รถเช่า', en: 'Car Rental' },
  COMBO: { th: 'แพ็คเกจรวม', en: 'Combo Package' },
}

// Star Rating Labels
export const STAR_RATINGS = [
  { value: 1, label: '1 ดาว' },
  { value: 2, label: '2 ดาว' },
  { value: 3, label: '3 ดาว' },
  { value: 4, label: '4 ดาว' },
  { value: 5, label: '5 ดาว' },
]

// Default Images
export const DEFAULT_HOTEL_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
export const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'

// Pagination
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// App Info
export const APP_NAME = 'Waygo Thailand'
export const APP_DESCRIPTION = 'Premium Travel Booking Platform - Book luxury cars with exclusive villa packages in Chiang Rai'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Contact Info
export const CONTACT_INFO = {
  phone: '02-xxx-xxxx',
  email: 'contact@waygothailand.com',
  line: '@waygothailand',
  address: 'Chiang Rai, Thailand',
  workingHours: '09:00 - 18:00 (Mon-Sat)',
}

// Social Links
export const SOCIAL_LINKS = {
  facebook: 'https://facebook.com/waygothailand',
  instagram: 'https://instagram.com/waygothailand',
  line: 'https://line.me/ti/p/@waygothailand',
}
