'use client'

/**
 * ============================================================
 * Global Error Boundary — replaces the root layout when an
 * error happens at the layout level (the route-group boundaries
 * can't catch it). Required by Next.js App Router.
 *
 * Inline styles only — Tailwind isn't guaranteed to be loaded
 * here, since the failure may have happened during the layout's
 * own render. We mirror the editorial recipe by hand: small
 * uppercase eyebrow, mixed-weight headline with a serif italic,
 * thin accent rule, slate palette.
 * ============================================================
 */

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="th">
      <body
        style={{
          margin: 0,
          fontFamily:
            "Plus Jakarta Sans, system-ui, -apple-system, sans-serif",
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fafbfc',
          color: '#0f172a',
          padding: '6rem 2rem',
        }}
      >
        <div style={{ maxWidth: '32rem', width: '100%' }}>
          <p
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#ef4444',
              margin: '0 0 0.5rem',
            }}
          >
            Critical Error — 500
          </p>
          <h1
            style={{
              fontSize: '2rem',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              margin: '0 0 0.75rem',
              color: '#0f172a',
            }}
          >
            <span style={{ fontWeight: 700 }}>เกิดข้อผิดพลาด</span>{' '}
            <em style={{ fontWeight: 300, color: '#64748b' }}>ร้ายแรง</em>
          </h1>
          <div
            style={{
              height: 1,
              width: 48,
              background: '#cbd5e1',
              margin: '1.25rem 0',
            }}
          />
          <p style={{ color: '#64748b', margin: '0 0 0.5rem', lineHeight: 1.6 }}>
            ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด ลองรีเฟรชหรือเปิดหน้าใหม่
          </p>
          <p style={{ color: '#94a3b8', margin: '0 0 2rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Sorry, an unexpected error occurred.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginBottom: '1.5rem',
                fontFamily: 'monospace',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#0f172a',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            ลองใหม่
          </button>
        </div>
      </body>
    </html>
  )
}
