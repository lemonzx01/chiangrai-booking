/**
 * ============================================================
 * Delete Car Button - ปุ่มลบรถ (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงปุ่มลบรถ
 *   - จัดการ confirm dialog และ loading state
 *   - เรียก API เพื่อลบข้อมูล
 *
 * การใช้งาน:
 *   <DeleteCarButton id="car-id" />
 *
 * Features:
 *   - Confirm dialog ก่อนลบ
 *   - Loading spinner ขณะลบ
 *   - Error handling พร้อม alert
 *   - Auto refresh หลังลบสำเร็จ
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Next.js hooks สำหรับ navigation */
import { useRouter } from 'next/navigation'

/** React hooks สำหรับจัดการ state */
import { useState } from 'react'

/** Lucide icons สำหรับ UI */
import { Trash2, Loader2 } from 'lucide-react'

// ============================================================
// Component Props
// ============================================================

/**
 * Props สำหรับ DeleteCarButton
 */
interface DeleteCarButtonProps {
  /** ID ของรถที่จะลบ */
  id: string
}

// ============================================================
// Main Component
// ============================================================

/**
 * ปุ่มลบรถ
 *
 * @description
 *   ปุ่มลบพร้อม confirm dialog
 *   แสดง loading spinner ขณะประมวลผล
 *
 * @param {DeleteCarButtonProps} props - Props ของ component
 * @returns {JSX.Element} Delete button UI
 */
export default function DeleteCarButton({ id }: DeleteCarButtonProps) {
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
   * จัดการการลบรถ
   *
   * ขั้นตอน:
   * 1. แสดง confirm dialog
   * 2. เรียก API DELETE /api/cars/:id
   * 3. Refresh หน้าเมื่อสำเร็จ หรือแสดง error
   */
  const handleDelete = async () => {
    // ----------------------------------------------------------
    // ยืนยันการลบ
    // ----------------------------------------------------------
    if (!confirm('คุณต้องการลบรถนี้หรือไม่?')) return

    setLoading(true)
    try {
      // ----------------------------------------------------------
      // เรียก API เพื่อลบ
      // ----------------------------------------------------------
      const res = await fetch(`/api/cars/${id}`, { method: 'DELETE' })

      if (res.ok) {
        // ลบสำเร็จ -> refresh หน้า
        router.refresh()
      } else {
        // ลบไม่สำเร็จ -> แสดง error
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'ไม่สามารถลบรถได้ กรุณาลองใหม่อีกครั้ง')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
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
      className={`p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {/* แสดง Spinner หรือ Icon ลบ */}
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
    </button>
  )
}
