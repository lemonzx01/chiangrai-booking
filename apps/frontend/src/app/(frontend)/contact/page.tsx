/**
 * ============================================================
 * Contact Page - หน้าติดต่อเรา (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงฟอร์มติดต่อเรา
 *   - แสดงข้อมูลการติดต่อ (ที่อยู่, โทรศัพท์, อีเมล, LINE)
 *   - รับข้อความจากผู้ใช้
 *
 * Route:
 *   - /contact - หน้าติดต่อเรา
 *
 * Features:
 *   - Form ส่งข้อความ (ชื่อ, อีเมล, โทร, ข้อความ)
 *   - Success state เมื่อส่งสำเร็จ
 *   - ข้อมูลติดต่อจาก CONTACT_INFO
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks สำหรับจัดการ state */
import { useState } from 'react'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Lucide icons สำหรับ UI */
import { MapPin, Phone, Mail, MessageCircle, Clock } from 'lucide-react'

/** UI Components */
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

/** ข้อมูลติดต่อจาก constants */
const CONTACT_INFO = {
  address: 'Chiang Rai, Thailand',
  phone: '+66 81 234 5678',
  email: 'admin@gotjourneythailand.com',
  line: '@gotjourneythailand',
  workingHours: '09:00 - 18:00',
}


// ============================================================
// Main Component
// ============================================================

/**
 * หน้าติดต่อเรา
 *
 * @description
 *   แสดงฟอร์มติดต่อและข้อมูลการติดต่อ
 *   2 columns: ฟอร์ม (ซ้าย) + ข้อมูลติดต่อ (ขวา)
 *
 * @returns {JSX.Element} Contact page UI
 */
export default function ContactPage() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { t } = useTranslation()

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** State สำหรับข้อมูลฟอร์ม */
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })

  /** State สำหรับสถานะการส่ง */
  const [submitted, setSubmitted] = useState(false)

  // ----------------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------------
  /**
   * จัดการการ submit ฟอร์ม
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // ใน Production จะส่งไป API
    setSubmitted(true)
  }

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* ============================================================
          Header Section - Gradient Background
          ============================================================ */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-xl text-white/80">{t('contact.subtitle')}</p>
        </div>
      </div>

      {/* ============================================================
          Main Content - 2 Columns
          ============================================================ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ============================================================
              คอลัมน์ซ้าย - Contact Form
              ============================================================ */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Success State - หลังส่งสำเร็จ */}
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('contact.form.successTitle')}</h2>
                <p className="text-slate-500">{t('contact.form.successMessage')}</p>
              </div>
            ) : (
              // Form State - ก่อนส่ง
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ชื่อ */}
                <Input
                  label={t('contact.form.name')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('contact.form.namePlaceholder')}
                  required
                />
                {/* อีเมล */}
                <Input
                  type="email"
                  label={t('contact.form.email')}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  required
                />
                {/* โทรศัพท์ */}
                <Input
                  type="tel"
                  label={t('contact.form.phone')}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0812345678"
                />
                {/* ข้อความ */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {t('contact.form.message')}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t('contact.form.messagePlaceholder')}
                    rows={5}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {/* ปุ่มส่ง */}
                <Button type="submit" size="lg" className="w-full">
                  {t('contact.form.send')}
                </Button>
              </form>
            )}
          </div>

          {/* ============================================================
              คอลัมน์ขวา - Contact Info
              ============================================================ */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">{t('contact.infoTitle')}</h2>
              <div className="space-y-6">
                {/* ที่อยู่ */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{t('contact.info.address')}</h3>
                    <p className="text-slate-500">{CONTACT_INFO.address}</p>
                  </div>
                </div>

                {/* โทรศัพท์ */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{t('contact.info.phone')}</h3>
                    <p className="text-slate-500">{CONTACT_INFO.phone}</p>
                  </div>
                </div>

                {/* อีเมล */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{t('contact.info.email')}</h3>
                    <p className="text-slate-500">{CONTACT_INFO.email}</p>
                  </div>
                </div>

                {/* เวลาทำการ */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{t('contact.info.hours')}</h3>
                    <p className="text-slate-500">{CONTACT_INFO.workingHours}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
