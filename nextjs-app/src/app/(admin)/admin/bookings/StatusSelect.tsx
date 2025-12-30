'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const statusOptions = [
  { value: 'PENDING', label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'CONFIRMED', label: 'ยืนยันแล้ว', color: 'bg-blue-100 text-blue-700' },
  { value: 'PAID', label: 'ชำระเงินแล้ว', color: 'bg-green-100 text-green-700' },
  { value: 'CANCELLED', label: 'ยกเลิก', color: 'bg-red-100 text-red-700' },
  { value: 'COMPLETED', label: 'เสร็จสิ้น', color: 'bg-gray-100 text-gray-700' },
]

interface Props {
  bookingCode: string
  currentStatus: string
}

export default function BookingStatusSelect({ bookingCode, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return

    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentOption = statusOptions.find(s => s.value === currentStatus)

  return (
    <select
      value={currentStatus}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
        currentOption?.color || 'bg-gray-100 text-gray-700'
      } ${loading ? 'opacity-50' : ''}`}
    >
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
