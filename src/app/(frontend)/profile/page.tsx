'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { User, BookOpen, LogOut, Loader2, Calendar, MapPin, Car, Building2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import type { Booking } from '@/types'
import useLocalize from '@/hooks/useLocalize'

interface UserData {
  id: string
  email: string
  name: string
}

export default function ProfilePage() {
  const { i18n } = useTranslation()
  const router = useRouter()
  const lang = i18n.language
  const { getField } = useLocalize()

  const [user, setUser] = useState<UserData | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    try {
      // Get user info
      const userRes = await fetch('/api/auth/me')
      if (!userRes.ok) {
        router.push('/login?redirect=/profile')
        return
      }

      const userData = await userRes.json()
      setUser(userData.user)

      // Get bookings
      const bookingsRes = await fetch('/api/user/bookings')
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setBookings(bookingsData.data || [])
      }
    } catch {
      router.push('/login?redirect=/profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch {
      setLoggingOut(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      PAID: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      COMPLETED: 'bg-gray-100 text-gray-700',
    }

    const statusLabels: Record<string, { th: string; en: string }> = {
      PENDING: { th: 'รอดำเนินการ', en: 'Pending' },
      CONFIRMED: { th: 'ยืนยันแล้ว', en: 'Confirmed' },
      PAID: { th: 'ชำระเงินแล้ว', en: 'Paid' },
      CANCELLED: { th: 'ยกเลิก', en: 'Cancelled' },
      COMPLETED: { th: 'เสร็จสิ้น', en: 'Completed' },
    }

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
        {statusLabels[status]?.[lang as 'th' | 'en'] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {lang === 'th' ? 'โปรไฟล์' : 'Profile'}
          </h1>
          <p className="text-xl text-white/80">
            {lang === 'th' ? 'จัดการบัญชีและดูประวัติการจอง' : 'Manage your account and view booking history'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-8 -mt-8">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <p className="text-slate-500">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2"
            >
              {loggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {lang === 'th' ? 'ออกจากระบบ' : 'Logout'}
            </Button>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">
              {lang === 'th' ? 'ประวัติการจอง' : 'Booking History'}
            </h2>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">
                {lang === 'th' ? 'ยังไม่มีประวัติการจอง' : 'No bookings yet'}
              </p>
              <Link href="/hotels">
                <Button>{lang === 'th' ? 'จองเลย' : 'Book Now'}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-slate-200 rounded-xl p-4 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {booking.booking_type === 'CAR' ? (
                        <Car className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Building2 className="w-5 h-5 text-indigo-600" />
                      )}
                      <span className="font-semibold text-slate-900">
                        {booking.booking_code}
                      </span>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    {booking.hotel && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4" />
                        {getField(booking.hotel, 'name')}
                      </div>
                    )}
                    {booking.car && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Car className="w-4 h-4" />
                        {getField(booking.car, 'name')}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(booking.check_in_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')} - {new Date(booking.check_out_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <span className="text-lg font-bold text-indigo-600">
                      {formatCurrency(booking.total_price)}
                    </span>
                    <Link href={`/success?code=${booking.booking_code}`}>
                      <Button variant="outline" size="sm">
                        {lang === 'th' ? 'ดูรายละเอียด' : 'View Details'}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
