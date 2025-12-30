import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'
import { MOCK_HOTELS, MOCK_CARS } from '@/lib/constants'

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

  // Use mock data if database is empty
  const displayHotels = (hotels && hotels.length > 0) ? hotels : MOCK_HOTELS
  const displayCars = (cars && cars.length > 0) ? cars : MOCK_CARS

  return <HomeClient hotels={displayHotels} cars={displayCars} />
}
