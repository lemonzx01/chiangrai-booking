/**
 * ============================================================
 * Admin Layout - Layout หลักสำหรับหน้า Admin (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ครอบ Layout สำหรับทุกหน้าใน Admin section
 *   - จัด Provider สำหรับระบบ i18n
 *   - กำหนด background และ styling พื้นฐาน
 *
 * โครงสร้าง:
 *   - I18nProvider: รองรับการแปลภาษา
 *   - Container: พื้นหลังสีเทาอ่อน min-height เต็มจอ
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Provider สำหรับระบบ i18n (รองรับภาษาไทย/อังกฤษ) */
import I18nProvider from '@/i18n/client'

// ============================================================
// Component Props
// ============================================================

/**
 * Props สำหรับ AdminLayout
 */
interface AdminLayoutProps {
  /** Children components ที่จะแสดงภายใน layout */
  children: React.ReactNode
}

// ============================================================
// Main Component
// ============================================================

/**
 * Admin Layout Component
 *
 * @description
 *   Layout wrapper สำหรับทุกหน้าใน /admin/*
 *   ครอบด้วย I18nProvider เพื่อรองรับการแปลภาษา
 *
 * @param {AdminLayoutProps} props - Props ของ component
 * @returns {JSX.Element} Admin layout พร้อม i18n support
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <I18nProvider>
      {/* ============================================================
          Container - พื้นหลังสีเทาอ่อน
          ============================================================ */}
      <div className="min-h-screen bg-slate-50 admin-ui">
        {children}
      </div>
    </I18nProvider>
  )
}
