/**
 * GET  /api/admin/campaigns        list past campaigns
 * POST /api/admin/campaigns        create + send a new campaign
 *
 * Cohort options:
 *   - all_customers:    every distinct customer_email in `bookings`
 *   - past_bookers:     customers with at least one PAID/COMPLETED booking
 *   - recent_bookers:   bookings created in the last N days (default 30)
 *   - cancelled:        customers whose most recent booking was CANCELLED
 *                       — useful for win-back campaigns
 *   - custom_emails:    explicit list typed by the admin
 *
 * Send behavior:
 *   - We fan out sequentially (await per-recipient). Resend's
 *     free tier rate-limits at 100/min; stay polite.
 *   - Each send is wrapped in a try/catch so one failure
 *     doesn't abort the run. Final status reflects the count.
 *   - Mock mode: every "send" is a logger.info, never a real
 *     SMTP/Resend call.
 *
 * NOTE: this endpoint does the send synchronously, which is
 * fine for cohorts ≤ 1000 on Vercel's 60s function ceiling.
 * Larger sends should move to a background worker before
 * we ship to a list bigger than that — there's a TODO in the
 * code where the boundary lives.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '../../../../lib/supabase/server'
import { requireAdmin } from '../../../../lib/authz'
import { verifyCsrfToken } from '../../../../lib/csrf'
import { logAdminAction } from '../../../../lib/audit'
import { logger } from '../../../../lib/logger'
import { sendEmail } from '../../../../services/notifications/email'
import { renderCampaignEmail } from '../../../../services/notifications/templates/campaign'

const COHORTS = [
  'all_customers',
  'past_bookers',
  'recent_bookers',
  'cancelled',
  'custom_emails',
] as const
type Cohort = (typeof COHORTS)[number]

const HARD_RECIPIENT_CAP = 1000

const campaignSchema = z
  .object({
    subject: z.string().min(3).max(150),
    body: z.string().min(10).max(20_000),
    preheader: z.string().max(200).optional(),
    cohort: z.enum(COHORTS),
    cohort_filters: z
      .object({
        days: z.number().int().min(1).max(365).optional(),
        custom_emails: z.array(z.string().email()).max(HARD_RECIPIENT_CAP).optional(),
      })
      .optional(),
    cta: z
      .object({
        label: z.string().min(1).max(50),
        url: z.string().url(),
      })
      .optional(),
    /** Set true to skip the actual send and just preview the
     * recipient count. Useful before pulling the trigger on
     * a large run. */
    dry_run: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (
      v.cohort === 'custom_emails' &&
      (!v.cohort_filters?.custom_emails ||
        v.cohort_filters.custom_emails.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cohort_filters', 'custom_emails'],
        message: 'custom_emails ต้องมีอย่างน้อย 1 email',
      })
    }
  })

// ---------------------------------------------------------------
// GET — list campaigns (most recent first, paginated)
// ---------------------------------------------------------------

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))

  const supabase = await createAdminClient()
  const { data, error, count } = await supabase
    .from('email_campaigns')
    .select(
      'id, subject, cohort, cohort_filters, status, recipient_count, succeeded_count, failed_count, created_by_email, created_at, completed_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    logger.error('campaign list failed', { error: error.message })
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 })
  }

  return NextResponse.json({
    data,
    pagination: { total: count || 0, limit, offset },
  })
}

// ---------------------------------------------------------------
// POST — send a new campaign
// ---------------------------------------------------------------

