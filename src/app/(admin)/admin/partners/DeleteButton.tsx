'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DeletePartnerButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบพาร์ทเนอร์นี้?')) {
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/partners/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'ไม่สามารถลบพาร์ทเนอร์ได้')
      }

      router.refresh()
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด: ' + err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 size={18} />
    </button>
  )
}

