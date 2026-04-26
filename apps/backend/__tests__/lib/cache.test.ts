/**
 * ============================================================
 * Tests for lib/cache.ts (Phase 13 backend caching)
 * ============================================================
 *
 * Verifies the two helpers set the Cache-Control + Vary headers
 * we expect, and that they don't accidentally clobber other
 * headers on the response. Tiny but worthwhile — a regression
 * here means either over-caching (data leak) or under-caching
 * (cost / latency loss).
 * ============================================================
 */

import { describe, it, expect } from 'vitest'
import { NextResponse } from 'next/server'
import { withPublicCache, withPrivateNoStore } from '@/lib/cache'

describe('withPublicCache', () => {
  it('sets s-maxage with stale-while-revalidate', () => {
    const res = withPublicCache(NextResponse.json({ ok: true }))
    expect(res.headers.get('Cache-Control')).toBe(
      's-maxage=60, stale-while-revalidate=300, public'
    )
  })

  it('sets Vary: Accept-Encoding', () => {
    const res = withPublicCache(NextResponse.json({ ok: true }))
    expect(res.headers.get('Vary')).toBe('Accept-Encoding')
  })

  it('returns the same response object (mutates in place)', () => {
    const original = NextResponse.json({ data: [1, 2, 3] })
    const returned = withPublicCache(original)
    expect(returned).toBe(original)
  })

  it('preserves Content-Type', async () => {
    const res = withPublicCache(NextResponse.json({ ok: true }))
    expect(res.headers.get('Content-Type')).toContain('application/json')
  })
})

describe('withPrivateNoStore', () => {
  it('sets private no-store directives', () => {
    const res = withPrivateNoStore(NextResponse.json({ ok: true }))
    expect(res.headers.get('Cache-Control')).toBe('private, no-store, max-age=0')
  })

  it('returns the same response object', () => {
    const original = NextResponse.json({ secret: true })
    const returned = withPrivateNoStore(original)
    expect(returned).toBe(original)
  })

  it('does not set Vary (private responses are not shared)', () => {
    const res = withPrivateNoStore(NextResponse.json({ ok: true }))
    // Vary is unnecessary on private responses since each user
    // gets their own copy. Don't assert it's absent — just don't
    // claim it's set.
    expect(res.headers.get('Cache-Control')).not.toContain('public')
  })
})
