/**
 * ============================================================
 * Stripe Connect Status API Route
 * ============================================================
 *
 * Objective:
 *   - Retrieve the status of a partner's Stripe Connect account.
 *   - Check if the account is fully onboarded and ready for payments.
 *
 * Endpoint:
 *   - GET /api/partners/[id]/stripe-status
 *
 * ============================================================
 */
export const dynamic = 'force-dynamic'


// Imports
import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../../lib/supabase/server'
import { getStripe } from '../../../../../lib/stripe'
import { logger } from '../../../../../lib/logger'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const partnerId = params.id
  const supabase = await createAdminClient()
  const stripe = getStripe()

  try {
    // 1. Fetch partner data to get the Stripe Account ID
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('stripe_account_id')
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner || !partner.stripe_account_id) {
      return NextResponse.json({ error: 'Stripe account not found for this partner' }, { status: 404 })
    }

    // 2. Retrieve the account details from Stripe
    const account = await stripe.accounts.retrieve(partner.stripe_account_id)

    // 3. Check the account status
    const isOnboarded = account.charges_enabled && account.details_submitted

    // 4. Return the status to the client
    return NextResponse.json({
      isOnboarded,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
    })

  } catch (error: any) {
    logger.error('Stripe Connect status error', { error })
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    )
  }
}

