/**
 * ============================================================
 * Tests for availabilityBlockSchema (Phase 6.1 partner blockout)
 * ============================================================
 *
 * Guards the cross-field rules that prevent silly partner blocks
 * from being persisted:
 *   - exactly one of hotel_id / car_id (XOR)
 *   - room_type_id requires hotel_id
 *   - end_date strictly after start_date
 *
 * These rules also exist as a Postgres CHECK constraint in
 * migration 0016, but the Zod schema is the first line of
 * defense and gives a friendly bilingual error message.
 * ============================================================
 */

import { describe, it, expect } from 'vitest'
import { availabilityBlockSchema } from '@/lib/validations'

const HOTEL_ID = '550e8400-e29b-41d4-a716-446655440000'
const CAR_ID = '660e8400-e29b-41d4-a716-446655440000'
const ROOM_TYPE_ID = '770e8400-e29b-41d4-a716-446655440000'

describe('availabilityBlockSchema', () => {
  const baseHotelBlock = {
    hotel_id: HOTEL_ID,
    start_date: '2026-04-15',
    end_date: '2026-04-17',
    reason: 'ปิดปรับปรุง',
  }

  describe('happy paths', () => {
    it('accepts a hotel-wide block (no room_type)', () => {
      const result = availabilityBlockSchema.safeParse(baseHotelBlock)
      expect(result.success).toBe(true)
    })

    it('accepts a hotel block scoped to a single room type', () => {
      const result = availabilityBlockSchema.safeParse({
        ...baseHotelBlock,
        room_type_id: ROOM_TYPE_ID,
      })
      expect(result.success).toBe(true)
    })

    it('accepts a car-only block', () => {
      const result = availabilityBlockSchema.safeParse({
        car_id: CAR_ID,
        start_date: '2026-04-15',
        end_date: '2026-04-17',
        reason: 'นำรถเข้าซ่อม',
      })
      expect(result.success).toBe(true)
    })

    it('accepts an optional notes field', () => {
      const result = availabilityBlockSchema.safeParse({
        ...baseHotelBlock,
        notes: 'รอช่างจากกรุงเทพ',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('XOR (hotel vs car)', () => {
    it('rejects when both hotel_id and car_id are set', () => {
      const result = availabilityBlockSchema.safeParse({
        ...baseHotelBlock,
        car_id: CAR_ID,
      })
      expect(result.success).toBe(false)
    })

    it('rejects when neither hotel_id nor car_id is set', () => {
      const result = availabilityBlockSchema.safeParse({
        start_date: '2026-04-15',
        end_date: '2026-04-17',
        reason: 'ทดสอบ',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('room_type requires hotel', () => {
    it('rejects room_type_id without hotel_id (car block + room_type)', () => {
      const result = availabilityBlockSchema.safeParse({
        car_id: CAR_ID,
        room_type_id: ROOM_TYPE_ID,
        start_date: '2026-04-15',
        end_date: '2026-04-17',
        reason: 'mismatched',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('date validation', () => {
    it('rejects end_date equal to start_date', () => {
      const result = availabilityBlockSchema.safeParse({
        ...baseHotelBlock,
        end_date: baseHotelBlock.start_date,
      })
      expect(result.success).toBe(false)
    })

    it('rejects end_date before start_date', () => {
      const result = availabilityBlockSchema.safeParse({
        ...baseHotelBlock,
        start_date: '2026-04-17',
        end_date: '2026-04-15',
      })
      expect(result.success).toBe(false)
    })

    it('rejects malformed date strings', () => {
      const result = availabilityBlockSchema.safeParse({
        ...baseHotelBlock,
        start_date: '15/04/2026', // not ISO
      })
      expect(result.success).toBe(false)
    })

    it('rejects partial date strings', () => {
      const result = availabilityBlockSchema.safeParse({
        ...baseHotelBlock,
        end_date: '2026-04',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('reason field', () => {
    it('rejects empty reason', () => {
      const result = availabilityBlockSchema.safeParse({
        ...baseHotelBlock,
        reason: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects reason longer than 100 chars', () => {
      const result = availabilityBlockSchema.safeParse({
        ...baseHotelBlock,
        reason: 'x'.repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it('accepts reason at the exact 100-char boundary', () => {
      const result = availabilityBlockSchema.safeParse({
        ...baseHotelBlock,
        reason: 'x'.repeat(100),
      })
      expect(result.success).toBe(true)
    })
  })

  describe('notes field', () => {
    it('accepts notes up to 500 chars', () => {
      const result = availabilityBlockSchema.safeParse({
        ...baseHotelBlock,
        notes: 'x'.repeat(500),
      })
      expect(result.success).toBe(true)
    })

    it('rejects notes longer than 500 chars', () => {
      const result = availabilityBlockSchema.safeParse({
        ...baseHotelBlock,
        notes: 'x'.repeat(501),
      })
      expect(result.success).toBe(false)
    })
  })
})
