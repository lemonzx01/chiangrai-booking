/**
 * ============================================================
 * Default Open Graph image (social share preview)
 * ============================================================
 *
 * Convention: app/opengraph-image.tsx renders to
 * /opengraph-image and Next.js wires it into the OG metadata
 * for every page that doesn't override it. Pages can supply
 * their own opengraph-image.tsx in their route folder for
 * per-page custom artwork (e.g. a hotel detail page showing
 * the hotel's hero photo).
 *
 * 1200×630 is the spec for Facebook / LINE / X / LinkedIn —
 * any larger and Twitter downsamples; any smaller and FB
 * shows a small thumbnail instead of a hero card.
 * ============================================================
 */

import { ImageResponse } from 'next/og'

// Edge runtime — see icon.tsx for the rationale (Windows-only @vercel/og
// fileURLToPath bug during static prerender).
export const runtime = 'edge'

export const alt = 'Got Journey Thailand — premium travel booking'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 30% 20%, #6366f1 0%, transparent 50%), radial-gradient(circle at 70% 80%, #a855f7 0%, transparent 50%), #0f172a',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#a5b4fc',
            marginBottom: 24,
          }}
        >
          ✦ Premium Travel ✦
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: -3,
            lineHeight: 1.05,
            textAlign: 'center',
            background: 'linear-gradient(135deg,#fff 0%,#c7d2fe 100%)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Got Journey
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: -1,
            marginTop: 8,
            color: '#fff',
          }}
        >
          Thailand
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 24,
            color: '#cbd5e1',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          จองทริปเที่ยวพ่วงรถเช่าพรีเมียมในเชียงราย
        </div>
      </div>
    ),
    { ...size }
  )
}
