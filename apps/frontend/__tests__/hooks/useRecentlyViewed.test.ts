/**
 * ============================================================
 * useRecentlyViewed tests
 * ============================================================
 *
 * Covers the localStorage contract:
 *   - Empty on first render
 *   - track() adds an entry
 *   - track() of an existing id updates timestamp + moves to front
 *   - List is capped at 12 entries
 *   - clear() empties the list
 *   - Corrupt storage doesn't crash
 * ============================================================
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useRecentlyViewed from '@/hooks/useRecentlyViewed'

const STORAGE_KEY = 'recently_viewed_v1'

describe('useRecentlyViewed', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('starts empty when storage is empty', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    expect(result.current.items).toEqual([])
  })

  it('hydrates from localStorage on mount', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ kind: 'hotel', id: 'h1', viewedAt: 1 }])
    )
    const { result } = renderHook(() => useRecentlyViewed())
    expect(result.current.items.map((i) => i.id)).toEqual(['h1'])
  })

  it('track() adds a new entry to the front', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.track('hotel', 'h1')
    })
    expect(result.current.items.map((i) => i.id)).toEqual(['h1'])
    act(() => {
      result.current.track('car', 'c1')
    })
    expect(result.current.items.map((i) => i.id)).toEqual(['c1', 'h1'])
  })

  it('track() of an existing id moves it to the front (no duplicates)', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.track('hotel', 'h1')
      result.current.track('car', 'c1')
      result.current.track('hotel', 'h1') // re-view h1
    })
    expect(result.current.items.map((i) => `${i.kind}-${i.id}`)).toEqual([
      'hotel-h1',
      'car-c1',
    ])
  })

  it('caps the list at 12 entries', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.track('hotel', `h${i}`)
      }
    })
    expect(result.current.items.length).toBe(12)
    // Newest is at the front
    expect(result.current.items[0].id).toBe('h14')
    // Oldest 3 dropped
    expect(result.current.items.find((i) => i.id === 'h0')).toBeUndefined()
    expect(result.current.items.find((i) => i.id === 'h2')).toBeUndefined()
  })

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.track('car', 'c42')
    })
    const raw = window.localStorage.getItem(STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!) as Array<{ id: string }>
    expect(parsed[0].id).toBe('c42')
  })

  it('clear() empties both state and storage', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.track('hotel', 'h1')
      result.current.track('car', 'c1')
    })
    expect(result.current.items.length).toBe(2)
    act(() => {
      result.current.clear()
    })
    expect(result.current.items).toEqual([])
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })

  it('does not crash when storage contains malformed JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{ not json')
    const { result } = renderHook(() => useRecentlyViewed())
    expect(result.current.items).toEqual([])
  })

  it('drops entries with unexpected shape', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { kind: 'hotel', id: 'good', viewedAt: 1 },
        { kind: 'invalid_kind', id: 'bad' },
        { id: 'no-kind' },
        null,
        'string',
      ])
    )
    const { result } = renderHook(() => useRecentlyViewed())
    expect(result.current.items.map((i) => i.id)).toEqual(['good'])
  })

  it('ignores empty id', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.track('hotel', '')
    })
    expect(result.current.items).toEqual([])
  })
})
