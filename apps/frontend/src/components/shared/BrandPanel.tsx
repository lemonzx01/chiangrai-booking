'use client'

import Image from 'next/image'
import { HERO_BLUR_DATA_URL } from '@/lib/blurPlaceholder'
import Link from 'next/link'
import { Compass, Sparkles, Heart, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface BrandPanelProps {
  variant?: 'login' | 'register'
}

export default function BrandPanel({ variant = 'login' }: BrandPanelProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language

  const headlineTh =
    variant === 'register'
      ? 'เริ่มต้นการเดินทางที่น่าจดจำ'
      : 'ยินดีต้อนรับกลับมา'
  const headlineEn = variant === 'register' ? 'Begin a journey to remember' : 'Welcome back'

  const subTh =
    variant === 'register'
      ? 'สมัครฟรี ใช้ทุกฟีเจอร์ และเริ่มสะสมแต้มทันทีที่จองครั้งแรก'
      : 'เข้าสู่ระบบเพื่อดูการจอง สะสมแต้ม และจัดการรายการที่ชอบ'
  const subEn =
    variant === 'register'
      ? 'Free to join. Unlock every feature and earn points on your first booking.'
      : 'Sign in to view bookings, earn loyalty, and manage your saved trips.'

  const benefits = [
    {
      icon: Sparkles,
      th: 'สะสมแต้ม + อัปเทียร์ Bronze · Silver · Gold',
      en: 'Earn loyalty points, climb Bronze · Silver · Gold tiers',
    },
    {
      icon: Heart,
      th: 'รายการที่ชอบและประวัติการดู ซิงค์ทุกอุปกรณ์',
      en: 'Wishlist and recently-viewed sync across devices',
    },
    {
      icon: Clock,
      th: 'จองเร็วขึ้น เติมข้อมูลผู้จองอัตโนมัติทุกครั้ง',
      en: 'Faster checkout — auto-fill name, email, and phone',
    },
  ]

  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-900 rounded-3xl p-10 min-h-[640px]">
      {/* Same self-hosted asset as the home hero, so the two pages
          share one optimiser cache entry rather than paying for two
          encodes of the same photograph. */}
      <Image
        src="/images/hero-journey.jpg"
        alt=""
        fill
        sizes="50vw"
        className="object-cover opacity-40"
        placeholder="blur"
        blurDataURL={HERO_BLUR_DATA_URL}
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-slate-900/40" />

      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white">
            <Compass size={20} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-extrabold text-white tracking-tight">
            Got Journey
            <span className="text-white/70 font-light italic font-display">{' '}Thailand</span>
          </span>
        </Link>
      </div>

      <div className="relative z-10">
        <h2 className="text-3xl xl:text-4xl text-white leading-[1.1] tracking-tight mb-2 max-w-md">
          <span className="font-bold">{lang === 'th' ? headlineTh : headlineEn}</span>
        </h2>
        <div className="h-px w-12 bg-white/40 my-4" />
        <p className="text-base text-white/75 max-w-sm leading-relaxed font-light mb-8">
          {lang === 'th' ? subTh : subEn}
        </p>

        <ul className="space-y-3.5">
          {benefits.map(({ icon: Icon, th, en }) => (
            <li key={th} className="flex items-start gap-3 text-white/85 text-sm">
              <span className="mt-0.5 w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-white" />
              </span>
              <span className="leading-relaxed">{lang === 'th' ? th : en}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10">
        <p className="text-xs text-white/50 italic font-display">
          {lang === 'th'
            ? '"ทุกที่พักเราไปดิวเองกับมือ"'
            : '"Every stay hand-picked by our team"'}
        </p>
      </div>
    </div>
  )
}
