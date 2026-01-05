/**
 * ============================================================
 * Delete Partner Button - ปุ่มลบพาร์ทเนอร์ (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงปุ่มลบพาร์ทเนอร์
 *   - จัดการ confirm dialog และ loading state
 *   - เรียก API เพื่อลบข้อมูล
 *
 * การใช้งาน:
 *   <DeletePartnerButton id="partner-id" />
 *
 * Features:
 *   - Confirm dialog ก่อนลบ
 *   - Loading state ขณะลบ (disabled)
 *   - Error handling พร้อม alert
 *   - Auto refresh หลังลบสำเร็จ
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks สำหรับจัดการ state */
import { useState } from 'react'

/** Lucide icons สำหรับ UI */
import { Trash2 } from 'lucide-react'

/** Next.js hooks สำหรับ navigation */
import { useRouter } from 'next/navigation'

// ============================================================
// Component Props
// ============================================================

/**
 * Props สำหรับ DeletePartnerButton
 */
interface DeletePartnerButtonProps {
  /** ID ของพาร์ทเนอร์ที่จะลบ */
  id: string
}

// ============================================================
// Main Component
// ============================================================

/**
 * ปุ่มลบพาร์ทเนอร์
 *
 * @description
 *   ปุ่มลบพร้อม confirm dialog
 *   แสดง disabled state ขณะประมวลผล
 *
 * @param {DeletePartnerButtonProps} props - Props ของ component
 * @returns {JSX.Element} Delete button UI
 */
export default function DeletePartnerButton({ id }: DeletePartnerButtonProps) {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ navigation และ refresh */
  const router = useRouter()

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** State สำหรับสถานะการลบ */
  const [loading, setLoading] = useState(false)

  // ----------------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------------
  /**
   * จัดการการลบพาร์ทเนอร์
   *
   * ขั้นตอน:
   * 1. แสดง confirm dialog
   * 2. เรียก API DELETE /api/partners/:id
   * 3. Refresh หน้าเมื่อสำเร็จ หรือแสดง error
   */
  const handleDelete = async () => {
    // ----------------------------------------------------------
    // ยืนยันการลบ
    // ----------------------------------------------------------
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบพาร์ทเนอร์นี้?')) {
      return
    }

    setLoading(true)

    try {
      // ----------------------------------------------------------
      // เรียก API เพื่อลบ
      // ----------------------------------------------------------
      const res = await fetch(`/api/partners/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'ไม่สามารถลบพาร์ทเนอร์ได้')
      }

      // ลบสำเร็จ -> refresh หน้า
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด: ' + err)
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    >
      {/* Icon ลบ */}
      <Trash2 size={18} />
    </button>
  )
}






