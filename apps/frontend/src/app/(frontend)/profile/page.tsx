'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { User, BookOpen, LogOut, Loader2, Calendar, MapPin, Car, Building2, CheckCircle, Mail, Phone, Lock, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import CancelBookingModal from '@/components/ui/CancelBookingModal'
import { formatCurrency } from '@chiangrai/shared/utils'
import type { Booking } from '@chiangrai/shared/types'
import useLocalize from '@/hooks/useLocalize'

interface ProfileData {
  id: string
  email: string
  name: string
  phone: string | null
  email_verified: boolean
  created_at: string
  has_password: boolean
  has_google: boolean
}

export default function ProfilePage() {
  const { i18n } = useTranslation()
  const router = useRouter()
  const lang = i18n.language
  const { getField } = useLocalize()

  // User & bookings state
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  // Email verification
  const [sendingVerification, setSendingVerification] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)

  // Profile edit form
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Cancel booking modal
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null)

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProfile = async () => {
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/bookings'),
      ])

      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          router.push('/login?redirect=/profile')
          return
        }
        // Server error - show error on page, don't redirect
        setPageError(lang === 'th' ? 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ กรุณาลองใหม่' : 'Could not load profile. Please try again.')
        return
      }

      const profileData = await profileRes.json()
      setProfile(profileData.user)
      setEditName(profileData.user.name || '')
      setEditPhone(profileData.user.phone || '')

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
      document.cookie = 'logged_in=; path=/; max-age=0'
      window.location.href = '/'
    } catch {
      setLoggingOut(false)
    }
  }

  const handleResendVerification = async () => {
    setSendingVerification(true)
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      if (res.ok) {
        setVerificationSent(true)
      }
    } catch {
      // ignore
    } finally {
      setSendingVerification(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setProfileMessage({ type: 'error', text: lang === 'th' ? 'กรุณากรอกชื่อ' : 'Name is required' })
      return
    }

    setSavingProfile(true)
    setProfileMessage(null)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setProfileMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาด' })
        return
      }

      setProfile(data.user)
      setProfileMessage({
        type: 'success',
        text: lang === 'th' ? 'บันทึกข้อมูลเรียบร้อย' : 'Profile saved successfully',
      })

      // Refresh to update Navbar name
      router.refresh()
    } catch {
      setProfileMessage({ type: 'error', text: lang === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordMessage(null)

    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: lang === 'th' ? 'กรุณากรอกรหัสผ่านปัจจุบัน' : 'Current password is required' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: lang === 'th' ? 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' : 'New password must be at least 8 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: lang === 'th' ? 'รหัสผ่านใหม่ไม่ตรงกัน' : 'Passwords do not match' })
      return
    }

    setSavingPassword(true)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setPasswordMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาด' })
        return
      }

      setPasswordMessage({
        type: 'success',
        text: lang === 'th' ? 'เปลี่ยนรหัสผ่านเรียบร้อย' : 'Password changed successfully',
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordMessage({ type: 'error', text: lang === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred' })
    } finally {
      setSavingPassword(false)
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

  const getInitials = (name: string) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Error state - server error (not auth error)
  if (pageError) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {lang === 'th' ? 'เกิดข้อผิดพลาด' : 'Something went wrong'}
          </h2>
          <p className="text-slate-500 mb-6">{pageError}</p>
          <Button onClick={() => { setPageError(null); setLoading(true); loadProfile() }}>
            {lang === 'th' ? 'ลองใหม่' : 'Try Again'}
          </Button>
        </div>
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
        {/* User Info Card with Avatar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar with initials */}
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {getInitials(profile?.name || '')}
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{profile?.name}</h2>
              <p className="text-slate-500">{profile?.email}</p>
            </div>

            {/* Logout Button */}
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

        {/* Email Verification Banner */}
        {profile && !profile.email_verified && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <Mail className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 font-medium">
                {lang === 'th' ? 'อีเมลของคุณยังไม่ได้ยืนยัน' : 'Your email has not been verified'}
              </p>
              {verificationSent && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {lang === 'th' ? 'ส่งอีเมลยืนยันแล้ว กรุณาตรวจสอบ inbox' : 'Verification email sent. Check your inbox.'}
                </p>
              )}
            </div>
            {!verificationSent && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                disabled={sendingVerification}
              >
                {sendingVerification ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  lang === 'th' ? 'ส่งอีเมลยืนยัน' : 'Verify Email'
                )}
              </Button>
            )}
          </div>
        )}

        {/* Profile Edit Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">
              {lang === 'th' ? 'ข้อมูลส่วนตัว' : 'Personal Information'}
            </h2>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {lang === 'th' ? 'ชื่อ' : 'Name'}
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={lang === 'th' ? 'กรอกชื่อ' : 'Enter your name'}
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {lang === 'th' ? 'อีเมล' : 'Email'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={profile?.email || ''}
                  readOnly
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                {profile?.email_verified && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    {lang === 'th' ? 'ยืนยันแล้ว' : 'Verified'}
                  </span>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                {lang === 'th' ? 'เบอร์โทร' : 'Phone'}
              </label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={lang === 'th' ? 'เช่น 081-234-5678' : 'e.g. 081-234-5678'}
              />
            </div>

            {/* Profile message */}
            {profileMessage && (
              <div className={`p-3 rounded-xl text-sm ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {profileMessage.text}
              </div>
            )}

            {/* Save button */}
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full flex items-center justify-center gap-2"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {lang === 'th' ? 'บันทึกข้อมูล' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Password Change Section - hidden for Google-only users */}
        {profile?.has_password && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
                </h2>
              </div>
              {showPasswordSection ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {showPasswordSection && (
              <div className="mt-6 space-y-4">
                <Input
                  type="password"
                  label={lang === 'th' ? 'รหัสผ่านปัจจุบัน' : 'Current Password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />

                <Input
                  type="password"
                  label={lang === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={lang === 'th' ? 'อย่างน้อย 8 ตัวอักษร' : 'At least 8 characters'}
                />

                <Input
                  type="password"
                  label={lang === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm New Password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                {/* Password message */}
                {passwordMessage && (
                  <div className={`p-3 rounded-xl text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {passwordMessage.text}
                  </div>
                )}

                <Button
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  {savingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {lang === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Account Info */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">
              {lang === 'th' ? 'ข้อมูลบัญชี' : 'Account Info'}
            </h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">{lang === 'th' ? 'วันที่สมัคร' : 'Joined'}</span>
              <span className="text-slate-900 font-medium">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '-'}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">{lang === 'th' ? 'วิธีเข้าสู่ระบบ' : 'Login Method'}</span>
              <span className="text-slate-900 font-medium">
                {profile?.has_password && profile?.has_google
                  ? (lang === 'th' ? 'อีเมล + Google' : 'Email + Google')
                  : profile?.has_google
                    ? 'Google'
                    : (lang === 'th' ? 'อีเมล' : 'Email')}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500">{lang === 'th' ? 'สถานะอีเมล' : 'Email Status'}</span>
              <span className={`font-medium ${profile?.email_verified ? 'text-green-600' : 'text-amber-600'}`}>
                {profile?.email_verified
                  ? (lang === 'th' ? 'ยืนยันแล้ว' : 'Verified')
                  : (lang === 'th' ? 'ยังไม่ยืนยัน' : 'Not Verified')}
              </span>
            </div>
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
                    <div className="flex items-center gap-2">
                      {['PENDING', 'CONFIRMED', 'PAID'].includes(booking.status) && (
                        <button
                          onClick={() => setCancellingBooking(booking)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                        </button>
                      )}
                      <Link href={`/success?code=${booking.booking_code}`}>
                        <Button variant="outline" size="sm">
                          {lang === 'th' ? 'ดูรายละเอียด' : 'View Details'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Booking Modal */}
      {cancellingBooking && (
        <CancelBookingModal
          bookingCode={cancellingBooking.booking_code}
          bookingStatus={cancellingBooking.status}
          checkInDate={cancellingBooking.check_in_date}
          totalPrice={cancellingBooking.total_price}
          currency={cancellingBooking.currency}
          onClose={() => setCancellingBooking(null)}
          onCancelled={() => {
            setCancellingBooking(null)
            loadProfile()
          }}
        />
      )}
    </div>
  )
}
