/**
 * ============================================================
 * Register Page — server shell + metadata
 * ============================================================
 *
 * Server Component. Two responsibilities:
 *
 *   1. Export `generateMetadata` so /register?ref=CODE renders a
 *      branded link preview (different from generic site OG)
 *      when shared on LINE / Facebook / X. Without this, every
 *      shared referral link looks identical and there's no
 *      visual signal that the recipient gets a discount.
 *
 *   2. Mount the client form (RegisterClient) for actual signup.
 *
 * The dynamic OG image at /api/og/referral?code=… does the
 * heavy lifting — this file just wires the metadata to point
 * at it.
 * ============================================================
 */

import type { Metadata } from 'next'
import RegisterClient from './RegisterClient'

interface PageProps {
  searchParams: Promise<{ ref?: string | string[] }>
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams
  const raw = Array.isArray(params.ref) ? params.ref[0] : params.ref
  // Same defensive normalization as the OG image route — only
  // accept a sane code shape, otherwise treat as no-ref.
  const code =
    typeof raw === 'string' &&
    /^[A-Z0-9]{4,16}$/.test(raw.trim().toUpperCase())
      ? raw.trim().toUpperCase()
      : null

  // Default copy for direct visits to /register.
  const defaultTitle = 'สมัครสมาชิก'
  const defaultDescription =
    'สมัครสมาชิก Got Journey Thailand เพื่อจองโรงแรมและรถเช่าในเชียงรายได้สะดวก รับสิทธิพิเศษและคูปองส่วนลด'

  // Referral-aware copy when the URL carries a valid `?ref`.
  const refTitle = '🎁 รับส่วนลดเมื่อจองครั้งแรก'
  const refDescription = code
    ? `เพื่อนชวนคุณมา — ใช้รหัส ${code} รับส่วนลดเมื่อจองครั้งแรก`
    : defaultDescription

  const title = code ? refTitle : defaultTitle
  const description = code ? refDescription : defaultDescription

  // The dynamic OG image — when ?ref is present we point the
  // crawler at the referral-flavored card. Otherwise we let
  // Next.js fall back to the default app/opengraph-image.tsx.
  const ogImageUrl = code
    ? `/api/og/referral?code=${encodeURIComponent(code)}`
    : undefined

  return {
    title,
    description,
    alternates: {
      canonical: code ? `/register?ref=${code}` : '/register',
    },
    openGraph: {
      type: 'website',
      url: code ? `/register?ref=${code}` : '/register',
      title,
      description,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: 'Referral discount preview',
            },
          ]
        : undefined,
      locale: 'th_TH',
      alternateLocale: ['en_US'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  }
}

export default function RegisterPage() {
  return <RegisterClient />
}
