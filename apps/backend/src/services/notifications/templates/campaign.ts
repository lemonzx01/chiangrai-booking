/**
 * Email template — admin marketing campaign.
 *
 * Renders a brand-wrapped version of whatever body the admin
 * typed into the campaign composer. The composer accepts
 * Markdown-light input (links, line breaks, bold/italic) so
 * admins don't have to write HTML; we convert here.
 *
 * The customer name is interpolated as `{{name}}` placeholder
 * so admin can personalize ("Hi John, ..."). Anything missing
 * gets stripped to avoid awkward "Hi {{name}}," in the inbox.
 */
import { escapeHtml, wrapEmail, BRAND } from './layout'

export interface CampaignTemplateData {
  subject: string
  /** Raw markdown-lite body the admin typed. */
  body: string
  /** Optional preheader / inbox preview line. */
  preheader?: string
  /** Customer's name — substitutes for {{name}} in the body. */
  customerName: string
  /** Optional CTA button. */
  cta?: { label: string; url: string }
}

export function renderCampaignEmail(data: CampaignTemplateData) {
  const personalized = personalize(data.body, { name: data.customerName })
  const html = wrapEmail({
    preheader: data.preheader,
    eyebrow: 'ข่าวดี / News',
    heading: data.subject,
    body: markdownLiteToHtml(personalized),
    cta: data.cta,
    footerNote:
      'หากไม่ต้องการรับอีเมลแบบนี้ กรุณาตอบกลับเพื่อแจ้งยกเลิก / To unsubscribe, please reply to this email.',
  })
  return { subject: data.subject, html }
}

// ---------------------------------------------------------------
// Markdown-lite → HTML
//
// Why not pull in a real Markdown parser:
//   The composer accepts a tiny subset (links, **bold**, *italic*,
//   line breaks). A 30-line converter is safer than `marked` /
//   `markdown-it` because we control exactly what HTML can be
//   emitted — no chance of a parser bug rendering an attacker-
//   supplied <script>.
// ---------------------------------------------------------------

function markdownLiteToHtml(input: string): string {
  // 1. HTML-escape EVERYTHING first so injected tags can't survive.
  let s = escapeHtml(input)

  // 2. Apply the safe subset, in order:

  // **bold** — non-greedy
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')

  // *italic* — non-greedy, no double-asterisk overlap
  s = s.replace(/(^|[^*])\*([^*\n]+)\*([^*]|$)/g, '$1<em>$2</em>$3')

  // [label](url) — only http(s) URLs allowed; anything else stays escaped
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_, label, url) =>
      `<a href="${url}" style="color:${BRAND.primary};text-decoration:underline;">${label}</a>`
  )

  // Paragraph break: blank line → </p><p>
  // Single newline → <br>
  // Wrap the whole thing in <p>.
  s = '<p>' + s.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>'

  return s
}

function personalize(body: string, vars: Record<string, string>): string {
  // Strip leading "Hi {{name}}," when name is empty so we don't
  // ship "Hi ," into the customer's inbox.
  let s = body
  for (const [k, v] of Object.entries(vars)) {
    if (!v) {
      // Drop leading addressing line entirely if the variable is
      // empty — match e.g. "Hi {{name}}," at start of a line.
      s = s.replace(
        new RegExp(`^[^\\n]*\\{\\{\\s*${k}\\s*\\}\\}[^\\n]*\\n+`, 'i'),
        ''
      )
    }
    s = s.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), v)
  }
  return s
}
