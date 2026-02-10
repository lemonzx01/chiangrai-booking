/**
 * ============================================================
 * Stripe Connect Onboarding API Route
 * ============================================================
 *
 * Objective:
 *   - Create a Stripe Connect account for a partner if it doesn't exist.
 *   - Generate a Stripe Account Link for the partner to start onboarding.
 *
 * Endpoint:
 *   - POST /api/partners/[id]/connect-stripe
 *
 * ============================================================
 */
export const dynamic = 'force-dynamic'


// Imports
import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../../lib/supabase/server'
import { createConnectAccount, createAccountLink } from '../../../../../lib/stripe'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const partnerId = params.id
  const supabase = await createAdminClient()

  try {
    // 1. Fetch partner data
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    let stripeAccountId = partner.stripe_account_id

    // 2. Create a Stripe Connect account if it doesn't exist
    if (!stripeAccountId) {
      const account = await createConnectAccount(partner.email)
      stripeAccountId = account.id

      // Save the new account ID to the partner record
      const { error: updateError } = await supabase
        .from('partners')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', partnerId)

      if (updateError) {
        throw new Error('Failed to save Stripe account ID to partner')
      }
    }

    // 3. Create an account link for onboarding
    const returnUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/admin/partners/${partnerId}/edit?stripe_return=true`
    const refreshUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/admin/partners/${partnerId}/edit?stripe_refresh=true`

    const accountLink = await createAccountLink(stripeAccountId, returnUrl, refreshUrl)

    // 4. Return the account link URL to the client
    return NextResponse.json({ url: accountLink.url })

  } catch (error: any) {
    console.error('Stripe Connect error:', error)
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    )
  }
}

