/**
 * ============================================================
 * Supabase Client - Client-side Supabase Instance
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - สร้าง Supabase client สำหรับใช้ฝั่ง Browser (Client Components)
 *   - รองรับ Mock mode เมื่อไม่ได้ตั้งค่า Supabase
 *
 * การใช้งาน:
 *   - ใช้ใน Client Components ('use client')
 *   - สำหรับ real-time subscriptions
 *   - สำหรับ client-side data fetching
 *
 * Environment Variables:
 *   - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anonymous key
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import { createBrowserClient } from '@supabase/ssr'
import { createMockSupabaseClient } from './mock-client'
import type { Database } from '@chiangrai/shared/types/supabase'
import { logger } from '../logger'

// ============================================================
// Configuration Check (ตรวจสอบการตั้งค่า)
// ============================================================

/**
 * ตรวจสอบว่า Supabase ถูกตั้งค่าแล้วหรือไม่
 *
 * @description ตรวจสอบ environment variables ที่จำเป็น
 *              และตรวจสอบว่าไม่ใช่ค่า placeholder
 *
 * @returns true ถ้า Supabase ถูกตั้งค่าแล้ว, false ถ้ายังไม่ได้ตั้งค่า
 */
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )
}

// ============================================================
// Client Creation (สร้าง Client)
// ============================================================

/**
 * สร้าง Supabase Client สำหรับ Browser
 *
 * @description สร้าง Supabase client สำหรับใช้ใน Client Components
 *              ถ้าไม่ได้ตั้งค่า Supabase จะใช้ Mock client แทน
 *
 * @returns Supabase client instance หรือ Mock client
 *
 * @example
 * // ใน Client Component
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * function MyComponent() {
 *   const supabase = createClient()
 *
 *   useEffect(() => {
 *     const fetchData = async () => {
 *       const { data } = await supabase.from('hotels').select('*')
 *     }
 *     fetchData()
 *   }, [])
 * }
 */
export function createClient() {
  // ถ้าไม่ได้ตั้งค่า Supabase ให้ใช้ Mock client
  if (!isSupabaseConfigured()) {
    logger.info('Supabase not configured - using mock browser client')
    return createMockSupabaseClient() as ReturnType<typeof createBrowserClient>
  }

  // สร้าง Supabase Browser Client
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
