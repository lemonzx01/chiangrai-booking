'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/components/shared/Toast'
import { useConfirm } from '@/components/shared/ConfirmDialog'
import { apiFetch } from '@/lib/api'

interface DeleteRoomTypeButtonProps {
  id: string
}

export default function DeleteRoomTypeButton({ id }: DeleteRoomTypeButtonProps) {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'ลบประเภทห้องนี้?',
      body: 'การลบนี้ไม่สามารถย้อนกลับได้ และอาจส่งผลกับการจองที่เชื่อมโยงอยู่',
      confirmLabel: 'ลบ',
      variant: 'danger',
    })
    if (!ok) return

    setLoading(true)
    try {
      const res = await apiFetch(`/api/room-types/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'ไม่สามารถลบประเภทห้องได้')
      }
      toast.success('ลบประเภทห้องสำเร็จ')
      router.refresh()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด')
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
