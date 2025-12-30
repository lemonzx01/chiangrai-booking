import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CarDetailClient from './CarDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: car } = await supabase
    .from('cars')
    .select('*')
    .eq('id', id)
    .single()

  if (!car) {
    return {
      title: 'Car Not Found | TravelEase',
    }
  }

  return {
    title: `${car.name_en} | TravelEase`,
    description: car.description_en,
  }
}

export default async function CarDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: car, error } = await supabase
    .from('cars')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !car) {
    notFound()
  }

  return <CarDetailClient car={car} />
}
