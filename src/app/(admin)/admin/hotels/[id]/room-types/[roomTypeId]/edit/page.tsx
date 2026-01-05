'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminSidebar from '@/components/admin/Sidebar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditRoomTypePage() {
  const router = useRouter()
  const params = useParams()
  const hotelId = params.id as string
  const roomTypeId = params.roomTypeId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hotelName, setHotelName] = useState('')

  const [formData, setFormData] = useState({
    hotel_id: hotelId,
    name_th: '',
    name_en: '',
    price_per_night: '',
    max_guests: 2,
    is_active: true,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load hotel name
        const hotelRes = await fetch(`/api/hotels/${hotelId}`)
        if (hotelRes.ok) {
          const hotelData = await hotelRes.json()
          setHotelName(hotelData.name_th || '')
        }

        // Load room type
        const res = await fetch(`/api/room-types/${roomTypeId}`)
        if (!res.ok) {
          throw new Error('ไม่พบข้อมูลประเภทห้อง')
        }

        const data = await res.json()
        setFormData({
          hotel_id: data.hotel_id,
          name_th: data.name_th || '',
          name_en: data.name_en || '',
          price_per_night: String(data.price_per_night || ''),
          max_guests: data.max_guests || 2,
          is_active: data.is_active !== undefined ? data.is_active : true,
        })
      } catch (err: any) {
        setError(err.message || 'ไม่สามารถโหลดข้อมูลได้')
      } finally {
        setLoading(false)
      }
    }

    if (roomTypeId) {
      loadData()
    }
  }, [roomTypeId, hotelId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = {
        name_th: formData.name_th,
        name_en: formData.name_en,
        price_per_night: parseFloat(formData.price_per_night),
        max_guests: parseInt(String(formData.max_guests)),
        is_active: formData.is_active,
      }

      const res = await fetch(`/api/room-types/${roomTypeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถอัปเดตประเภทห้องได้')
      }

      // Redirect to room types list
      router.push(`/admin/hotels/${hotelId}/room-types`)
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-slate-500">กำลังโหลด...</p>
          </div>
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
            href={`/admin/hotels/${hotelId}/room-types`}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft size={20} />
            กลับไปรายการประเภทห้อง
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            แก้ไขประเภทห้อง
          </h1>
          {hotelName && (
            <p className="text-slate-500 mb-8">โรงแรม: {hotelName}</p>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8"
          >
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Name TH */}
              <Input
                label="ชื่อประเภทห้อง (ภาษาไทย) *"
                value={formData.name_th}
                onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
                placeholder="เช่น ห้องดีลักซ์, ห้องสวีท"
                required
              />

              {/* Name EN */}
              <Input
                label="ชื่อประเภทห้อง (ภาษาอังกฤษ) *"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="เช่น Deluxe Room, Suite"
                required
              />

              {/* Price */}
              <Input
                type="number"
                label="ราคาต่อคืน (บาท) *"
                value={formData.price_per_night}
                onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                min="0"
                step="0.01"
                required
              />

              {/* Max Guests */}
              <Input
                type="number"
                label="จำนวนผู้เข้าพักสูงสุด *"
                value={formData.max_guests}
                onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) || 2 })}
                min="1"
                required
              />

              {/* Is Active */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">เปิดใช้งาน</span>
                </label>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <Button type="submit" loading={saving} className="flex-1">
                บันทึก
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/hotels/${hotelId}/room-types`)}
                className="flex-1"
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}



