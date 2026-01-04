/**
 * ============================================================
 * Constants - ค่าคงที่และข้อมูลตั้งต้นของระบบ
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - รวมค่าคงที่ทั้งหมดที่ใช้ในโปรเจค
 *   - กำหนดข้อมูล Navigation และ Labels
 *   - เก็บ Mock Data สำหรับ Development
 *
 * เนื้อหาหลัก:
 *   - Navigation: เมนูหลักและเมนูแอดมิน
 *   - Labels: สถานะการจอง, ประเภทการจอง
 *   - App Info: ชื่อแอป, ข้อมูลติดต่อ
 *   - Mock Data: ข้อมูลจำลองสำหรับทดสอบ
 *
 * ============================================================
 */

// ============================================================
// Imports
// ============================================================

import type { NavItem } from '@/types'

// ============================================================
// Navigation (เมนูนำทาง)
// ============================================================

/**
 * รายการเมนูหลักสำหรับ Navbar
 * @description เมนูที่แสดงในส่วนหัวของเว็บไซต์ฝั่งลูกค้า
 */
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

/**
 * รายการเมนูสำหรับ Admin Panel
 * @description เมนูที่แสดงใน Sidebar ของหน้าแอดมิน
 */
export const ADMIN_NAVIGATION = [
  {
    /** หน้า Dashboard แสดงภาพรวม */
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    /** จัดการโรงแรม/แพ็คเกจ */
    label: 'โรงแรม/แพ็คเกจ',
    href: '/admin/hotels',
    icon: 'Building2',
  },
  {
    /** จัดการรถเช่า */
    label: 'รถเช่า',
    href: '/admin/cars',
    icon: 'Car',
  },
  {
    /** จัดการการจอง */
    label: 'การจอง',
    href: '/admin/bookings',
    icon: 'Calendar',
  },
]

// ============================================================
// Status Labels (ป้ายกำกับสถานะ)
// ============================================================

/**
 * ป้ายกำกับสถานะการจอง
 * @description แสดงสถานะการจองพร้อมสีและข้อความ 2 ภาษา
 */
