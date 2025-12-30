import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch featured hotels
  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(6)

  // Fetch featured cars
  const { data: cars } = await supabase
    .from('cars')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(4)

  return <HomeClient hotels={hotels || []} cars={cars || []} />
}
