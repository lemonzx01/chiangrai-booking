/**
 * ============================================================
 * Default favicon — generated at build time
 * ============================================================
 *
 * Next.js convention: app/icon.tsx renders to /icon and wires
 * itself up as the document favicon automatically. No manual
 * <link rel="icon"> or public/favicon.ico needed.
 *
 * This is a SAFE DEFAULT — replace this file (or drop a real
 * /public/favicon.ico) when you have brand artwork.
 * ============================================================
 */

import { ImageResponse } from 'next/og'

// Edge runtime sidesteps a Windows-only bug in @vercel/og where the
// static prerender path calls fileURLToPath on a malformed URL during
// `next build`. On Vercel (Linux) the bug doesn't trigger; running
// edge here makes both environments behave the same way.
export const runtime = 'edge'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
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
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: -1,
          fontFamily: 'system-ui, sans-serif',
          borderRadius: 6,
        }}
      >
        G
      </div>
    ),
    { ...size }
  )
}
