'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'

export default function DeleteHotelButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบโรงแรมนี้หรือไม่?')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/hotels/${id}`, { method: 'DELETE' })

      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'ไม่สามารถลบโรงแรมได้ กรุณาลองใหม่อีกครั้ง')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
    </button>
  )
}
