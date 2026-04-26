/**
 * ============================================================
 * Email Layout — branded header / body / footer
 * ============================================================
 *
 * Why inline styles only:
 *   Email clients (Gmail, Outlook desktop, Yahoo, LINE Mail
 *   on iOS, etc.) strip <style> tags and ignore <link>. The
 *   only reliable way to style HTML email is inline `style=`
 *   attributes on every element.
 *
 * Why a hand-rolled layout instead of a framework like MJML:
 *   The set of templates is small (~7), the styling is simple,
 *   and pulling in MJML would add a build-time dependency. We
 *   trade some boilerplate for zero install footprint.
 *
 * Brand palette (single source of truth):
 *   indigo       #4F46E5  primary CTA, headings
 *   indigo dark  #4338CA  CTA hover (rendered statically — emails
 *                         don't have :hover, so we just pick one)
 *   ink          #0F172A  body text
 *   muted        #64748B  metadata
 *   surface      #F8FAFC  page background
 *   card         #FFFFFF  inner card
 *   border       #E2E8F0  hairline dividers
 * ============================================================
 */
import { APP_NAME } from '../../../lib/constants'

// ---------------------------------------------------------------
// Brand palette
// ---------------------------------------------------------------

export const BRAND = {
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  ink: '#0F172A',
  muted: '#64748B',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

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

/**
 * Public URL of the storefront — used for header link + CTA.
 * Falls back to gotjourneythailand.com on misconfigured envs.
 */
function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://gotjourneythailand.com'
  ).replace(/\/$/, '')
}

// ---------------------------------------------------------------
// Layout
// ---------------------------------------------------------------

export interface EmailLayoutOptions {
  /** Pre-header text shown in the inbox preview pane. Keep ≤ 90 chars. */
  preheader?: string
  /** Top-of-email accent color (default brand indigo). */
  accentColor?: string
  /** Optional eyebrow above the heading (small uppercase tag). */
  eyebrow?: string
  /** Big heading at the top of the body card. */
  heading: string
  /** Optional sub-heading shown below the heading. */
  subheading?: string
  /** Raw HTML body. */
  body: string
  /** Optional CTA button — rendered as a styled link. */
  cta?: { label: string; url: string }
  /** Optional small footer note above the auto-footer. */
  footerNote?: string
}

/**
 * Wrap inner HTML body with a branded header/footer.
 *
 * Email-client compatibility notes:
 *   - Outlook on Windows still uses Word's HTML renderer and
 *     ignores `border-radius`, `padding` on <a>, etc. We use
 *     conservative table-free layout but accept that Outlook
 *     will look slightly different.
 *   - Dark mode: most clients invert backgrounds automatically.
 *     We pick contrast pairs that survive both light and dark.
 */
export function wrapEmail(options: EmailLayoutOptions): string {
  const accent = options.accentColor || BRAND.primary
  const heading = escapeHtml(options.heading)
  const subheading = options.subheading
    ? `<p style="margin:8px 0 0 0;color:${BRAND.muted};font-size:15px;line-height:1.5;">${escapeHtml(options.subheading)}</p>`
    : ''
  const eyebrow = options.eyebrow
    ? `<div style="display:inline-block;padding:4px 10px;border-radius:999px;background:${accent}1a;color:${accent};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">${escapeHtml(options.eyebrow)}</div>`
    : ''

  const cta = options.cta
    ? `
      <div style="text-align:center;margin:28px 0 8px 0;">
        <a href="${escapeHtml(options.cta.url)}"
           style="display:inline-block;padding:14px 28px;background:${accent};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.2px;">
          ${escapeHtml(options.cta.label)}
        </a>
      </div>`
    : ''

  const footerNote = options.footerNote
    ? `<p style="margin:24px 0 0 0;color:${BRAND.muted};font-size:13px;line-height:1.5;">${escapeHtml(options.footerNote)}</p>`
    : ''

  // Hidden preheader pulls into the inbox preview line. We pad
  // with zero-width whitespace so Gmail doesn't show our actual
  // body text instead.
  const preheader = options.preheader
    ? `<div style="display:none;visibility:hidden;mso-hide:all;font-size:1px;color:${BRAND.surface};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(options.preheader)}${'&zwnj;&nbsp;'.repeat(60)}</div>`
    : ''

  const url = siteUrl()

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.surface};font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${BRAND.ink};">
  ${preheader}
  <div style="background:${BRAND.surface};padding:32px 16px;">
    <div style="max-width:600px;margin:0 auto;">

      <!-- Brand bar -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${url}" style="text-decoration:none;color:${BRAND.ink};font-size:18px;font-weight:800;letter-spacing:-0.5px;">
          ${escapeHtml(APP_NAME)}
        </a>
      </div>

      <!-- Card -->
      <div style="background:${BRAND.card};border-radius:16px;border:1px solid ${BRAND.border};overflow:hidden;">
        <!-- Accent strip -->
        <div style="height:4px;background:linear-gradient(90deg,${accent} 0%,${accent} 50%,${BRAND.primaryDark} 100%);"></div>

        <!-- Heading block -->
        <div style="padding:32px 32px 8px 32px;">
          ${eyebrow}
          <h1 style="margin:0;color:${BRAND.ink};font-size:26px;font-weight:800;line-height:1.25;letter-spacing:-0.4px;">${heading}</h1>
          ${subheading}
        </div>

        <!-- Body -->
        <div style="padding:8px 32px 24px 32px;color:${BRAND.ink};font-size:15px;line-height:1.65;">
          ${options.body}
          ${cta}
          ${footerNote}
        </div>
      </div>

      <!-- Outer footer -->
      <div style="text-align:center;color:${BRAND.muted};font-size:12px;line-height:1.6;margin-top:24px;padding:0 16px;">
        <div style="margin-bottom:6px;">
          <a href="${url}" style="color:${BRAND.muted};text-decoration:underline;">${escapeHtml(APP_NAME)}</a>
          &nbsp;·&nbsp;
          <a href="${url}/contact" style="color:${BRAND.muted};text-decoration:underline;">ติดต่อเรา</a>
          &nbsp;·&nbsp;
          <a href="${url}/privacy" style="color:${BRAND.muted};text-decoration:underline;">ความเป็นส่วนตัว</a>
        </div>
        <div>นี่เป็นอีเมลอัตโนมัติ — กรุณาอย่าตอบกลับ / This is an automated email — please don't reply.</div>
      </div>

    </div>
  </div>
