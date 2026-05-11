/**
 * ============================================================
 * Mock Checkout Page (development / mock-mode only)
 * ============================================================
 *
 * Purpose:
 *   - Closes the payment loop in mock mode where Stripe is not configured.
 *   - When the backend is in mock mode, /api/checkout creates a fake session
 *     and redirects here. This page POSTs a synthetic
 *     `checkout.session.completed` event to /api/webhook/stripe so the
 *     booking is marked PAID, then forwards the user to /success.
 *
 * URL: /checkout/mock?session=cs_mock_XXXX&booking_code=TEYYMMDD-XXXX
 * ============================================================
 */

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CreditCard, ShieldAlert, CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'

function MockCheckoutInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const sessionId = searchParams.get('session') || ''
  const bookingCode = searchParams.get('booking_code') || searchParams.get('code') || ''
  const amount = Number(searchParams.get('amount') || 0)
  const currency = (searchParams.get('currency') || 'THB').toUpperCase()

  const [status, setStatus] = useState<'idle' | 'paying' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const pay = async () => {
    setStatus('paying')
    setErrorMsg(null)

    try {
      // Synthetic Stripe webhook event — the mock backend's
      // stripe.webhooks.constructEvent simply parses the body as JSON.
      // booking_id MUST be present in metadata: the webhook handler
      // keys booking-status updates off it (real Stripe puts metadata
      // on the session; here it rides through the URL params).
      const bookingId = searchParams.get('booking_id') || ''
      const originalAmount = searchParams.get('original_amount') || ''
      const discountAmount = searchParams.get('discount_amount') || ''
      const couponCode = searchParams.get('coupon_code') || ''

      const metadata: Record<string, string> = { booking_code: bookingCode }
      if (bookingId) metadata.booking_id = bookingId
      if (originalAmount) metadata.original_amount = originalAmount
      if (discountAmount) metadata.discount_amount = discountAmount
      if (couponCode) metadata.coupon_code = couponCode

      const event = {
        id: `evt_mock_${Date.now()}`,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            object: 'checkout.session',
            payment_status: 'paid',
            status: 'complete',
            payment_intent: `pi_mock_${Date.now()}`,
            metadata,
            customer_email: searchParams.get('email') || null,
            amount_total: amount * 100,
            currency: currency.toLowerCase(),
          },
        },
      }

      const res = await fetch('/api/webhook/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Mock mode skips signature verification — any string works.
          'stripe-signature': 'mock_signature',
        },
        body: JSON.stringify(event),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `Webhook failed (${res.status})`)
      }

      setStatus('done')
      setTimeout(() => {
        router.push(`/success?code=${encodeURIComponent(bookingCode)}`)
      }, 600)
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err?.message || 'Payment simulation failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {/* Mock-mode banner */}
        <div className="flex items-start gap-3 p-3 bg-amber-100 border border-amber-300 rounded-lg text-amber-900 text-sm">
          <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="block">Mock Checkout (Development)</strong>
            <span>
              Stripe is not configured. This page simulates a successful payment so the
              full booking flow can be tested end-to-end.
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Confirm Payment</h1>
          <p className="text-sm text-gray-500 mt-1">Mock Stripe Checkout Session</p>
        </div>

        {/* Order summary */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          {bookingCode && (
            <div className="flex justify-between">
              <span className="text-gray-600">Booking</span>
              <span className="font-mono font-semibold text-gray-900">{bookingCode}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Session</span>
            <span className="font-mono text-xs text-gray-700 truncate max-w-[200px]">
              {sessionId || '—'}
            </span>
          </div>
          {amount > 0 && (
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-orange-600 text-lg">
                {amount.toLocaleString()} {currency}
              </span>
            </div>
          )}
        </div>

        {/* Action area */}
        {status === 'done' ? (
          <div className="flex items-center justify-center gap-2 text-green-700 font-semibold py-3">
            <CheckCircle2 className="w-6 h-6" />
            Payment confirmed! Redirecting...
          </div>
        ) : (
          <Button
            onClick={pay}
            disabled={status === 'paying' || !sessionId}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl"
          >
            {status === 'paying' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Pay Now (Mock)'
            )}
          </Button>
        )}

        {errorMsg && (
          <div className="text-sm text-rose-600 text-center bg-rose-50 border border-rose-200 rounded-lg p-3">
            {errorMsg}
          </div>
        )}

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            Cancel and return home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function MockCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <MockCheckoutInner />
    </Suspense>
  )
}
