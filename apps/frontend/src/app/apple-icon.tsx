/**
 * ============================================================
 * Default Apple touch icon (iOS home-screen)
 * ============================================================
 *
 * Convention: app/apple-icon.tsx renders to /apple-icon and
 * Next.js automatically emits <link rel="apple-touch-icon">.
 *
 * 180×180 is the iOS home-screen size. Replace with real
 * artwork when available.
 * ============================================================
 */

import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
          color: '#fff',
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: -2,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        G
      </div>
    ),
    { ...size }
  )
}
