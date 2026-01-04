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
import { Compass, Mail, Phone } from 'lucide-react'

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
    <footer className="bg-slate-950 text-slate-400 pt-24 pb-16 mt-24 relative overflow-hidden">
      {/* เส้น gradient ด้านบน */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-30"></div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Grid 4 คอลัมน์ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 mb-20 text-center sm:text-left">
          {/* คอลัมน์ 1: โลโก้และรายละเอียด */}
          <div className="lg:col-span-1">
            {/* โลโก้ */}
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-8">
              <Compass size={28} className="text-indigo-400" />
              <span className="text-2xl font-black text-white tracking-tight">Got Journey Thailand</span>
            </div>
            {/* รายละเอียดบริษัท */}
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto sm:mx-0 font-medium">
              จองทริปเที่ยวพ่วงรถเช่าพรีเมียม ดิวลับที่คุณหาไม่ได้จากที่ไหน
              ทุกที่พักเราไปดิวเองกับมือ
            </p>
          </div>

          {/* คอลัมน์ 2: เมนู */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">
              Menu
            </h4>
            <ul className="space-y-4 text-sm font-bold tracking-widest uppercase">
              <li>
                <Link href="/hotels" className="hover:text-indigo-400 transition-colors">
                  แพ็คเกจทริป
                </Link>
              </li>
              <li>
                <Link href="/cars" className="hover:text-indigo-400 transition-colors">
                  รถเช่ารายวัน
                </Link>
              </li>
            </ul>
          </div>

          {/* คอลัมน์ 3: ข้อมูลติดต่อ */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">
              Support
            </h4>
            <ul className="space-y-4 text-sm font-bold">
              {/* อีเมล */}
              <li className="flex justify-center sm:justify-start gap-4 items-center hover:text-white transition-colors">
                <Mail size={18} className="text-indigo-500" /> hello@gotjourneythailand.com
              </li>
              {/* โทรศัพท์ */}
              <li className="flex justify-center sm:justify-start gap-4 items-center hover:text-white transition-colors">
                <Phone size={18} className="text-indigo-500" /> +66 2 123 4567
              </li>
            </ul>
          </div>

          {/* คอลัมน์ 4: พาร์ทเนอร์ */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">
              Partner
            </h4>
            <Link
              href="/contact"
              className="inline-block bg-white/5 border border-white/10 px-8 py-3 rounded-xl font-black text-xs uppercase text-white hover:bg-white hover:text-slate-950 transition-all"
            >
              ร่วมเป็นพาร์ทเนอร์
            </Link>
          </div>
        </div>

        {/* ลิขสิทธิ์ */}
        <div className="pt-12 border-t border-white/5 text-center flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
            © 2024 Got Journey Thailand. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