export const BOOKING_STATUS_LABELS = {
  /** รอดำเนินการ - สีเหลือง */
  PENDING: { th: 'รอดำเนินการ', en: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  /** ยืนยันแล้ว - สีน้ำเงิน */
  CONFIRMED: { th: 'ยืนยันแล้ว', en: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  /** ชำระเงินแล้ว - สีเขียว */
  PAID: { th: 'ชำระเงินแล้ว', en: 'Paid', color: 'bg-green-100 text-green-800' },
  /** ยกเลิก - สีแดง */
  CANCELLED: { th: 'ยกเลิก', en: 'Cancelled', color: 'bg-red-100 text-red-800' },
  /** เสร็จสิ้น - สีเทา */
  COMPLETED: { th: 'เสร็จสิ้น', en: 'Completed', color: 'bg-gray-100 text-gray-800' },
}

/**
 * ป้ายกำกับประเภทการจอง
 * @description แสดงประเภทการจอง 2 ภาษา
 */
export const BOOKING_TYPE_LABELS = {
  /** จองโรงแรม/แพ็คเกจ */
  HOTEL: { th: 'โรงแรม', en: 'Hotel' },
  /** จองรถเช่า */
  CAR: { th: 'รถเช่า', en: 'Car Rental' },
  /** แพ็คเกจรวม (โรงแรม + รถ) */
  COMBO: { th: 'แพ็คเกจรวม', en: 'Combo Package' },
}

/**
 * ตัวเลือกระดับดาว
 * @description ใช้ในฟอร์มเลือกระดับดาวของโรงแรม
 */
export const STAR_RATINGS = [
  { value: 1, label: '1 ดาว' },
  { value: 2, label: '2 ดาว' },
  { value: 3, label: '3 ดาว' },
  { value: 4, label: '4 ดาว' },
  { value: 5, label: '5 ดาว' },
]

// ============================================================
// Default Values (ค่าเริ่มต้น)
// ============================================================

/** รูปภาพเริ่มต้นสำหรับโรงแรม (ถ้าไม่มีรูป) */
export const DEFAULT_HOTEL_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'

/** รูปภาพเริ่มต้นสำหรับรถ (ถ้าไม่มีรูป) */
export const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'

// ============================================================
// Pagination (การแบ่งหน้า)
// ============================================================

/** จำนวนรายการต่อหน้าเริ่มต้น */
export const DEFAULT_PAGE_SIZE = 10

/** ตัวเลือกจำนวนรายการต่อหน้า */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// ============================================================
// App Information (ข้อมูลแอปพลิเคชัน)
// ============================================================

/** ชื่อแอปพลิเคชัน */
export const APP_NAME = 'Got Journey Thailand'

/** คำอธิบายแอปพลิเคชัน (สำหรับ SEO) */
export const APP_DESCRIPTION = 'Premium Travel Booking Platform - Book luxury cars with exclusive villa packages'

/** URL ของแอปพลิเคชัน */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ============================================================
// Contact Information (ข้อมูลติดต่อ)
// ============================================================

/**
 * ข้อมูลติดต่อบริษัท
 * @description แสดงในหน้า Contact และ Footer
 */
export const CONTACT_INFO = {
  /** เบอร์โทรศัพท์ */
  phone: '+66 2123 4567',
  /** อีเมล */
  email: 'hello@gotjourneythailand.com',
  /** LINE Official Account */
  line: '@gotjourneythailand',
  /** ที่อยู่ */
  address: 'Thailand',
  /** เวลาทำการ */
  workingHours: '09:00 - 18:00 (Mon-Sat)',
}

/**
 * ลิงก์โซเชียลมีเดีย
 * @description ลิงก์ไปยัง Social Media ต่างๆ
 */
export const SOCIAL_LINKS = {
  /** Facebook Page */
  facebook: 'https://facebook.com/gotjourneythailand',
  /** Instagram */
  instagram: 'https://instagram.com/gotjourneythailand',
  /** LINE Official Account */
  line: 'https://line.me/ti/p/@gotjourneythailand',
}

// ============================================================
// Mock Data - Hotels (ข้อมูลจำลองโรงแรม)
// ============================================================

/**
 * ข้อมูลจำลองโรงแรม/แพ็คเกจ
 * @description ใช้สำหรับ Development และ Demo
 */
export const MOCK_HOTELS = [
  {
    id: 'mock-hotel-1',
    name_th: 'แพ็คเกจภูเก็ต โอเชี่ยน ไดรฟ์',
    name_en: 'Phuket Ocean Drive Package',
    description_th: 'สัมผัสประสบการณ์การพักผ่อนระดับ Ultra-Luxury ด้วยแพ็คเกจเช่ารถเปิดประทุน Mustang Convertible ขับเลียบชายหาดภูเก็ต พร้อมเข้าพักที่ Pool Villa ส่วนตัวที่มองเห็นวิวทะเล 180 องศา',
    description_en: 'Experience Ultra-Luxury with our Mustang Convertible package, driving along Phuket beaches and staying at a private Pool Villa with 180-degree sea view.',
    location_th: 'ภูเก็ต, ประเทศไทย',
    location_en: 'Phuket, Thailand',
    star_rating: 5,
    price_per_night: 12900,
    max_guests: 2,
    room_type_th: 'รถหรู + วิลล่าสระน้ำส่วนตัว',
    room_type_en: 'Luxury Car + Private Pool Villa',
    images: [
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    ],
    amenities_th: ['รถเปิดประทุน', 'สระว่ายน้ำส่วนตัว', 'รับส่งสนามบิน VIP', 'อาหารเย็นชมพระอาทิตย์ตก'],
    amenities_en: ['Convertible Car', 'Private Pool', 'VIP Airport Transfer', 'Sunset Dinner'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-hotel-2',
    name_th: 'เชียงใหม่ มิสท์ เอ็กซ์พลอเรอร์',
    name_en: 'Chiang Mai Mist Explorer',
    description_th: 'เปลี่ยนบรรยากาศไปรับลมหนาวที่เชียงใหม่ ขับ SUV 4x4 ตะลุยดอยอินทนนท์และแม่กำปอง พักรีสอร์ทสไตล์โมเดิร์นล้านนากลางหุบเขา',
    description_en: 'Change the atmosphere to enjoy the cool weather in Chiang Mai. Drive a 4x4 SUV to explore Doi Inthanon and Mae Kampong, stay at a modern Lanna-style resort in the valley.',
    location_th: 'เชียงใหม่, ประเทศไทย',
    location_en: 'Chiang Mai, Thailand',
    star_rating: 4,
    price_per_night: 5500,
    max_guests: 4,
    room_type_th: 'SUV + รีสอร์ทภูเขา',
    room_type_en: 'SUV + Mountain Resort',
    images: [
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800',
      'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800',
    ],
    amenities_th: ['4x4 SUV', 'อาหารเช้าล้านนา', 'ไกด์ท้องถิ่น', 'ประกันภัยรวม'],
    amenities_en: ['4x4 SUV', 'Lanna Breakfast', 'Local Guide', 'Insurance Included'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-hotel-3',
    name_th: 'กรุงเทพ ไนท์ ครูซ แอนด์ ไดรฟ์',
    name_en: 'Bangkok Night Cruise & Drive',
    description_th: 'เปิดมุมมองใหม่ของกรุงเทพฯ ยามค่ำคืนด้วยรถยุโรปพรีเมียมส่วนตัว พักห้องสวีทริมแม่น้ำเจ้าพระยา พร้อมดินเนอร์ล่องเรือสำราญชมวิววัดอรุณฯ',
    description_en: 'Discover a new perspective of Bangkok at night with a premium European car. Stay in a riverside suite with a dinner cruise viewing Wat Arun.',
    location_th: 'กรุงเทพฯ, ประเทศไทย',
    location_en: 'Bangkok, Thailand',
    star_rating: 5,
    price_per_night: 8900,
    max_guests: 2,
    room_type_th: 'Sedan + Riverside Suite',
    room_type_en: 'Sedan + Riverside Suite',
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
      'https://images.unsplash.com/photo-1563911546344-647715ed5d76?w=800',
    ],
    amenities_th: ['รถยุโรป Sedan', 'ดินเนอร์ล่องเรือ', 'เข้า Rooftop Bar', 'แชมเปญต้อนรับ'],
    amenities_en: ['European Sedan', 'Dinner Cruise', 'Rooftop Bar Access', 'Champagne Welcome'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

// ============================================================
// Mock Data - Cars (ข้อมูลจำลองรถ)
// ============================================================

/**
 * ข้อมูลจำลองรถเช่า
 * @description ใช้สำหรับ Development และ Demo
 */
export const MOCK_CARS = [
  {
    id: 'mock-car-1',
    name_th: 'มัสแตง คอนเวอร์ทิเบิล 2024',
    name_en: 'Mustang Convertible 2024',
    description_th: 'ไอคอนิกของความเท่ รถเปิดประทุนยอดนิยมสำหรับการเที่ยวทะเล ถ่ายรูปสวย ขับสนุก เครื่องยนต์แรงสะใจ พร้อมระบบเสียงพรีเมียม',
    description_en: 'Iconic and stylish, the popular convertible for beach trips, great for photos and fun driving with a powerful engine and premium sound system.',
    car_type_th: 'รถสปอร์ตเปิดประทุน',
    car_type_en: 'Sport Convertible',
    max_passengers: 4,
    price_per_day: 9500,
    images: ['https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=1200'],
    includes_th: ['ประกันชั้นหนึ่ง', 'ทำความสะอาดและฆ่าเชื้อ', 'น้ำมันเต็มถัง', 'Apple CarPlay'],
    includes_en: ['First Class Insurance', 'Cleaned & Disinfected', 'Full Tank', 'Apple CarPlay'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-car-2',
    name_th: 'โตโยต้า อัลพาร์ด VIP',
    name_en: 'Toyota Alphard VIP',
    description_th: 'ที่สุดของความสะดวกสบาย เหมาะสำหรับการเที่ยวแบบครอบครัวหรือผู้ใหญ่ เบาะนวดไฟฟ้าทั้งคัน มีตู้เย็นขนาดเล็ก และระบบความบันเทิงครบวงจร',
    description_en: 'The ultimate comfort, perfect for family trips or VIP guests. Electric massage seats throughout, mini fridge, and complete entertainment system.',
    car_type_th: 'VIP Van',
    car_type_en: 'VIP Van',
    max_passengers: 7,
    price_per_day: 5500,
    images: ['https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=1200'],
    includes_th: ['พร้อมคนขับ', 'WIFI', 'น้ำและเครื่องดื่ม', 'บริการ VIP Lane'],
    includes_en: ['Driver Available', 'WIFI', 'Water & Refreshment', 'VIP Lane Service'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
]
