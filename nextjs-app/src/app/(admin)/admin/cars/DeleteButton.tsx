'use client'

import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function DeleteCarButton({ id }: { id: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบรถนี้หรือไม่?')) return

    const res = await fetch(`/api/cars/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
      <Trash2 size={18} />
    </button>
  )
}
