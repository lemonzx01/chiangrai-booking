'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminSidebar from '@/components/admin/Sidebar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ArrowLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { STAR_RATINGS } from '@/lib/constants'
import { MOCK_HOTELS } from '@/lib/constants'
import ImageUpload from '@/components/ui/ImageUpload'

export default function EditHotelPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name_th: '',
    name_en: '',
    description_th: '',
    description_en: '',
    location: '',
    star_rating: 5,
    price_per_night: '',
    max_guests: 2,
    room_type_th: '',
    room_type_en: '',
    amenities_th: [] as string[],
    amenities_en: [] as string[],
    images: [] as string[],
    is_active: true,
  })

  const [newAmenityTh, setNewAmenityTh] = useState('')
  const [newAmenityEn, setNewAmenityEn] = useState('')
  const [newImage, setNewImage] = useState('')

  useEffect(() => {
    const loadHotel = async () => {
      try {
        const res = await fetch(`/api/hotels/${id}`)
        if (!res.ok) {
          const mockHotel = MOCK_HOTELS.find(h => h.id === id)
          if (mockHotel) {
            setFormData({
              name_th: mockHotel.name_th,
              name_en: mockHotel.name_en,
              description_th: mockHotel.description_th,
              description_en: mockHotel.description_en,
              location: mockHotel.location_th || mockHotel.location_en || '',
              star_rating: mockHotel.star_rating,
              price_per_night: String(mockHotel.price_per_night),
              max_guests: mockHotel.max_guests,
              room_type_th: mockHotel.room_type_th,
              room_type_en: mockHotel.room_type_en,
              amenities_th: mockHotel.amenities_th || [],
              amenities_en: mockHotel.amenities_en || [],
              images: mockHotel.images || [],
              is_active: mockHotel.is_active,
            })
            setLoading(false)
            return
          }
          throw new Error('ไม่พบข้อมูลโรงแรม')
        }

        const data = await res.json()
        setFormData({
          name_th: data.name_th || '',
          name_en: data.name_en || '',
          description_th: data.description_th || '',
          description_en: data.description_en || '',
          location: data.location || '',
          star_rating: data.star_rating || 5,
          price_per_night: String(data.price_per_night || ''),
          max_guests: data.max_guests || 2,
          room_type_th: data.room_type_th || '',
          room_type_en: data.room_type_en || '',
          amenities_th: data.amenities_th || [],
          amenities_en: data.amenities_en || [],
          images: data.images || [],
          is_active: data.is_active !== undefined ? data.is_active : true,
        })
      } catch (err: any) {
        setError(err.message || 'ไม่สามารถโหลดข้อมูลได้')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadHotel()
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = {
        ...formData,
        price_per_night: parseFloat(formData.price_per_night),
        max_guests: parseInt(String(formData.max_guests)),
        star_rating: parseInt(String(formData.star_rating)),
      }

      const res = await fetch(`/api/hotels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถอัพเดทโรงแรมได้')
      }

      window.location.href = '/admin/hotels'
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง')
      setSaving(false)
    }
  }

  const addAmenity = (lang: 'th' | 'en') => {
    const newValue = lang === 'th' ? newAmenityTh : newAmenityEn
    if (newValue.trim()) {
      if (lang === 'th') {
        setFormData({
          ...formData,
          amenities_th: [...formData.amenities_th, newValue.trim()],
        })
        setNewAmenityTh('')
      } else {
        setFormData({
          ...formData,
          amenities_en: [...formData.amenities_en, newValue.trim()],
        })
        setNewAmenityEn('')
      }
    }
  }

  const removeAmenity = (index: number, lang: 'th' | 'en') => {
    if (lang === 'th') {
      setFormData({
        ...formData,
        amenities_th: formData.amenities_th.filter((_, i) => i !== index),
      })
    } else {
      setFormData({
        ...formData,
        amenities_en: formData.amenities_en.filter((_, i) => i !== index),
      })
    }
  }

  const addImage = () => {
    if (newImage.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, newImage.trim()],
      })
      setNewImage('')
    }
  }

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    })
  }

  if (loading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 pt-16 lg:pt-6">
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="text-slate-500 text-sm">กำลังโหลดข้อมูล...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 pt-16 lg:pt-6 bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="mb-5">
          <Link
            href="/admin/hotels"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
          >
            <ArrowLeft size={16} />
            กลับ
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-800">แก้ไขโรงแรม/แพ็คเกจ</h1>
            <Link
              href={`/admin/hotels/${id}/room-types`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
            >
              <Plus size={16} />
              จัดการประเภทห้อง
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">ข้อมูลพื้นฐาน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">ชื่อภาษาไทย *</label>
                <input
                  type="text"
                  value={formData.name_th}
                  onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">ชื่อภาษาอังกฤษ *</label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">ที่ตั้ง *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="เช่น ภูเก็ต, ประเทศไทย"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">รายละเอียด</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">คำอธิบายภาษาไทย *</label>
                <textarea
                  value={formData.description_th}
                  onChange={(e) => setFormData({ ...formData, description_th: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">คำอธิบายภาษาอังกฤษ *</label>
                <textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 resize-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing & Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">ราคาและรายละเอียด</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">ระดับดาว *</label>
                <select
                  value={formData.star_rating}
                  onChange={(e) => setFormData({ ...formData, star_rating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 bg-white"
                  required
                >
                  {STAR_RATINGS.map((rating) => (
                    <option key={rating.value} value={rating.value}>
                      {rating.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">ราคาต่อคืน (บาท) *</label>
                <input
                  type="number"
                  value={formData.price_per_night}
                  onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">ผู้เข้าพักสูงสุด *</label>
                <input
                  type="number"
                  value={formData.max_guests}
                  onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) || 2 })}
                  min="1"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">ประเภทห้อง (ไทย) *</label>
                <input
                  type="text"
                  value={formData.room_type_th}
                  onChange={(e) => setFormData({ ...formData, room_type_th: e.target.value })}
                  placeholder="วิลล่าสระน้ำส่วนตัว"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">ประเภทห้อง (EN) *</label>
                <input
                  type="text"
                  value={formData.room_type_en}
                  onChange={(e) => setFormData({ ...formData, room_type_en: e.target.value })}
                  placeholder="Private Pool Villa"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">สิ่งอำนวยความสะดวก</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">ภาษาไทย</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAmenityTh}
                    onChange={(e) => setNewAmenityTh(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity('th'))}
                    placeholder="เพิ่มรายการ"
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <button type="button" onClick={() => addAmenity('th')} className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.amenities_th.map((amenity, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                      {amenity}
                      <button type="button" onClick={() => removeAmenity(index, 'th')} className="hover:text-red-500">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">English</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAmenityEn}
                    onChange={(e) => setNewAmenityEn(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity('en'))}
                    placeholder="Add item"
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <button type="button" onClick={() => addAmenity('en')} className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.amenities_en.map((amenity, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                      {amenity}
                      <button type="button" onClick={() => removeAmenity(index, 'en')} className="hover:text-red-500">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">รูปภาพ</h2>

            <div className="mb-3">
              <ImageUpload
                onUpload={(url) => {
                  setFormData({
                    ...formData,
                    images: [...formData.images, url],
                  })
                }}
                maxSize={5}
              />
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                placeholder="หรือใส่ URL รูปภาพ"
                className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button type="button" onClick={addImage} className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                <Plus size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group aspect-video">
                  <img
                    src={image}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border border-slate-200"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Invalid+URL'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Status & Submit */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                />
                <span className="text-sm text-slate-700">เปิดใช้งาน</span>
              </label>
              <div className="flex gap-2">
                <Link href="/admin/hotels">
                  <button type="button" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                    ยกเลิก
                  </button>
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
