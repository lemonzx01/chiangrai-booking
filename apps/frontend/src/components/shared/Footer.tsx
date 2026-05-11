/**
 * ============================================================
 * Footer Component - ส่วนท้ายของเว็บไซต์
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงข้อมูลติดต่อและลิงก์สำคัญ
 *   - ไม่แสดงในหน้า Admin
 *
 * ส่วนประกอบ:
 *   - โลโก้และรายละเอียดบริษัท
 *   - เมนูลิงก์
 *   - ข้อมูลติดต่อ (อีเมล, โทรศัพท์)
 *   - ปุ่มสมัครเป็นพาร์ทเนอร์
 *   - ลิขสิทธิ์
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Mail, Phone, Facebook, Instagram, Youtube } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import NewsletterSignup from './NewsletterSignup'

// ============================================================
// Component Definition
// ============================================================

/**
 * Footer component
 *
 * @description ส่วนท้ายของเว็บไซต์ที่แสดงข้อมูลติดต่อ
 *              ลิงก์เมนู และข้อมูลบริษัท
 *              ไม่แสดงในหน้า Admin
 *
 * @returns Footer element หรือ null (ถ้าเป็นหน้า Admin)
 */
export default function Footer() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------

  const pathname = usePathname()
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  // ----------------------------------------------------------
  // Conditional Rendering
  // ----------------------------------------------------------

  /**
   * ไม่แสดง Footer ในหน้า Admin
   */
  if (pathname?.startsWith('/admin')) return null

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 sm:pt-20 lg:pt-24 pb-12 sm:pb-16 mt-16 sm:mt-20 lg:mt-24 relative overflow-hidden">
      {/* เส้น gradient ด้านบน */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-30"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid: 1 col on mobile, 2 col on small, 5 col on large.
            Brand (description) takes 2 cols on lg so the supporting
            columns line up evenly to its right. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 lg:gap-12 mb-12 sm:mb-16 lg:mb-20 text-center sm:text-left">
          {/* คอลัมน์ 1: โลโก้และรายละเอียด */}
          <div className="lg:col-span-2">
            {/* โลโก้ */}
            <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-6 sm:mb-8">
              <Compass size={24} className="sm:w-[28px] sm:h-[28px] text-white/60" />
              <span className="text-xl sm:text-2xl font-display font-medium text-white tracking-tight">Got Journey Thailand</span>
            </div>
            {/* รายละเอียดบริษัท */}
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto sm:mx-0 font-medium">
              {t('footer.description') || 'จองทริปเที่ยวพ่วงรถเช่าพรีเมียม ดิวลับที่คุณหาไม่ได้จากที่ไหน ทุกที่พักเราไปดิวเองกับมือ'}
            </p>
            {/* Social row — rendered for layout, disabled until the
                accounts go live. Tabindex -1 + aria-disabled keeps
                them out of the tab order. */}
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-6">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Instagram, label: 'Instagram' },
                { icon: Youtube, label: 'YouTube' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  aria-label={label}
                  aria-disabled="true"
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/30"
                >
                  <Icon size={16} strokeWidth={1.75} />
                </span>
              ))}
            </div>
          </div>

          {/* คอลัมน์ 2: เมนู */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-[0.3em] mb-6 sm:mb-8">
              {t('navbar.menu') || (lang === 'th' ? 'เมนู' : 'Menu')}
            </h4>
            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm font-bold tracking-widest uppercase">
              <li>
                <Link href="/hotels" className="hover:text-white/60 transition-colors">
                  {t('navbar.packages')}
                </Link>
              </li>
              <li>
                <Link href="/cars" className="hover:text-white/60 transition-colors">
                  {t('navbar.cars')}
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white/60 transition-colors">
                  {lang === 'th' ? 'รายการที่ชอบ' : 'Wishlist'}
                </Link>
              </li>
            </ul>
          </div>

          {/* คอลัมน์: บัญชีของฉัน — quick jumps to authenticated
              areas. Links work whether or not the user is signed in;
              the destinations redirect to /login as needed. */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-[0.3em] mb-6 sm:mb-8">
              {lang === 'th' ? 'บัญชี' : 'Account'}
            </h4>
            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm font-bold tracking-widest uppercase">
              <li>
                <Link href="/profile" className="hover:text-white/60 transition-colors">
                  {lang === 'th' ? 'โปรไฟล์' : 'Profile'}
                </Link>
              </li>
              <li>
                <Link href="/profile#bookings" className="hover:text-white/60 transition-colors">
                  {lang === 'th' ? 'การจองของฉัน' : 'My bookings'}
                </Link>
              </li>
              <li>
                <Link href="/profile#loyalty" className="hover:text-white/60 transition-colors">
                  {lang === 'th' ? 'แต้มสะสม' : 'Loyalty'}
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white/60 transition-colors">
                  {lang === 'th' ? 'รายการที่ชอบ' : 'Wishlist'}
                </Link>
              </li>
            </ul>
          </div>

          {/* คอลัมน์ 3: ข้อมูลติดต่อ */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-[0.3em] mb-6 sm:mb-8">
              {t('footer.support') || (lang === 'th' ? 'สนับสนุน' : 'Support')}
            </h4>
            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm font-bold">
              {/* อีเมล */}
              <li className="flex justify-center sm:justify-start gap-3 sm:gap-4 items-center hover:text-white transition-colors break-all">
                <Mail size={16} className="sm:w-[18px] sm:h-[18px] text-white/60 flex-shrink-0" /> 
                <span className="break-words">hello@gotjourneythailand.com</span>
              </li>
              {/* โทรศัพท์ */}
              <li className="flex justify-center sm:justify-start gap-3 sm:gap-4 items-center hover:text-white transition-colors">
                <Phone size={16} className="sm:w-[18px] sm:h-[18px] text-white/60 flex-shrink-0" /> 
                <span>+66 2 123 4567</span>
              </li>
            </ul>
          </div>

          {/* คอลัมน์ 4: พาร์ทเนอร์ */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-[0.3em] mb-6 sm:mb-8">
              {t('footer.partner') || (lang === 'th' ? 'พาร์ทเนอร์' : 'Partner')}
            </h4>
            <Link
              href="/contact"
              className="inline-block bg-white/5 border border-white/10 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-xs uppercase text-white hover:bg-white hover:text-slate-950 transition-all text-center w-full sm:w-auto"
            >
              {t('footer.becomePartner') || 'ร่วมเป็นพาร์ทเนอร์'}
            </Link>
          </div>
        </div>

        {/* Newsletter — single-row email capture above the legal
            strip. POSTs to /api/email/subscribe which surfaces a
            row in the admin inbox until a dedicated subscribers
            table is warranted. */}
        <div className="border-t border-white/5 pt-8 sm:pt-10 mb-8 sm:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
          <div className="text-center md:text-left">
            <h4 className="text-white font-semibold text-xs uppercase tracking-[0.3em] mb-2">
              {lang === 'th' ? 'รับข่าวสารและโปรโมชั่น' : 'Stay in the loop'}
            </h4>
            <p className="text-xs sm:text-sm text-white/40 font-light">
              {lang === 'th'
                ? 'ดิวลับและทริปหายากส่งตรงถึงอีเมลของคุณ'
                : 'Quiet drops and curated trips, straight to your inbox.'}
            </p>
          </div>
          <NewsletterSignup />
        </div>

        {/* ลิขสิทธิ์ + ลิงก์กฎหมาย */}
        <div className="pt-8 sm:pt-12 border-t border-white/5 text-center flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="text-[9px] sm:text-[10px] font-medium text-white/20 uppercase tracking-[0.3em] sm:tracking-[0.4em]">
            {lang === 'th'
              ? '© 2024 Got Journey Thailand สงวนลิขสิทธิ์'
              : '© 2024 Got Journey Thailand. All Rights Reserved.'}
          </div>
          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs font-semibold text-white/40 uppercase tracking-widest">
            <Link href="/terms" className="hover:text-white transition-colors">
              {lang === 'th' ? 'ข้อกำหนด' : 'Terms'}
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              {lang === 'th' ? 'ความเป็นส่วนตัว' : 'Privacy'}
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              {lang === 'th' ? 'ติดต่อ' : 'Contact'}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
