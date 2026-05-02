/**
 * ============================================================
 * Dynamic OG image — /api/og/referral?code=ABCDEFGH
 * ============================================================
 *
 * Purpose: when a user shares
 *   https://gotjourneythailand.com/register?ref=ABCDEFGH
 * to LINE / Facebook / X, the link preview shows a branded card
 * highlighting the code + the discount they'll get, instead of
 * the generic site OG image.
 *
 * Why a route handler (not opengraph-image.tsx):
 *   The conventional `opengraph-image.tsx` file produces a
 *   STATIC asset per route — it can't read URL search params
 *   like `?ref=CODE` because OG images are fetched by social
 *   crawlers from a separate URL, not the original page.
 *   A dynamic route handler that takes `?code=` lets us bake
 *   the code into the rendered image.
 *
 * Why ImageResponse + JSX:
 *   next/og runs JSX → PNG via Satori at the edge. Smaller
 *   bundle than spinning up Puppeteer / sharp. The styling
 *   uses the same indigo-purple gradient as the homepage OG
 *   so the brand reads consistent.
 *
 * Caching:
 *   `?code=` is the only input that changes the rendered image.
 *   We set a long cache TTL because the same code maps to the
 *   same image forever (codes don't get reassigned). The CDN
 *   serves the social crawler from cache; we only render once.
 * ============================================================
 */

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Same brand palette the email layout uses, so wherever the
// referral surface shows up, the visual identity matches.
const BRAND = {
  bg: '#0f172a',
  indigo: '#6366f1',
  indigoLight: '#a5b4fc',
  purple: '#a855f7',
  text: '#fff',
  muted: '#cbd5e1',
}

// Tunable from env so the OG copy stays in sync with the
// reward economics. If you change REFERRAL_REWARD_PERCENT,
// this image updates on next render — no redeploy needed.
const REWARD_PERCENT = process.env.REFERRAL_REWARD_PERCENT || '10'
const REWARD_MAX_THB = process.env.REFERRAL_REWARD_MAX_THB || '500'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const rawCode = url.searchParams.get('code') || ''
  // Defensive: only accept the alphabet our generator uses, so
  // a hand-typed garbage code can't inject into the rendered
  // PNG. The generator caps at 8 chars but we accept up to 16
  // to be lenient with future format changes.
  const code = /^[A-Z0-9]{4,16}$/.test(rawCode.trim().toUpperCase())
    ? rawCode.trim().toUpperCase()
    : ''

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
          background: `radial-gradient(circle at 30% 20%, ${BRAND.indigo} 0%, transparent 50%), radial-gradient(circle at 70% 80%, ${BRAND.purple} 0%, transparent 50%), ${BRAND.bg}`,
          color: BRAND.text,
          fontFamily: 'system-ui, sans-serif',
          padding: 80,
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: BRAND.indigoLight,
            marginBottom: 20,
          }}
        >
          🎁 เพื่อนชวนคุณมา
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            letterSpacing: -3,
            lineHeight: 1.05,
            textAlign: 'center',
            background: 'linear-gradient(135deg,#fff 0%,#c7d2fe 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: 16,
          }}
        >
          รับส่วนลด {REWARD_PERCENT}%
        </div>

        {/* Sub-headline */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            color: BRAND.text,
            marginBottom: 36,
          }}
        >
          เมื่อจองครั้งแรก สูงสุด ฿{REWARD_MAX_THB}
        </div>

        {/* Code box (only when a valid code was passed) */}
        {code ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 56px',
              border: `2px dashed ${BRAND.indigoLight}`,
              borderRadius: 24,
              background: 'rgba(99, 102, 241, 0.15)',
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: BRAND.indigoLight,
                marginBottom: 6,
              }}
            >
              รหัสแนะนำ
            </div>
            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                fontFamily: 'monospace',
                letterSpacing: 8,
                color: BRAND.text,
              }}
            >
              {code}
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 22,
              color: BRAND.muted,
              textAlign: 'center',
              maxWidth: 800,
            }}
          >
            สมัครเลยและจองทริปแรกของคุณกับ Got Journey Thailand
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 1,
            color: BRAND.muted,
          }}
        >
          gotjourneythailand.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Long edge cache — code → image is a pure function. If
        // we ever rename codes (we won't) we can bust by
        // appending a query string from the caller.
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    }
  )
}
