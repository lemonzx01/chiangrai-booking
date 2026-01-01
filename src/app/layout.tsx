import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'Got Journey Thailand | Premium Travel Booking Platform',
  description: 'Book premium cars with exclusive villa packages. Experience luxury travel in Chiang Rai, Thailand.',
  keywords: ['travel', 'booking', 'hotel', 'car rental', 'chiang rai', 'thailand', 'vacation'],
  authors: [{ name: 'Got Journey Thailand' }],
  openGraph: {
    title: 'Got Journey Thailand | Premium Travel Booking Platform',
    description: 'Book premium cars with exclusive villa packages in Chiang Rai',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${font.variable} font-sans bg-[#fafbfc] text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
