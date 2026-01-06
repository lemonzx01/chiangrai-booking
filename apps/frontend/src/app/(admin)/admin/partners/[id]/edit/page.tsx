/**
 * ============================================================
 * Edit Partner Page - หน้าแก้ไขพาร์ทเนอร์ (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงฟอร์มแก้ไขข้อมูลพาร์ทเนอร์
 *   - โหลดข้อมูลเดิมและอัปเดตผ่าน API
 *
 * Route:
 *   - /admin/partners/:id/edit - หน้าแก้ไขพาร์ทเนอร์
 *
 * Features:
 *   - โหลดข้อมูลพาร์ทเนอร์อัตโนมัติ
 *   - ฟอร์มแก้ไข (ชื่อ, อีเมล, เบอร์โทร, ประเภท)
 *   - ตั้งค่า Stripe Connect และอัตราคอมมิชชั่น
 *   - Toggle เปิด/ปิดใช้งาน
 *   - Redirect หลังบันทึกสำเร็จ
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks สำหรับจัดการ state และ lifecycle */
import { useState, useEffect } from 'react'

/** Next.js hooks สำหรับ navigation */
import { useRouter } from 'next/navigation'

/** Admin Sidebar component */
import AdminSidebar from '@/components/admin/Sidebar'

/** UI Components */
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

/** Lucide icons สำหรับ UI */
import { ArrowLeft } from 'lucide-react'

/** Next.js Link component */
import Link from 'next/link'

/** Type definitions */
import { PartnerType, Partner } from '@chiangrai/shared/types'

// ============================================================
// Main Component
// ============================================================

/**
 * หน้าแก้ไขพาร์ทเนอร์
 *
 * @description
 *   โหลดข้อมูลพาร์ทเนอร์แล้วแสดงฟอร์มแก้ไข
 *   บันทึกการเปลี่ยนแปลงผ่าน API
 *
 * @param {{ params: { id: string } }} props - Props ของ component
 * @returns {JSX.Element} Edit partner page UI
 */
export default function EditPartnerPage({ params }: { params: { id: string } }) {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ navigation */
  const router = useRouter()

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** State สำหรับสถานะการบันทึก */
  const [loading, setLoading] = useState(false)

  /** State สำหรับสถานะการโหลดข้อมูล */
  const [fetching, setFetching] = useState(true)

  /** State สำหรับข้อความ error */
  const [error, setError] = useState('')

  /** State สำหรับข้อมูลฟอร์ม */
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: PartnerType.HOTEL as PartnerType,
    stripe_account_id: '',
    commission_rate: 10.0,
    is_active: true,
  })

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------
  /**
   * Effect: โหลดข้อมูลพาร์ทเนอร์เมื่อ mount
   *
   * ดึงข้อมูลจาก API แล้วกรอกลงในฟอร์ม
   */
  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const res = await fetch(`/api/partners/${params.id}`)
        const data: unknown = await res.json()

        if (!res.ok) {
          const message =
            typeof data === 'object' && data !== null && 'error' in data
              ? String((data as { error?: unknown }).error)
              : 'ไม่สามารถดึงข้อมูลพาร์ทเนอร์ได้'
          throw new Error(message)
        }

        const partner = data as Partner

        // กรอกข้อมูลลงในฟอร์ม
        setFormData({
          name: partner.name,
          email: partner.email,
          phone: partner.phone || '',
          type: partner.type,
          stripe_account_id: partner.stripe_account_id || '',
          commission_rate: partner.commission_rate,
          is_active: partner.is_active,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
        setError(message)
      } finally {
        setFetching(false)
      }
    }

    fetchPartner()
  }, [params.id])

  // ----------------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------------
  /**
   * จัดการการ submit ฟอร์ม
   *
   * ขั้นตอน:
   * 1. เตรียม payload และแปลง commission_rate
   * 2. เรียก API PUT /api/partners/:id
   * 3. Redirect ไป /admin/partners หลังสำเร็จ
   *
   * @param {React.FormEvent} e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // เตรียมข้อมูลสำหรับส่ง API
      const payload = {
        ...formData,
        commission_rate: parseFloat(String(formData.commission_rate)),
      }

      // เรียก API เพื่ออัปเดตพาร์ทเนอร์
      const res = await fetch(`/api/partners/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถอัปเดตพาร์ทเนอร์ได้')
      }

      // Redirect ไปหน้ารายการพาร์ทเนอร์
      window.location.href = '/admin/partners'
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง')
      setLoading(false)
    }
  }

  // ----------------------------------------------------------
  // Loading State
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="flex">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-3xl mx-auto">
          {/* Back Link */}
          <Link
            href="/admin/partners"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft size={20} />
            กลับไปรายการพาร์ทเนอร์
          </Link>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">แก้ไขพาร์ทเนอร์</h1>

          {/* Partner Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* ชื่อพาร์ทเนอร์ */}
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

              {/* อีเมล */}
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

              {/* เบอร์โทรศัพท์ */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">เบอร์โทรศัพท์</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0812345678"
                />
              </div>

              {/* ประเภทพาร์ทเนอร์ */}
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

              {/* Stripe Connect Account ID */}
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

              {/* อัตราคอมมิชชั่น */}
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

              {/* สถานะเปิดใช้งาน */}
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

            {/* Submit Buttons */}
            <div className="mt-8 flex gap-4">
              {/* ปุ่มบันทึก */}
              <Button type="submit" loading={loading} className="flex-1">
                บันทึก
              </Button>
              {/* ปุ่มยกเลิก */}
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




