'use client'

import { createBrowserClient } from '@supabase/ssr'
import { createMockSupabaseClient } from './mock-client'

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    console.log('⚠️ Supabase not configured - using mock browser client')
    return createMockSupabaseClient() as any
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
