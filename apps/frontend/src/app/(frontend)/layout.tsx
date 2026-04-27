/**
 * ============================================================
 * Frontend Layout - โครงสร้างหลักของหน้า Frontend
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - กำหนดโครงสร้างหน้าเว็บสำหรับผู้ใช้ทั่วไป
 *   - รวม Navbar และ Footer
 *   - ครอบด้วย I18nProvider สำหรับการเปลี่ยนภาษา
 *
 * โครงสร้าง:
 *   - I18nProvider (ครอบทั้งหมด)
 *     - Navbar (ด้านบน)
 *     - main (เนื้อหาหลัก)
 *     - Footer (ด้านล่าง)
 *
 * Note:
 *   - Layout นี้ใช้โดยอัตโนมัติสำหรับทุกหน้าใน (frontend) folder
 *   - ไม่รวม Admin pages (มี layout แยก)
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Navbar component - แถบเมนูด้านบน */
import Navbar from '@/components/shared/Navbar'

/** Footer component - ส่วนท้ายของหน้า */
import Footer from '@/components/shared/Footer'

/** Cookie consent banner (PDPA) */
import CookieConsent from '@/components/shared/CookieConsent'

/** Toast / notification system — replaces window.alert() across the site. */
import { ToastProvider } from '@/components/shared/Toast'

/** Branded confirm dialog — replaces window.confirm() */
import { ConfirmDialogProvider } from '@/components/shared/ConfirmDialog'

/** Skip-to-content link — first focusable element for keyboard users. */
import SkipLink from '@/components/shared/SkipLink'

/** Floating LINE / chat button — reveals on scroll, shows everywhere */
import FloatingContact from '@/components/shared/FloatingContact'

/** PWA "Add to Home Screen" prompt — only mounts once per user */
import PwaInstallPrompt from '@/components/shared/PwaInstallPrompt'

/** I18n Provider สำหรับ Client-side localization */
import I18nProvider from '@/i18n/client'

// ============================================================
// Layout Component
// ============================================================

/**
 * Frontend Layout Component
 *
 * @description
 *   Layout หลักสำหรับหน้า Frontend ทั้งหมด
 *   ประกอบด้วย Navbar, เนื้อหาหลัก, และ Footer
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - เนื้อหาของแต่ละหน้า
 *
 * @returns {JSX.Element} Layout พร้อม Navbar และ Footer
 */
export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // I18nProvider ครอบทั้งหมดเพื่อให้ใช้ translation ได้
    <I18nProvider>
      <ToastProvider>
        <ConfirmDialogProvider>
          {/* WCAG 2.4.1 — first focusable element jumps past the navbar */}
          <SkipLink />

        {/* Container หลัก - min-h-screen ให้ความสูงเต็มจอ */}
        <div className="min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white bg-[#fafbfc]">
          {/* Navbar - แถบเมนูด้านบน */}
          <Navbar />

          {/* Main Content - id matches SkipLink href */}
          <main id="main-content" className="flex-1 flex flex-col">
            {children}
          </main>

          {/* Footer - ส่วนท้ายของหน้า */}
          <Footer />

          {/* Cookie consent banner (PDPA-compliant) */}
          <CookieConsent />

          {/* Floating LINE button — auto-hides on detail pages where
              StickyBookBar already occupies the bottom-right */}
          <FloatingContact hideOnMobileWhenStickyBarVisible />

          {/* PWA install prompt — appears after 30s on supported browsers,
              respects 14-day dismiss, hidden if already installed */}
          <PwaInstallPrompt />
          </div>
        </ConfirmDialogProvider>
      </ToastProvider>
    </I18nProvider>
  )
}
