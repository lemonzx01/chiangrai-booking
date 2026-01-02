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
          // Try mock data if API fails
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
        <main className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-slate-500">กำลังโหลดข้อมูล...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <Link
            href="/admin/hotels"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            กลับไปหน้ารายการ
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">แก้ไขโรงแรม/แพ็คเกจ</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">ข้อมูลพื้นฐาน</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="ชื่อภาษาไทย *"
                  value={formData.name_th}
                  onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
                  required
                />
                <Input
                  label="ชื่อภาษาอังกฤษ *"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  required
                />
                <div className="md:col-span-2">
                  <Input
                    label="ที่ตั้ง *"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="เช่น ภูเก็ต, ประเทศไทย"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">รายละเอียด</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    คำอธิบายภาษาไทย *
                  </label>
                  <textarea
                    value={formData.description_th}
                    onChange={(e) => setFormData({ ...formData, description_th: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 min-h-[100px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    คำอธิบายภาษาอังกฤษ *
                  </label>
                  <textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 min-h-[100px]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Details */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">ราคาและรายละเอียด</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ระดับดาว *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.star_rating}
                      onChange={(e) => setFormData({ ...formData, star_rating: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-indigo-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 appearance-none cursor-pointer"
                      required
                    >
                      {STAR_RATINGS.map((rating) => (
                        <option key={rating.value} value={rating.value}>
                          {rating.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <Input
                  type="number"
                  label="ราคาต่อคืน (บาท) *"
                  value={formData.price_per_night}
                  onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
                <Input
                  type="number"
                  label="จำนวนผู้เข้าพักสูงสุด *"
                  value={formData.max_guests}
                  onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) || 2 })}
                  min="1"
                  required
                />
                <Input
                  label="ประเภทห้องภาษาไทย *"
                  value={formData.room_type_th}
                  onChange={(e) => setFormData({ ...formData, room_type_th: e.target.value })}
                  placeholder="เช่น วิลล่าสระน้ำส่วนตัว"
                  required
                />
                <Input
                  label="ประเภทห้องภาษาอังกฤษ *"
                  value={formData.room_type_en}
                  onChange={(e) => setFormData({ ...formData, room_type_en: e.target.value })}
                  placeholder="เช่น Private Pool Villa"
                  required
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">สิ่งอำนวยความสะดวก</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ภาษาไทย
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newAmenityTh}
                      onChange={(e) => setNewAmenityTh(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity('th'))}
                      placeholder="เพิ่มสิ่งอำนวยความสะดวก"
                      className="flex-1 px-4 py-2 rounded-xl border-2 border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200"
                    />
                    <Button type="button" onClick={() => addAmenity('th')} size="sm">
                      <Plus size={16} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities_th.map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => removeAmenity(index, 'th')}
                          className="hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    English
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newAmenityEn}
                      onChange={(e) => setNewAmenityEn(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity('en'))}
                      placeholder="Add amenity"
                      className="flex-1 px-4 py-2 rounded-xl border-2 border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200"
                    />
                    <Button type="button" onClick={() => addAmenity('en')} size="sm">
                      <Plus size={16} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities_en.map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => removeAmenity(index, 'en')}
                          className="hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">รูปภาพ</h2>
              
              {/* Upload Component */}
              <div className="mb-4">
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

              {/* URL Input (Alternative method) */}
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                  placeholder="หรือใส่ URL รูปภาพ"
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button type="button" onClick={addImage} size="sm">
                  <Plus size={16} />
                </Button>
              </div>

              {/* Image Gallery */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl border border-slate-200"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Invalid+URL'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-slate-700">เปิดใช้งาน</span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200">
              <Link href="/admin/hotels">
                <Button type="button" variant="outline">
                  ยกเลิก
                </Button>
              </Link>
              <Button type="submit" loading={saving} disabled={saving}>
                บันทึกการแก้ไข
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

