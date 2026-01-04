/**
 * ============================================================
 * useAuth Hook - จัดการ Authentication สำหรับ Admin
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - จัดการสถานะการล็อกอินของแอดมิน
 *   - ให้ฟังก์ชัน login, logout, checkAuth
 *   - ติดตามสถานะ loading และ user
 *
 * การใช้งาน:
 *   - ใช้ใน Admin pages เพื่อตรวจสอบสิทธิ์
 *   - จัดการ login/logout flow
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * Interface สำหรับข้อมูล Admin User
 */
interface AdminUser {
  /** รหัสแอดมิน */
  id: string
  /** อีเมลแอดมิน */
  email: string
  /** ชื่อแอดมิน */
  name: string
  /** บทบาท (admin, superadmin) */
  role: string
}

// ============================================================
// Hook Definition
// ============================================================

/**
 * Hook สำหรับจัดการ Authentication ของแอดมิน
 *
 * @description จัดการสถานะการล็อกอิน ให้ฟังก์ชัน login/logout
 *              และตรวจสอบสิทธิ์อัตโนมัติเมื่อ component mount
 *
 * @returns Object ที่มี:
 *          - user: ข้อมูลแอดมิน (null ถ้ายังไม่ล็อกอิน)
 *          - loading: สถานะกำลังโหลด
 *          - isAuthenticated: ล็อกอินแล้วหรือไม่
 *          - login: ฟังก์ชันล็อกอิน
 *          - logout: ฟังก์ชันล็อกเอาท์
 *          - checkAuth: ฟังก์ชันตรวจสอบสถานะ
 *
 * @example
 * const { user, isAuthenticated, login, logout, loading } = useAuth()
 *
 * if (loading) return <Loading />
 * if (!isAuthenticated) return <Redirect to="/admin/login" />
 */
export function useAuth() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------

  const router = useRouter()

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  /** ข้อมูลแอดมินที่ล็อกอิน */
  const [user, setUser] = useState<AdminUser | null>(null)

  /** สถานะกำลังตรวจสอบ authentication */
  const [loading, setLoading] = useState(true)

  // ----------------------------------------------------------
  // Check Auth Function (ตรวจสอบสถานะการล็อกอิน)
  // ----------------------------------------------------------

  /**
   * ตรวจสอบสถานะการล็อกอิน
   *
   * @description เรียก API เพื่อตรวจสอบว่าผู้ใช้ล็อกอินอยู่หรือไม่
   *              อัปเดต user state ตามผลลัพธ์
   */
  const checkAuth = useCallback(async () => {
    try {
      // เรียก API ตรวจสอบ authentication
      const response = await fetch('/api/admin/auth')

      if (response.ok) {
        const data = await response.json()
        setUser(data.user || null)
      } else {
        // ถ้า response ไม่สำเร็จ แสดงว่าไม่ได้ล็อกอิน
        setUser(null)
      }
    } catch {
      // ถ้าเกิด error แสดงว่าไม่ได้ล็อกอิน
      setUser(null)
    } finally {
      // เสร็จสิ้นการตรวจสอบ
      setLoading(false)
    }
  }, [])

  // ----------------------------------------------------------
  // Auto Check on Mount (ตรวจสอบอัตโนมัติเมื่อ mount)
  // ----------------------------------------------------------

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // ----------------------------------------------------------
  // Login Function (ฟังก์ชันล็อกอิน)
  // ----------------------------------------------------------

  /**
   * ล็อกอินแอดมิน
   *
   * @description ส่งข้อมูล email และ password ไปยัง API
   *              ถ้าสำเร็จจะอัปเดต user state และ redirect ไป dashboard
   *
   * @param email - อีเมลแอดมิน
   * @param password - รหัสผ่าน
   * @returns ข้อมูล user ที่ล็อกอินสำเร็จ
   * @throws Error ถ้าล็อกอินไม่สำเร็จ
   */
  const login = useCallback(async (email: string, password: string) => {
    // เรียก API ล็อกอิน
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    // ถ้าล็อกอินไม่สำเร็จ ให้ throw error
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    // อัปเดต user state
    const data = await response.json()
    setUser(data.user)

    // redirect ไปหน้า dashboard
    router.push('/admin/dashboard')

    return data
  }, [router])

  // ----------------------------------------------------------
  // Logout Function (ฟังก์ชันล็อกเอาท์)
  // ----------------------------------------------------------

  /**
   * ล็อกเอาท์แอดมิน
   *
   * @description เรียก API เพื่อลบ token และ redirect ไปหน้าล็อกอิน
   */
  const logout = useCallback(async () => {
    // เรียก API ลบ token
    await fetch('/api/admin/auth', { method: 'DELETE' })

    // ล้าง user state
    setUser(null)

    // redirect ไปหน้าล็อกอิน
    router.push('/admin/login')
  }, [router])

  // ----------------------------------------------------------
  // Return
  // ----------------------------------------------------------

  return {
    /** ข้อมูลแอดมินที่ล็อกอิน */
    user,
    /** สถานะกำลังโหลด */
    loading,
    /** ล็อกอินแล้วหรือไม่ */
    isAuthenticated: !!user,
    /** ฟังก์ชันล็อกอิน */
    login,
    /** ฟังก์ชันล็อกเอาท์ */
    logout,
    /** ฟังก์ชันตรวจสอบสถานะ */
    checkAuth,
  }
}

export default useAuth
