'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/admin/Sidebar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PartnerType, Partner } from '@/types'

export default function EditPartnerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: PartnerType.HOTEL as PartnerType,
    stripe_account_id: '',
    commission_rate: 10.0,
    is_active: true,
  })

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const res = await fetch(`/api/partners/${params.id}`)
        const data: Partner = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'ไม่สามารถดึงข้อมูลพาร์ทเนอร์ได้')
        }

        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          type: data.type,
          stripe_account_id: data.stripe_account_id || '',
          commission_rate: data.commission_rate,
          is_active: data.is_active,
        })
      } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาด')
      } finally {
        setFetching(false)
      }
    }

    fetchPartner()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        ...formData,
        commission_rate: parseFloat(String(formData.commission_rate)),
      }

      const res = await fetch(`/api/partners/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถอัปเดตพาร์ทเนอร์ได้')
      }

      // Redirect to partners list
      window.location.href = '/admin/partners'
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง')
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="text-center py-12">กำลังโหลด...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/admin/partners"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft size={20} />
            กลับไปรายการพาร์ทเนอร์
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">แก้ไขพาร์ทเนอร์</h1>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ชื่อพาร์ทเนอร์ <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="เช่น โรงแรมตัวอย่าง หรือ นายสมชาย ใจดี"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  อีเมล <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="partner@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">เบอร์โทรศัพท์</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0812345678"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ประเภท <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as PartnerType })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value={PartnerType.HOTEL}>โรงแรม</option>
                  <option value={PartnerType.DRIVER}>คนขับรถ</option>
                </select>
              </div>

              {/* Stripe Account ID */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stripe Connect Account ID
                </label>
                <Input
                  type="text"
                  value={formData.stripe_account_id}
                  onChange={(e) =>
                    setFormData({ ...formData, stripe_account_id: e.target.value })
                  }
                  placeholder="acct_xxxxx (optional)"
                />
                <p className="mt-1 text-xs text-slate-500">
                  สำหรับการจ่ายเงินผ่าน Stripe Connect (ถ้ามี)
                </p>
              </div>

              {/* Commission Rate */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  อัตราคอมมิชชั่น (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="10.00"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                  เปิดใช้งาน
                </label>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <Button type="submit" loading={loading} className="flex-1">
                บันทึก
              </Button>
              <Link
                href="/admin/partners"
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors text-center"
              >
                ยกเลิก
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

