import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import HotelDetailClient from './HotelDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: hotel } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', id)
    .single()

  if (!hotel) {
    return {
      title: 'Hotel Not Found | Waygo Thailand',
    }
  }

  return {
    title: `${hotel.name_en} | Waygo Thailand`,
    description: hotel.description_en,
  }
}

export default async function HotelDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: hotel, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !hotel) {
    notFound()
  }

  return <HotelDetailClient hotel={hotel} />
}
