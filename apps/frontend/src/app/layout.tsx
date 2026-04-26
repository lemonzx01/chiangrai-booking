/**
 * ============================================================
 * Root Layout - Layout หลักของแอปพลิเคชัน (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - กำหนด HTML structure พื้นฐาน
 *   - โหลด Google Font (Plus Jakarta Sans)
 *   - กำหนด Metadata สำหรับ SEO, Open Graph, Twitter
 *   - ฝัง Schema.org JSON-LD ของธุรกิจ (Organization +
 *     TravelAgency) เพื่อให้ Google แสดง rich result
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
import type { Metadata, Viewport } from 'next'

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
  // `display: 'swap'` shows the system font immediately and swaps to
  // Plus Jakarta when it loads — eliminates the FOIT (flash of
  // invisible text) that hurts LCP.
  display: 'swap',
  // Preload only the regular weight in <link rel="preload">; the rest
  // ship via CSS but don't block first paint.
  preload: true,
  fallback: [
    'system-ui',
    '-apple-system',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'sans-serif',
  ],
  // `adjustFontFallback` accepts a boolean for Plus Jakarta Sans
  // (Google fonts API). `true` lets next/font auto-balance the
  // fallback metrics so the swap doesn't shift layout.
  adjustFontFallback: true,
})

// ============================================================
// Site Constants (used by metadata + JSON-LD)
// ============================================================

const SITE_NAME = 'Got Journey Thailand'
const SITE_DESCRIPTION_EN =
  'Book premium cars with exclusive villa packages. Experience luxury travel in Chiang Rai, Thailand.'
const SITE_DESCRIPTION_TH =
  'จองทริปเที่ยวพ่วงรถเช่าพรีเมียม ดิวลับที่คุณหาไม่ได้จากที่ไหน ทุกที่พักเราไปดิวเองกับมือ'

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://gotjourneythailand.com'
).replace(/\/$/, '')

// ============================================================
// Metadata Configuration
// ============================================================

/**
 * Metadata สำหรับ SEO และ Social Sharing
 *
 * - metadataBase: base URL for resolving relative OG image paths
 * - title.template: applied to every page that sets just a string
 *   title — e.g. "จัดการการจอง" becomes "จัดการการจอง | Got Journey Thailand"
 * - openGraph + twitter: fallback card for pages that don't set
 *   their own OG tags
 * - alternates.canonical: defaults to the current path
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Premium Travel Booking Platform`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION_EN,
  keywords: [
    'travel',
    'booking',
    'hotel',
    'car rental',
    'chiang rai',
    'thailand',
    'vacation',
    'เที่ยวเชียงราย',
    'จองที่พัก',
    'รถเช่าเชียงราย',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      th: '/',
      en: '/',
    },
  },
  // OG / Twitter images are auto-wired by app/opengraph-image.tsx
  // (Next.js convention) — that takes priority over anything we
  // hard-code here, so we omit `images` and just supply the text.
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    alternateLocale: ['en_US'],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Premium Travel Booking Platform`,
    description: SITE_DESCRIPTION_EN,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Premium Travel Booking Platform`,
    description: SITE_DESCRIPTION_EN,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  // Favicons / apple-touch-icon are auto-wired by app/icon.tsx
  // and app/apple-icon.tsx (Next.js convention). Manifest is
  // emitted by app/manifest.ts.
  manifest: '/manifest.webmanifest',
}

// ============================================================
// Viewport Configuration (split per Next.js 14 recommendation)
// ============================================================

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafbfc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
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
// JSON-LD (Schema.org) — rendered inline so crawlers see it
// without waiting for client JS
// ============================================================

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      sameAs: [] as string[],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'hello@gotjourneythailand.com',
        telephone: '+66-2-123-4567',
        contactType: 'customer service',
        areaServed: 'TH',
        availableLanguage: ['th', 'en'],
      },
    },
    {
      '@type': 'TravelAgency',
      '@id': `${SITE_URL}/#travelagency`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION_EN,
      url: SITE_URL,
      telephone: '+66-2-123-4567',
      email: 'hello@gotjourneythailand.com',
      areaServed: {
        '@type': 'AdministrativeArea',
        name: 'Chiang Rai, Thailand',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION_TH,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: ['th-TH', 'en-US'],
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/hotels?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
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
        {/* Structured data for Google — renders in <body>, which is
            allowed by the spec. Keeping it here (vs. <head>) avoids
            a hydration mismatch with Next's auto-generated head. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Main Content */}
        {children}

        {/* Portal สำหรับ DatePicker Component */}
        <div id="datepicker-root" />
      </body>
    </html>
  )
}
