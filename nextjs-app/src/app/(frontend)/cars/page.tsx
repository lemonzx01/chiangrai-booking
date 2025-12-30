import { createClient } from '@/lib/supabase/server'
import CarsClient from './CarsClient'

export const metadata = {
  title: 'Car Rentals | Waygo Thailand',
  description: 'Browse our premium car rental collection',
}

export default async function CarsPage() {
  const supabase = await createClient()

  const { data: cars } = await supabase
    .from('cars')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return <CarsClient cars={cars || []} />
}
