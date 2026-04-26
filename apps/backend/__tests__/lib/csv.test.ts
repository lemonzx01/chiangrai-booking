/**
 * ============================================================
 * Tests for lib/csv.ts (admin export helpers)
 * ============================================================
 *
 * The CSV serializer is the kind of code that bites you if
 * a customer's name has a comma or a Thai character. Cover
 * each escape rule explicitly.
 * ============================================================
 */

import { describe, it, expect } from 'vitest'
import { rowsToCsv, csvAttachmentHeaders } from '@/lib/csv'

describe('rowsToCsv', () => {
  it('produces a header row + body rows', () => {
    const csv = rowsToCsv(
      ['a', 'b'],
      [{ a: 1, b: 2 }, { a: 3, b: 4 }],
      { bom: false }
    )
    expect(csv).toBe('a,b\r\n1,2\r\n3,4\r\n')
  })

  it('prepends UTF-8 BOM by default for Excel-Thai compatibility', () => {
    const csv = rowsToCsv(['a'], [{ a: 1 }])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('quotes cells that contain commas', () => {
    const csv = rowsToCsv(['name'], [{ name: 'Doe, John' }], { bom: false })
    expect(csv).toContain('"Doe, John"')
  })

  it('escapes embedded double quotes by doubling them', () => {
    const csv = rowsToCsv(['note'], [{ note: 'Said "hello"' }], { bom: false })
    expect(csv).toContain('"Said ""hello"""')
  })

  it('quotes cells containing CR/LF', () => {
    const csv = rowsToCsv(['note'], [{ note: 'line1\nline2' }], { bom: false })
    expect(csv).toContain('"line1\nline2"')
  })

  it('handles null and undefined as empty cells', () => {
    const csv = rowsToCsv(['a', 'b'], [{ a: null, b: undefined }], { bom: false })
    expect(csv).toBe('a,b\r\n,\r\n')
  })

  it('keeps Thai characters intact', () => {
    const csv = rowsToCsv(['name'], [{ name: 'สมชาย' }], { bom: false })
    expect(csv).toContain('สมชาย')
  })

  it('serializes Date as ISO string', () => {
    const d = new Date('2026-04-27T03:00:00Z')
    const csv = rowsToCsv(['ts'], [{ ts: d }], { bom: false })
    expect(csv).toContain('2026-04-27T03:00:00.000Z')
  })

  it('JSON-stringifies object cells', () => {
    const csv = rowsToCsv(
      ['payload'],
      [{ payload: { ok: true } }],
      { bom: false }
    )
    expect(csv).toContain('{""ok"":true}')
  })

  it('produces empty cells for missing keys', () => {
    const csv = rowsToCsv(['a', 'b', 'c'], [{ a: 1 }], { bom: false })
    expect(csv).toBe('a,b,c\r\n1,,\r\n')
  })
})

describe('csvAttachmentHeaders', () => {
  it('sets text/csv content type with utf-8 charset', () => {
    const h = csvAttachmentHeaders('foo.csv')
    expect(h['Content-Type']).toBe('text/csv; charset=utf-8')
  })

  it('emits an ascii-safe filename plus filename* per RFC 5987', () => {
    const h = csvAttachmentHeaders('รายงาน.csv')
    // ASCII fallback: non-ASCII replaced with underscore
    expect(h['Content-Disposition']).toMatch(/filename="_+\.csv"/)
    // RFC 5987 filename* uses UTF-8 encoding
    expect(h['Content-Disposition']).toContain("filename*=UTF-8''")
    expect(h['Content-Disposition']).toContain(encodeURIComponent('รายงาน.csv'))
  })
})
