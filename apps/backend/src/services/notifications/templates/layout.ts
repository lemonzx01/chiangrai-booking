/**
 * ============================================================
 * Email Layout — shared header/footer wrapper
 * ============================================================
 *
 * Usage:
 *   import { wrapEmail } from './layout'
 *
 *   const html = wrapEmail({
 *     heading: 'Booking Confirmed',
 *     headingColor: '#4F46E5',
 *     body: '<p>Hello ...</p>',
 *     footerNote: 'This is an automated email.',
 *   })
 *
 * Design goals:
 *   - Inline styles only (most email clients strip <style>/<link>)
 *   - Safe HTML escaping for interpolated values
 *   - Centralized branding (footer, color palette)
 *   - Works in both Thai and English subjects
 * ============================================================
 */
import { APP_NAME } from '../../../lib/constants'

/**
 * Escape HTML-unsafe characters so user data can't inject markup.
 */
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return ''
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface EmailLayoutOptions {
  /** Main heading shown prominently at the top of the email */
  heading: string
  /** Heading color (hex). Default = brand indigo */
  headingColor?: string
  /** Raw HTML body (already rendered) */
  body: string
  /** Optional small footer note above the auto-footer */
  footerNote?: string
}

/**
 * Wrap inner HTML body with a branded header/footer.
 */
export function wrapEmail(options: EmailLayoutOptions): string {
  const heading = escapeHtml(options.heading)
  const color = options.headingColor || '#4F46E5'
  const body = options.body
  const footerNote = options.footerNote
    ? `<p style="margin: 24px 0 0 0; color: #6B7280; font-size: 13px;">${escapeHtml(
        options.footerNote
      )}</p>`
    : ''

  return `
<div style="background:#F9FAFB;padding:24px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
    <div style="padding:24px 28px;border-bottom:1px solid #F3F4F6;">
      <h1 style="margin:0;color:${color};font-size:22px;font-weight:700;">${heading}</h1>
    </div>
    <div style="padding:24px 28px;color:#111827;font-size:15px;line-height:1.6;">
      ${body}
      ${footerNote}
    </div>
    <div style="padding:16px 28px;background:#F9FAFB;color:#9CA3AF;font-size:12px;text-align:center;border-top:1px solid #F3F4F6;">
      ${escapeHtml(APP_NAME)} &middot; นี่เป็นอีเมลอัตโนมัติ
    </div>
  </div>
</div>`.trim()
}

/**
 * Render a styled detail card (label + value rows).
 */
export function renderDetailCard(
  title: string,
  rows: Array<{ label: string; value: string | number | null | undefined }>,
  options: { background?: string; titleColor?: string } = {}
): string {
  const bg = options.background || '#F3F4F6'
  const titleColor = options.titleColor || '#111827'
  const visibleRows = rows.filter(
    (row) => row.value !== null && row.value !== undefined && row.value !== ''
  )
  return `
    <div style="background:${bg};padding:18px 20px;border-radius:10px;margin:16px 0;">
      <h3 style="margin:0 0 12px 0;color:${titleColor};font-size:15px;font-weight:700;">${escapeHtml(
    title
  )}</h3>
      ${visibleRows
        .map(
          (row) =>
            `<p style="margin:4px 0;font-size:14px;"><strong style="color:#4B5563;">${escapeHtml(
              row.label
            )}:</strong> <span style="color:#111827;">${escapeHtml(row.value)}</span></p>`
        )
        .join('')}
    </div>
  `.trim()
}