</body>
</html>`.trim()
}

/**
 * Render a styled detail card (label + value rows).
 *
 * Common case: booking summary inside a confirmation email.
 * Two-column layout — label left, value right — works in
 * Outlook because it falls back to two stacked blocks.
 */
export function renderDetailCard(
  title: string,
  rows: Array<{ label: string; value: string | number | null | undefined }>,
  options: { background?: string; titleColor?: string } = {}
): string {
  const bg = options.background || BRAND.surface
  const titleColor = options.titleColor || BRAND.ink
  const visibleRows = rows.filter(
    (row) => row.value !== null && row.value !== undefined && row.value !== ''
  )
  return `
    <div style="background:${bg};padding:20px;border-radius:12px;border:1px solid ${BRAND.border};margin:16px 0;">
      <div style="margin:0 0 12px 0;color:${titleColor};font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(title)}</div>
      ${visibleRows
        .map(
          (row) => `
        <div style="display:block;margin:8px 0;font-size:14px;line-height:1.5;">
          <span style="color:${BRAND.muted};display:inline-block;min-width:130px;">${escapeHtml(row.label)}</span>
          <span style="color:${BRAND.ink};font-weight:600;">${escapeHtml(row.value)}</span>
        </div>`
        )
        .join('')}
    </div>
  `.trim()
}

/**
 * Render a horizontal "amount" hero — big number, small label.
 * Used at the top of confirmations to lead with the most
 * important fact (the amount paid).
 */
export function renderAmountHero(label: string, amount: string): string {
  return `
    <div style="text-align:center;padding:20px 0;border-radius:12px;background:linear-gradient(135deg,${BRAND.primary}0d 0%,${BRAND.primaryDark}1a 100%);margin:8px 0 20px 0;">
      <div style="color:${BRAND.muted};font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">${escapeHtml(label)}</div>
      <div style="color:${BRAND.primary};font-size:32px;font-weight:800;letter-spacing:-0.5px;">${escapeHtml(amount)}</div>
    </div>`.trim()
}

/**
 * Render a row of trust signals — small reassurance badges
 * shown below the CTA on confirmation emails.
 */
export function renderTrustBadges(): string {
  const badges = [
    'ยกเลิกฟรีก่อน 7 วัน',
    'ชำระเงินปลอดภัย',
    'ช่วยเหลือ 24/7',
  ]
  return `
    <div style="text-align:center;margin:16px 0 0 0;">
      ${badges
        .map(
          (b) => `
        <span style="display:inline-block;padding:4px 12px;margin:4px 4px;border-radius:999px;background:${BRAND.success}1a;color:${BRAND.success};font-size:11px;font-weight:600;">
          ✓ ${escapeHtml(b)}
        </span>`
        )
        .join('')}
    </div>`.trim()
}
