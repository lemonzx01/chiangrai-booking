/**
 * ============================================================
 * Admin Payments Page - หน้ารายการการชำระเงิน (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายการการชำระเงินทั้งหมด
 *   - แสดงสถิติการชำระเงิน
 *
 * Route:
 *   - /admin/payments - หน้ารายการการชำระเงิน
 *
 * Features:
 *   - ตารางแสดงรายการการชำระเงิน
 *   - Summary cards (Total Revenue, Success Rate, etc.)
 *   - Filter ตาม status และวันที่
 *   - Pagination
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

import { getBackendUrl } from '@/lib/api'
import { cookies } from 'next/headers'

/** Admin Sidebar component */
import AdminSidebar from '@/components/admin/Sidebar'

/** Payment Table component */
import PaymentTable from '@/components/admin/PaymentTable'

/** Utility functions */
import { formatCurrency } from '@chiangrai/shared/utils'

/** Types */
import { Payment, PaymentStatus, Currency } from '@chiangrai/shared/types'

/** Lucide icons */
import { CreditCard, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react'

// ============================================================
// Metadata
// ============================================================

/** Page metadata สำหรับ SEO */
export const metadata = {
  title: 'การชำระเงิน | Admin',
}

export const dynamic = 'force-dynamic'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Extended Payment interface สำหรับ API response
 * (รวม booking relation - simplified version)
 */
interface PaymentWithBooking {
  id: string
  booking_id: string
  stripe_payment_intent_id?: string | null
  stripe_checkout_session_id?: string | null
  amount: number
  currency: Currency
  status: PaymentStatus
  paid_at?: string | null
  created_at: string
  updated_at: string
  booking?: {
    booking_code: string
    customer_name: string
    customer_email: string
    total_price: number
    hotel?: { name_th: string } | null
    car?: { name_th: string } | null
  } | null
}

/**
 * Interface สำหรับสถิติการชำระเงิน
 */
interface PaymentStats {
  totalRevenue: number
  totalCount: number
  succeededCount: number
  failedCount: number
  pendingCount: number
  refundedCount: number
  successRate: number
  currency: string
}

// ============================================================
// Data Fetching Functions
// ============================================================

/**
 * ดึงรายการการชำระเงินทั้งหมด
 *
 * @returns {Promise<PaymentWithBooking[]>} รายการการชำระเงิน
 */
async function getPayments(): Promise<PaymentWithBooking[]> {
  try {
    // ดึง cookies เพื่อส่งไปยัง backend
    const cookieStore = await cookies()
    
    // ใช้ absolute URL สำหรับ Server Component
    const backendUrl = getBackendUrl()
    const apiUrl = `${backendUrl}/api/payments`
    
    // สร้าง headers พร้อม cookies ทั้งหมด
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // ส่ง cookies ทั้งหมดไปยัง backend
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ')
    
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }
    
    const res = await fetch(apiUrl, {
      cache: 'no-store',
      headers,
    })

    // ตรวจสอบว่า response เป็น JSON หรือไม่
    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Response is not JSON, got:', contentType)
      throw new Error('ไม่สามารถดึงรายการการชำระเงินได้ - Invalid response format')
    }

    const json = (await res.json()) as { 
      data?: PaymentWithBooking[]; 
      error?: string;
      pagination?: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return []
      }
      throw new Error(json.error || 'ไม่สามารถดึงรายการการชำระเงินได้')
    }

    // Convert status string to PaymentStatus enum and currency to Currency enum
    const payments = (json.data || []).map((payment) => ({
      ...payment,
      status: payment.status as PaymentStatus,
      currency: (payment.currency as Currency) || Currency.THB,
    }))

    return payments
  } catch (error) {
    console.error('Error fetching payments:', error)
    throw error
  }
}

/**
 * ดึงสถิติการชำระเงิน
 *
 * @returns {Promise<PaymentStats>} สถิติการชำระเงิน
 */
async function getPaymentStats(): Promise<PaymentStats> {
  try {
    // ดึง cookies เพื่อส่งไปยัง backend
    const cookieStore = await cookies()
    
    // ใช้ absolute URL สำหรับ Server Component
    const backendUrl = getBackendUrl()
    const apiUrl = `${backendUrl}/api/payments/stats`
    
    // สร้าง headers พร้อม cookies ทั้งหมด
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // ส่ง cookies ทั้งหมดไปยัง backend
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ')
    
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }
    
    const res = await fetch(apiUrl, {
      cache: 'no-store',
      headers,
    })

    // ตรวจสอบว่า response เป็น JSON หรือไม่
    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Response is not JSON, got:', contentType)
      throw new Error('ไม่สามารถดึงสถิติได้ - Invalid response format')
    }

    const json = (await res.json()) as PaymentStats | { error?: string }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return {
          totalRevenue: 0,
          totalCount: 0,
          succeededCount: 0,
          failedCount: 0,
          pendingCount: 0,
          refundedCount: 0,
          successRate: 0,
          currency: 'THB',
        }
      }
      throw new Error((json as { error?: string }).error || 'ไม่สามารถดึงสถิติได้')
    }

    return json as PaymentStats
  } catch (error) {
    console.error('Error fetching payment stats:', error)
    throw error
  }
}

// ============================================================
// Main Component
// ============================================================

/**
 * หน้ารายการการชำระเงินสำหรับ Admin
 *
 * @description
 *   แสดงตารางรายการการชำระเงินทั้งหมด
 *   พร้อมสถิติสรุป
 *
 * @returns {Promise<JSX.Element>} Admin payments page UI
 */
export default async function AdminPaymentsPage() {
  // ----------------------------------------------------------
  // Fetch Data
  // ----------------------------------------------------------
  let payments: PaymentWithBooking[] = []
  let stats: PaymentStats = {
    totalRevenue: 0,
    totalCount: 0,
    succeededCount: 0,
    failedCount: 0,
    pendingCount: 0,
    refundedCount: 0,
    successRate: 0,
    currency: 'THB',
  }

  try {
    payments = await getPayments()
    stats = await getPaymentStats()
  } catch {
    // handled below with empty state
  }

  // ----------------------------------------------------------
  // Stats Cards Configuration
  // ----------------------------------------------------------
  const statCards = [
    {
      title: 'รายได้รวม',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'ชำระเงินสำเร็จ',
      value: stats.succeededCount,
      icon: CheckCircle,
      color: 'bg-blue-500',
    },
    {
      title: 'ชำระเงินล้มเหลว',
      value: stats.failedCount,
      icon: XCircle,
      color: 'bg-red-500',
    },
    {
      title: 'รอดำเนินการ',
      value: stats.pendingCount,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'อัตราความสำเร็จ',
      value: `${stats.successRate}%`,
      icon: CreditCard,
      color: 'bg-purple-500',
    },
  ]

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="flex">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">การชำระเงิน</h1>

        {/* ============================================================
            Stats Grid - แสดงสถิติเป็น Cards
            ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              {/* Card Header - Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
              {/* Card Content - Title และ Value */}
              <p className="text-slate-500 text-sm mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ============================================================
            Payments Table
            ============================================================ */}
        <div>
          <PaymentTable payments={payments} />
        </div>
      </main>
    </div>
  )
}
