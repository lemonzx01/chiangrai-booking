'use client'

/**
 * ============================================================
 * Global Error Boundary - แสดงเมื่อ Root Layout เกิดข้อผิดพลาด
 * ============================================================
 *
 * Required by Next.js App Router. Must include <html> and <body>
 * because it replaces the root layout when an error occurs there.
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
          fontFamily: 'system-ui, -apple-system, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fafbfc',
          color: '#0f172a',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '4rem',
              fontWeight: 800,
              color: '#dc2626',
              marginBottom: '1rem',
            }}
          >
            500
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            เกิดข้อผิดพลาดร้ายแรง / Critical Error
          </h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
            <br />
            Sorry, an unexpected error occurred. Please try again.
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
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ลองใหม่ / Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
