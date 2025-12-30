import { createClient } from '@/lib/supabase/server'
import HotelsClient from './HotelsClient'

export const metadata = {
  title: 'Hotels & Packages | Waygo Thailand',
  description: 'Browse our exclusive hotel packages and villa stays',
}

export default async function HotelsPage() {
  const supabase = await createClient()

  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return <HotelsClient hotels={hotels || []} />
}
