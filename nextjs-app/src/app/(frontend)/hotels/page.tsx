import { createClient } from '@/lib/supabase/server'
import HotelsClient from './HotelsClient'
import { MOCK_HOTELS } from '@/lib/constants'

export const metadata = {
  title: 'Hotels & Packages | TravelEase',
  description: 'Browse our exclusive hotel packages and villa stays',
}

export default async function HotelsPage() {
  const supabase = await createClient()

  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Use mock data if database is empty
  const displayHotels = (hotels && hotels.length > 0) ? hotels : MOCK_HOTELS

  return <HotelsClient hotels={displayHotels} />
}
