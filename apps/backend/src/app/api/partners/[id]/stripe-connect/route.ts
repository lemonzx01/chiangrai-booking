export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../../lib/supabase/server';
import { createConnectAccount, createAccountLink } from '../../../../../lib/stripe';
import { logger } from '../../../../../lib/logger';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const partnerId = params.id;
  const supabase = await createAdminClient();

  // 1. Get partner details
  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .single();

  if (partnerError || !partner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
  }

  try {
    let stripeAccountId = partner.stripe_account_id;

    // 2. Create a Stripe Connect account if it doesn't exist
    if (!stripeAccountId) {
      const account = await createConnectAccount(partner.email);
      stripeAccountId = account.id;

      // Save the new account ID to the partner record
      await supabase
        .from('partners')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', partnerId);
    }

    // 3. Create an account link for onboarding
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const accountLink = await createAccountLink(
      stripeAccountId,
      `${origin}/admin/partners/${partnerId}?stripe_return=true`,
      `${origin}/admin/partners/${partnerId}?stripe_refresh=true`
    );

    return NextResponse.json({ url: accountLink.url });

  } catch (error: any) {
    logger.error('Stripe Connect error', { error });
    return NextResponse.json({ error: error.message || 'Failed to create Stripe Connect link' }, { status: 500 });
  }
}






