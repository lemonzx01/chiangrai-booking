/**
 * ============================================================
 * Supabase Server - Server-side Supabase Instance
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - สร้าง Supabase client สำหรับใช้ฝั่ง Server
 *   - รองรับ Server Components, API Routes, Server Actions
 *   - จัดการ cookies สำหรับ authentication
 *   - รองรับ Mock mode เมื่อไม่ได้ตั้งค่า Supabase
 *
 * การใช้งาน:
 *   - createClient(): สำหรับ operations ทั่วไป
 *   - createAdminClient(): สำหรับ admin operations (ใช้ service role key)
 *
 * Environment Variables:
 *   - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anonymous key
 *   - SUPABASE_SERVICE_ROLE_KEY: Service role key (สำหรับ admin operations)
 *
 * ============================================================
 */

// ============================================================
// Imports
// ============================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@chiangrai/shared/types/supabase'
import { createMockSupabaseClient } from './mock-client'

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
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )
}

// ============================================================
// Regular Client (Client ทั่วไป)
// ============================================================

/**
 * สร้าง Supabase Client สำหรับ Server-side
 *
 * @description สร้าง Supabase client สำหรับใช้ใน:
 *              - Server Components
 *              - API Routes
 *              - Server Actions
 *
 *              รองรับการจัดการ cookies สำหรับ authentication
 *              ถ้าไม่ได้ตั้งค่า Supabase จะใช้ Mock client แทน
 *
 * @returns Promise ของ Supabase client instance หรือ Mock client
 *
 * @example
 * // ใน Server Component หรือ API Route
 * import { createClient } from '@/lib/supabase/server'
 *
 * async function getData() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('hotels').select('*')
 *   return data
 * }
 */
export async function createClient() {
  if (!isSupabaseConfigured()) {
    // Mock mode: return in-memory mock client so every route works without real Supabase
    return createMockSupabaseClient() as any
  }

  // ดึง cookie store
  const cookieStore = await cookies()

  // สร้าง Supabase Server Client พร้อมการจัดการ cookies
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * ดึงค่า cookie ตามชื่อ
         * @param name - ชื่อ cookie
         * @returns ค่าของ cookie หรือ undefined
         */
        get(name: string) {
          return cookieStore.get(name)?.value
        },

        /**
         * ตั้งค่า cookie
         * @param name - ชื่อ cookie
         * @param value - ค่าที่ต้องการเก็บ
         * @param options - ตัวเลือกเพิ่มเติม (httpOnly, secure, etc.)
         */
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // ไม่สามารถตั้งค่า cookie ใน Server Components ได้
            // ปล่อยผ่านไปเพราะไม่สามารถทำอะไรได้
          }
        },

        /**
         * ลบ cookie
         * @param name - ชื่อ cookie ที่ต้องการลบ
         * @param options - ตัวเลือกเพิ่มเติม
         */
        remove(name: string, options: CookieOptions) {
          try {
            // ลบ cookie โดยการตั้งค่าเป็น empty string
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // ไม่สามารถลบ cookie ใน Server Components ได้
          }
        },
      },
    }
  )
}

// ============================================================
// Admin Client (Client สำหรับ Admin Operations)
// ============================================================

/**
 * สร้าง Supabase Admin Client
 *
 * @description สร้าง Supabase client ที่ใช้ Service Role Key
 *              สำหรับ operations ที่ต้องการสิทธิ์ admin:
 *              - Bypass Row Level Security (RLS)
 *              - จัดการผู้ใช้
 *              - Operations ที่ต้องการสิทธิ์พิเศษ
 *
 *              ⚠️ ใช้ด้วยความระมัดระวัง - มีสิทธิ์เต็มที่ในฐานข้อมูล
 *
 * @returns Promise ของ Supabase admin client instance หรือ Mock client
 *
 * @example
 * // ใน API Route ที่ต้องการสิทธิ์ admin
 * import { createAdminClient } from '@/lib/supabase/server'
 *
 * export async function POST(request: Request) {
 *   const supabase = await createAdminClient()
 *
 *   // ทำ operation ที่ต้องการ bypass RLS
 *   const { data } = await supabase
 *     .from('users')
 *     .insert({ ... })
 *
 *   return Response.json(data)
 * }
 */
export async function createAdminClient() {
  if (!isSupabaseConfigured()) {
    // Mock mode: return in-memory mock client (admin operations also use the same store)
    return createMockSupabaseClient() as any
  }

  // ดึง cookie store
  const cookieStore = await cookies()

  // สร้าง Supabase Admin Client ด้วย Service Role Key
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ใช้ Service Role Key แทน Anon Key
    {
      cookies: {
        /**
         * ดึงค่า cookie ตามชื่อ
         */
        get(name: string) {
          return cookieStore.get(name)?.value
        },

        /**
         * ตั้งค่า cookie
         */
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // ไม่สามารถตั้งค่า cookie ใน Server Components ได้
          }
        },

        /**
         * ลบ cookie
         */
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // ไม่สามารถลบ cookie ใน Server Components ได้
          }
        },
      },
    }
  )
}
