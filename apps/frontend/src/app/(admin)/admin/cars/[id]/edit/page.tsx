'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AdminSidebar from '@/components/admin/Sidebar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ArrowLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'
import ImageUpload from '@/components/ui/ImageUpload'

export default function EditCarPage() {
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
    car_type_th: '',
    car_type_en: '',
    max_passengers: 4,
    price_per_day: '',
    includes_th: [] as string[],
    includes_en: [] as string[],
    images: [] as string[],
    is_active: true,
  })

  const [newIncludeTh, setNewIncludeTh] = useState('')
  const [newIncludeEn, setNewIncludeEn] = useState('')
  const [newImage, setNewImage] = useState('')

  useEffect(() => {
    const loadCar = async () => {
      try {
        const res = await fetch(`/api/cars/${id}`)
        if (!res.ok) {
          throw new Error('ไม่พบข้อมูลรถ')
        }

        const data = await res.json()
        setFormData({
          name_th: data.name_th || '',
          name_en: data.name_en || '',
          description_th: data.description_th || '',
          description_en: data.description_en || '',
          car_type_th: data.car_type_th || '',
          car_type_en: data.car_type_en || '',
          max_passengers: data.max_passengers || 4,
          price_per_day: String(data.price_per_day || ''),
          includes_th: data.includes_th || [],
          includes_en: data.includes_en || [],
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
      loadCar()
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = {
        ...formData,
        price_per_day: parseFloat(formData.price_per_day),
        max_passengers: parseInt(String(formData.max_passengers)),
      }

      const res = await fetch(`/api/cars/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถอัพเดทรถได้')
      }

      window.location.href = '/admin/cars'
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง')
      setSaving(false)
    }
  }

  const addInclude = (lang: 'th' | 'en') => {
    const newValue = lang === 'th' ? newIncludeTh : newIncludeEn
    if (newValue.trim()) {
      if (lang === 'th') {
        setFormData({
          ...formData,
          includes_th: [...formData.includes_th, newValue.trim()],
        })
        setNewIncludeTh('')
      } else {
        setFormData({
          ...formData,
          includes_en: [...formData.includes_en, newValue.trim()],
        })
        setNewIncludeEn('')
      }
    }
  }

  const removeInclude = (index: number, lang: 'th' | 'en') => {
    if (lang === 'th') {
      setFormData({
        ...formData,
        includes_th: formData.includes_th.filter((_, i) => i !== index),
      })
    } else {
      setFormData({
        ...formData,
        includes_en: formData.includes_en.filter((_, i) => i !== index),
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
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
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
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="mb-8">
          <Link
            href="/admin/cars"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            กลับไปหน้ารายการ
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">แก้ไขรถเช่า</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 lg:p-8">
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
                <Input
                  label="ประเภทรถภาษาไทย *"
                  value={formData.car_type_th}
                  onChange={(e) => setFormData({ ...formData, car_type_th: e.target.value })}
                  placeholder="เช่น รถสปอร์ตเปิดประทุน"
                  required
                />
                <Input
                  label="ประเภทรถภาษาอังกฤษ *"
                  value={formData.car_type_en}
                  onChange={(e) => setFormData({ ...formData, car_type_en: e.target.value })}
                  placeholder="เช่น Sport Convertible"
                  required
                />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  type="number"
                  label="ราคาต่อวัน (บาท) *"
                  value={formData.price_per_day}
                  onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
                <Input
                  type="number"
                  label="จำนวนผู้โดยสารสูงสุด *"
                  value={formData.max_passengers}
                  onChange={(e) => setFormData({ ...formData, max_passengers: parseInt(e.target.value) || 4 })}
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Includes */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">สิ่งที่รวมอยู่</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ภาษาไทย
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newIncludeTh}
                      onChange={(e) => setNewIncludeTh(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInclude('th'))}
                      placeholder="เพิ่มรายการ"
                      className="flex-1 px-4 py-2 rounded-xl border-2 border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200"
                    />
                    <Button type="button" onClick={() => addInclude('th')} size="sm">
                      <Plus size={16} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.includes_th.map((include, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm"
                      >
                        {include}
                        <button
                          type="button"
                          onClick={() => removeInclude(index, 'th')}
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
                      value={newIncludeEn}
                      onChange={(e) => setNewIncludeEn(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInclude('en'))}
                      placeholder="Add item"
                      className="flex-1 px-4 py-2 rounded-xl border-2 border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200"
                    />
                    <Button type="button" onClick={() => addInclude('en')} size="sm">
                      <Plus size={16} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.includes_en.map((include, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm"
                      >
                        {include}
                        <button
                          type="button"
                          onClick={() => removeInclude(index, 'en')}
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
                  className="flex-1 px-4 py-2 rounded-xl border-2 border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200"
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
              <Link href="/admin/cars">
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

