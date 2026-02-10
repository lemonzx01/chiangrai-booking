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
import { useSearchParams } from 'next/navigation'

/** Next.js hooks สำหรับ navigation */


/** Admin Sidebar component */
import AdminSidebar from '@/components/admin/Sidebar'

/** UI Components */
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

/** Lucide icons สำหรับ UI */
import { ArrowLeft } from 'lucide-react'

/** Next.js Link component */
import Link from 'next/link'
import SelectDropdown from '@/components/ui/SelectDropdown'

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

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** State สำหรับสถานะการบันทึก */
  const [loading, setLoading] = useState(false)

  /** State สำหรับสถานะการโหลดข้อมูล */
  const [fetching, setFetching] = useState(true)

  /** State สำหรับข้อความ error */
  const [error, setError] = useState('')
  const [isConnectingStripe, setIsConnectingStripe] = useState(false)
  const [stripeCheckMessage, setStripeCheckMessage] = useState('')
  const searchParams = useSearchParams()



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
    const fetchPartnerAndCheckStripe = async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/partners/${params.id}`);
        const data: unknown = await res.json();

        if (!res.ok) {
          const message =
            typeof data === 'object' && data !== null && 'error' in data
              ? String((data as { error?: unknown }).error)
              : 'ไม่สามารถดึงข้อมูลพาร์ทเนอร์ได้';
          throw new Error(message);
        }

        const partner = data as Partner;

        setFormData({
          name: partner.name,
          email: partner.email,
          phone: partner.phone || '',
          type: partner.type,
          stripe_account_id: partner.stripe_account_id || '',
          commission_rate: partner.commission_rate,
          is_active: partner.is_active,
        });

        // Check Stripe status if returning from onboarding
        if (searchParams.get('stripe_return') === 'true') {
          setStripeCheckMessage('กำลังตรวจสอบสถานะการเชื่อมต่อกับ Stripe...');
          const statusRes = await fetch(`/api/partners/${params.id}/stripe-status`);
          const statusData = await statusRes.json();

          if (!statusRes.ok) {
            throw new Error(statusData.error || 'ไม่สามารถตรวจสอบสถานะ Stripe ได้');
          }

          if (statusData.isOnboarded) {
            setStripeCheckMessage('เชื่อมต่อกับ Stripe สำเร็จแล้ว!');
            // Re-set form data with potentially updated stripe_account_id from the fresh fetch
            setFormData(prev => ({ ...prev, stripe_account_id: partner.stripe_account_id || '' }));
          } else {
            setStripeCheckMessage('การเชื่อมต่อยังไม่สมบูรณ์ กรุณากรอกข้อมูลในหน้า Stripe ให้ครบถ้วน');
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
        setError(message);
      } finally {
        setFetching(false);
      }
    };

    fetchPartnerAndCheckStripe();
  }, [params.id, searchParams]);

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

  const handleConnectStripe = async () => {
    setIsConnectingStripe(true)
    setError('')
    try {
      const res = await fetch(`/api/partners/${params.id}/stripe-connect`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create Stripe Connect link.')
      }
      // Redirect to the Stripe onboarding URL
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message || 'An error occurred while connecting to Stripe.')
      setIsConnectingStripe(false)
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
                <SelectDropdown
                  options={[
                    { value: PartnerType.HOTEL, label: 'โรงแรม' },
                    { value: PartnerType.DRIVER, label: 'คนขับรถ' },
                  ]}
                  value={formData.type}
                  onChange={(v) => setFormData({ ...formData, type: v as PartnerType })}
                />
              </div>

              {/* Stripe Connect Account ID */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stripe Connect
                </label>
                {formData.stripe_account_id ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm font-semibold text-green-800">เชื่อมต่อสำเร็จแล้ว</p>
                    <p className="text-xs text-green-700 mt-1">Account ID: {formData.stripe_account_id}</p>
                  </div>
                ) : (
                  <div>
                    <Button
                      type="button"
                      onClick={handleConnectStripe}
                      loading={isConnectingStripe}
                      disabled={isConnectingStripe}
                    >
                      เชื่อมต่อกับ Stripe
                    </Button>
                    <p className="mt-1 text-xs text-slate-500">
                      เชื่อมต่อบัญชี Stripe เพื่อรับเงินค่าจองโดยตรง
                    </p>
                  </div>
                )}
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




