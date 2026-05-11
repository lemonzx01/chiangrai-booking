'use client'

import { useTranslation } from 'react-i18next'
import { Search, CreditCard, Plane } from 'lucide-react'
import Reveal from './Reveal'

const STEPS = [
  {
    icon: Search,
    th: { title: 'ค้นหาที่ใช่', body: 'เลือกที่พักหรือรถจากรายการที่ทีมเราคัดสรรเอง' },
    en: { title: 'Search', body: 'Browse stays and cars hand-picked by our team' },
  },
  {
    icon: CreditCard,
    th: { title: 'จองและจ่าย', body: 'ชำระเงินปลอดภัยผ่าน Stripe หรือ PromptPay' },
    en: { title: 'Book + pay', body: 'Secure checkout via Stripe or PromptPay' },
  },
  {
    icon: Plane,
    th: { title: 'ออกเดินทาง', body: 'รับ confirmation ทางอีเมล + เก็บเป็น invoice PDF' },
    en: { title: 'Travel', body: 'Get email confirmation + downloadable invoice' },
  },
] as const

export default function HowItWorks() {
  const { i18n } = useTranslation()
  const lang = i18n.language

  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <Reveal>
          <div className="text-center mb-12 sm:mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-medium text-slate-900 tracking-tight mb-2">
              {lang === 'th' ? 'จองง่ายใน 3 ขั้นตอน' : 'Three steps to your trip'}
            </h2>
            {/* Italic line is a typographic accent, not a translation
                of the title — stays in the same language as the title
                so it doesn't read as a glitch. */}
            <p className="text-sm text-slate-500 italic font-display">
              {lang === 'th' ? 'ทุกอย่างจบในเว็บเดียว' : 'All in one place'}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
          {STEPS.map((s, idx) => {
            const copy = lang === 'th' ? s.th : s.en
            const Icon = s.icon
            return (
              <Reveal key={copy.title} delay={idx * 100}>
                <div className="relative bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 h-full">
                  <span className="absolute top-5 right-6 text-5xl font-display italic text-slate-100 leading-none select-none">
                    {idx + 1}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5 relative z-10">
                    <Icon size={20} className="text-slate-700" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-display text-lg font-medium text-slate-900 tracking-tight mb-2 relative z-10">
                    {copy.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed relative z-10">
                    {copy.body}
                  </p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
