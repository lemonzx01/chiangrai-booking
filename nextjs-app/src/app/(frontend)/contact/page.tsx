'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Mail, MessageCircle, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { CONTACT_INFO } from '@/lib/constants'

export default function ContactPage() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, send to API
    console.log('Contact form submitted:', formData)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-xl text-white/80">{t('contact.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">ส่งข้อความสำเร็จ!</h2>
                <p className="text-slate-500">เราจะติดต่อกลับโดยเร็วที่สุด</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label={t('contact.form.name')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="กรอกชื่อของคุณ"
                  required
                />
                <Input
                  type="email"
                  label={t('contact.form.email')}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  required
                />
                <Input
                  type="tel"
                  label={t('contact.form.phone')}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0812345678"
                />
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {t('contact.form.message')}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="เขียนข้อความของคุณ..."
                    rows={5}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  {t('contact.form.send')}
                </Button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">ข้อมูลติดต่อ</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{t('contact.info.address')}</h3>
                    <p className="text-slate-500">{CONTACT_INFO.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{t('contact.info.phone')}</h3>
                    <p className="text-slate-500">{CONTACT_INFO.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{t('contact.info.email')}</h3>
                    <p className="text-slate-500">{CONTACT_INFO.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{t('contact.info.line')}</h3>
                    <p className="text-slate-500">{CONTACT_INFO.line}</p>
                  </div>
                </div>

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
