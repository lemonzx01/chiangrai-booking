import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLocalize } from '@/hooks/useLocalize'

// re-mock with controllable language
let mockLang = 'th'
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: mockLang,
    },
  }),
}))

describe('useLocalize', () => {
  it('should return lang as th by default', () => {
    mockLang = 'th'
    const { result } = renderHook(() => useLocalize())
    expect(result.current.lang).toBe('th')
  })

  describe('localize', () => {
    it('should return Thai value when lang is th', () => {
      mockLang = 'th'
      const { result } = renderHook(() => useLocalize())
      const value = result.current.localize({ th: 'สวัสดี', en: 'Hello' })
      expect(value).toBe('สวัสดี')
    })

    it('should return English value when lang is en', () => {
      mockLang = 'en'
      const { result } = renderHook(() => useLocalize())
      const value = result.current.localize({ th: 'สวัสดี', en: 'Hello' })
      expect(value).toBe('Hello')
    })

    it('should return value as-is if not a localized object', () => {
      mockLang = 'th'
      const { result } = renderHook(() => useLocalize())
      const value = result.current.localize('plain string' as any)
      expect(value).toBe('plain string')
    })
  })

  describe('getField', () => {
    it('should return Thai field', () => {
      mockLang = 'th'
      const { result } = renderHook(() => useLocalize())
      const obj = { name_th: 'โรงแรม', name_en: 'Hotel' }
      expect(result.current.getField(obj, 'name')).toBe('โรงแรม')
    })

    it('should return English field', () => {
      mockLang = 'en'
      const { result } = renderHook(() => useLocalize())
      const obj = { name_th: 'โรงแรม', name_en: 'Hotel' }
      expect(result.current.getField(obj, 'name')).toBe('Hotel')
    })

    it('should return empty string for missing field', () => {
      mockLang = 'th'
      const { result } = renderHook(() => useLocalize())
      expect(result.current.getField({}, 'name')).toBe('')
    })
  })

  describe('getArrayField', () => {
    it('should return Thai array field', () => {
      mockLang = 'th'
      const { result } = renderHook(() => useLocalize())
      const obj = { amenities_th: ['สระน้ำ', 'ฟิตเนส'], amenities_en: ['Pool', 'Fitness'] }
      expect(result.current.getArrayField(obj, 'amenities')).toEqual(['สระน้ำ', 'ฟิตเนส'])
    })

    it('should return empty array for missing field', () => {
      mockLang = 'th'
      const { result } = renderHook(() => useLocalize())
      expect(result.current.getArrayField({}, 'amenities')).toEqual([])
    })
  })
})
