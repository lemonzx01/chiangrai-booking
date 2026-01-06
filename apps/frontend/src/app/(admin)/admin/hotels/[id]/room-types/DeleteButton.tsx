'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface DeleteRoomTypeButtonProps {
  id: string
}

export default function DeleteRoomTypeButton({ id }: DeleteRoomTypeButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประเภทห้องนี้?')) {
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/room-types/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'ไม่สามารถลบประเภทห้องได้')
      }

      // Refresh the page
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      title="ลบประเภทห้อง"
    >
      <Trash2 size={18} />
    </button>
  )
}



