/**
 * ============================================================
 * CSV serialization helpers
 * ============================================================
 *
 * Tiny, dep-free CSV writer. We use it for admin exports
 * (bookings, payments) where:
 *   - row counts are bounded (a year of bookings, not millions)
 *   - the consumer is Excel / Google Sheets, which both
 *     understand RFC-4180-ish CSV with comma separators,
 *     CRLF line endings, and double-quote escaping.
 *
 * Excel-Thai trick: Excel for Thai locale opens UTF-8 CSVs as
 * gibberish unless the file starts with a BOM (U+FEFF). We
 * prepend it by default — it's invisible to Google Sheets,
 * LibreOffice, and any CSV parser that follows the spec.
 * ============================================================
 */

/** Escape one cell value per RFC 4180. */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let s: string
  if (value instanceof Date) {
    s = value.toISOString()
  } else if (typeof value === 'object') {
    s = JSON.stringify(value)
  } else {
    s = String(value)
  }
  // If the cell contains comma / quote / newline → wrap in quotes
  // and double-up any embedded quotes.
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * Serialize an array of rows to CSV.
 *
 * @param headers Column order. Same key list will be looked up
 *                on each row; missing keys produce empty cells.
 * @param rows    Records keyed by the header names.
 * @param opts.bom Prepend UTF-8 BOM so Excel-Thai opens it
 *                 with the right encoding. Default true.
 */
export function rowsToCsv(
  headers: string[],
  rows: Array<Record<string, unknown>>,
  opts: { bom?: boolean } = {}
): string {
  const { bom = true } = opts
  const lines: string[] = []
  lines.push(headers.map(escapeCell).join(','))
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(','))
  }
  // Excel insists on CRLF for line breaks across all rows.
  const body = lines.join('\r\n') + '\r\n'
  return bom ? '﻿' + body : body
}

/** Common Content-Disposition header for an attachment download. */
export function csvAttachmentHeaders(filename: string): Record<string, string> {
  // RFC 5987 encoding for UTF-8 filenames so Thai filenames survive
  // browsers that aren't strict latin-1.
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_')
  const utf8 = encodeURIComponent(filename)
  return {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`,
  }
}
