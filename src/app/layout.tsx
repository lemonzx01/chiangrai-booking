/**
 * ============================================================
 * Root Layout - Layout หลักของแอปพลิเคชัน (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - กำหนด HTML structure พื้นฐาน
 *   - โหลด Google Font (Plus Jakarta Sans)
 *   - กำหนด Metadata สำหรับ SEO และ Open Graph
 *
 * การใช้งาน:
 *   ครอบ layout ทั้งหมดของแอปพลิเคชัน
 *   ทุกหน้าจะถูก render ภายใน layout นี้
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Type สำหรับ Next.js Metadata */
import type { Metadata } from 'next'

/** Google Font - Plus Jakarta Sans */
import { Plus_Jakarta_Sans } from 'next/font/google'

/** Global CSS styles */
import './globals.css'

// ============================================================
// Font Configuration
// ============================================================

/**
 * ตั้งค่า Plus Jakarta Sans font
 *
 * - subsets: รองรับภาษาละติน
 * - weight: น้ำหนักตัวอักษรตั้งแต่ 300-800
 * - variable: ใช้เป็น CSS variable
 */
const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

// ============================================================
// Metadata Configuration
// ============================================================

/**
 * Metadata สำหรับ SEO และ Social Sharing
 *
 * - title: ชื่อเว็บไซต์
 * - description: คำอธิบายสำหรับ search engine
 * - keywords: คำค้นหาที่เกี่ยวข้อง
 * - openGraph: ข้อมูลสำหรับ social media sharing
 */
export const metadata: Metadata = {
  title: 'Got Journey Thailand | Premium Travel Booking Platform',
  description: 'Book premium cars with exclusive villa packages. Experience luxury travel in Chiang Rai, Thailand.',
  keywords: ['travel', 'booking', 'hotel', 'car rental', 'chiang rai', 'thailand', 'vacation'],
  authors: [{ name: 'Got Journey Thailand' }],
  openGraph: {
    title: 'Got Journey Thailand | Premium Travel Booking Platform',
    description: 'Book premium cars with exclusive villa packages in Chiang Rai',
    type: 'website',
  },
}

// ============================================================
// Component Props
// ============================================================

/**
 * Props สำหรับ RootLayout
 */
interface RootLayoutProps {
  /** Children components ที่จะแสดงภายใน layout */
  children: React.ReactNode
}

// ============================================================
// Main Component
// ============================================================

/**
 * Root Layout Component
 *
 * @description
 *   Layout หลักที่ครอบทั้งแอปพลิเคชัน
 *   กำหนด HTML, body และ CSS variables
 *
 * @param {RootLayoutProps} props - Props ของ component
 * @returns {JSX.Element} Root layout UI
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="th" suppressHydrationWarning>
      {/* ============================================================
          Body - พร้อม Font และ Background
          ============================================================ */}
      <body
        className={`${font.variable} font-sans bg-[#fafbfc] text-slate-900 antialiased`}
        suppressHydrationWarning
      >
        {/* Main Content */}
        {children}

        {/* Portal สำหรับ DatePicker Component */}
        <div id="datepicker-root" />
      </body>
    </html>
  )
}
