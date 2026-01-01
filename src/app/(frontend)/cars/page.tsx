import { createClient } from '@/lib/supabase/server'
import CarsClient from './CarsClient'
import { MOCK_CARS } from '@/lib/constants'

export const metadata = {
  title: 'Car Rentals | Got Journey Thailand',
  description: 'Browse our premium car rental collection',
}

export default async function CarsPage() {
  const supabase = await createClient()

  const { data: cars } = await supabase
    .from('cars')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Use mock data if database is empty
  const displayCars = (cars && cars.length > 0) ? cars : MOCK_CARS

  return <CarsClient cars={displayCars} />
}