export async function POST(request: Request) {
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = campaignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลแคมเปญไม่ครบถ้วน', details: parsed.error.issues },
      { status: 400 }
    )
  }
  const data = parsed.data
  const supabase = await createAdminClient()

  // ---- 1. Resolve recipient list -------------------------------
  let recipients: Array<{ email: string; name: string }> = []
  try {
    recipients = await resolveRecipients(supabase, data.cohort, data.cohort_filters)
  } catch (err) {
    logger.error('campaign cohort resolve failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { error: 'ไม่สามารถระบุกลุ่มผู้รับได้' },
      { status: 500 }
    )
  }

  // Hard cap as a runtime guard — schema enforces for custom_emails,
  // this catches the dynamic cohorts.
  if (recipients.length > HARD_RECIPIENT_CAP) {
    recipients = recipients.slice(0, HARD_RECIPIENT_CAP)
    logger.warn('campaign trimmed to hard cap', {
      cap: HARD_RECIPIENT_CAP,
    })
  }

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: 'ไม่มีผู้รับที่ตรงกับเงื่อนไข' },
      { status: 400 }
    )
  }

  // Dry-run short-circuit — admin previews count without sending.
  if (data.dry_run) {
    return NextResponse.json({
      dry_run: true,
      recipient_count: recipients.length,
      sample_emails: recipients.slice(0, 5).map((r) => r.email),
    })
  }

  // ---- 2. Insert the campaign row in 'sending' state -----------
  const { data: campaignRow, error: insertErr } = await supabase
    .from('email_campaigns')
    .insert({
      created_by: auth.user.id || null,
      created_by_email: auth.user.email || null,
      subject: data.subject,
      body_html: data.body,
      preheader: data.preheader || null,
      cohort: data.cohort,
      cohort_filters: data.cohort_filters || {},
      status: 'sending',
      recipient_count: recipients.length,
    })
    .select()
    .single()

  if (insertErr || !campaignRow) {
    logger.error('campaign insert failed', { error: insertErr })
    return NextResponse.json(
      { error: 'ไม่สามารถบันทึกแคมเปญได้' },
      { status: 500 }
    )
  }

  // ---- 3. Fan out -------------------------------------------
  // TODO: when recipients > ~500, kick this onto a background
  // queue (Vercel Cron or external worker). 60s function
  // ceiling can fit ~1000 sends comfortably with mock mode and
  // ~200-300 with real Resend latency.
  let succeeded = 0
  let failed = 0
  const errorSamples: string[] = []
  for (const r of recipients) {
    try {
      const { subject, html } = renderCampaignEmail({
        subject: data.subject,
        body: data.body,
        preheader: data.preheader,
        customerName: r.name,
        cta: data.cta,
      })
      // sendEmail returns null on failure (see implementation
      // in services/notifications/email.ts). Mock mode always
      // returns {data: {messageId}} so it counts as success.
      const result = await sendEmail({ to: r.email, subject, html })
      if (result === null) {
        failed++
        if (errorSamples.length < 3) {
          errorSamples.push(`send failed for ${r.email}`)
        }
      } else {
        succeeded++
      }
    } catch (err) {
      failed++
      if (errorSamples.length < 3) {
        errorSamples.push(err instanceof Error ? err.message : String(err))
      }
    }
  }

  const finalStatus =
    failed === 0 ? 'sent' : succeeded === 0 ? 'failed' : 'partial'

  // ---- 4. Update the campaign row with the outcome -------------
  const { error: updateErr } = await supabase
    .from('email_campaigns')
    .update({
      status: finalStatus,
      succeeded_count: succeeded,
      failed_count: failed,
      error_summary: errorSamples.length > 0 ? errorSamples.join(' | ').slice(0, 500) : null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', campaignRow.id)
  if (updateErr) {
    logger.error('campaign final update failed', { error: updateErr })
  }

  // ---- 5. Audit row --------------------------------------------
  logAdminAction({
    actor: auth.user,
    request,
    action: 'campaign.send',
    resource_type: 'email_campaign',
    resource_id: campaignRow.id,
    metadata: {
      cohort: data.cohort,
      recipient_count: recipients.length,
      succeeded,
      failed,
      subject: data.subject,
    },
  })

  return NextResponse.json({
    id: campaignRow.id,
    status: finalStatus,
    recipient_count: recipients.length,
    succeeded,
    failed,
    error_summary: errorSamples.length > 0 ? errorSamples : null,
  })
}

// ---------------------------------------------------------------
// Cohort resolution
// ---------------------------------------------------------------

async function resolveRecipients(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  cohort: Cohort,
  filters: z.infer<typeof campaignSchema>['cohort_filters']
): Promise<Array<{ email: string; name: string }>> {
  if (cohort === 'custom_emails') {
    const list = filters?.custom_emails || []
    return list.map((email) => ({ email, name: '' }))
  }

  // For all the bookings-derived cohorts we pull the most-recent
  // (customer_email, customer_name) per customer. Building the
  // SELECT this way (not GROUP BY) keeps it portable across the
  // mock client.
  let query = supabase
    .from('bookings')
    .select('customer_email, customer_name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (cohort === 'past_bookers') {
    query = query.in('status', ['PAID', 'COMPLETED'])
  } else if (cohort === 'recent_bookers') {
    const days = filters?.days || 30
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    query = query.gte('created_at', cutoff.toISOString())
  } else if (cohort === 'cancelled') {
    query = query.eq('status', 'CANCELLED')
  }
  // 'all_customers' → no extra filter

  const { data, error } = await query
  if (error) throw error

  const rows = (data as Array<{ customer_email: string; customer_name: string }> | null) || []
  // Dedupe by email — keep the first occurrence (which is the
  // most recent thanks to the ORDER BY).
  const seen = new Set<string>()
  const out: Array<{ email: string; name: string }> = []
  for (const r of rows) {
    if (!r.customer_email) continue
    const key = r.customer_email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ email: r.customer_email, name: r.customer_name || '' })
  }
  return out
}
