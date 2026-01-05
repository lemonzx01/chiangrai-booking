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
      {/* Container หลัก - min-h-screen ให้ความสูงเต็มจอ */}
      <div className="min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white bg-[#fafbfc]">
        {/* Navbar - แถบเมนูด้านบน */}
        <Navbar />

        {/* Main Content - เนื้อหาหลักของแต่ละหน้า */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Footer - ส่วนท้ายของหน้า */}
        <Footer />
      </div>
    </I18nProvider>
  )
}
