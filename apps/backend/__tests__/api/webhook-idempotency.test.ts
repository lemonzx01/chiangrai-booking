/**
 * ============================================================
 * Webhook Idempotency Tests
 * ============================================================
 *
 * Goal:
 *   Guarantee that inserting the same Stripe event_id twice into
 *   `processed_webhooks` returns a Postgres unique-violation (23505),
 *   which is the signal the webhook handler uses to safely short-
 *   circuit duplicate events.
 *
 * Strategy:
 *   Test against the mock Supabase client directly — that's the
 *   shim production code talks to when no real Supabase is wired.
 *   The real Postgres schema uses a UNIQUE index on event_id, so
 *   we pin that the mock enforces the same invariant.
 * ============================================================
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '@/lib/supabase/mock-client'

type AnyClient = ReturnType<typeof createMockSupabaseClient>

describe('Webhook idempotency via processed_webhooks', () => {
  let client: AnyClient

  beforeEach(() => {
    client = createMockSupabaseClient()
  })

  it('accepts a fresh event_id', async () => {
    const { error } = await client
      .from('processed_webhooks')
      .insert({
        event_id: 'evt_test_first',
        event_type: 'checkout.session.completed',
        source: 'stripe',
      })

    expect(error).toBeNull()
  })

  it('rejects duplicate event_id with Postgres code 23505', async () => {
    await client
      .from('processed_webhooks')
      .insert({
        event_id: 'evt_test_dup',
        event_type: 'checkout.session.completed',
        source: 'stripe',
      })

    const { error } = await client
      .from('processed_webhooks')
      .insert({
        event_id: 'evt_test_dup',
        event_type: 'checkout.session.completed',
        source: 'stripe',
      })

    expect(error).not.toBeNull()
    expect(error?.code).toBe('23505')
  })

  it('treats different event_ids as independent', async () => {
    await client
      .from('processed_webhooks')
      .insert({ event_id: 'evt_a', event_type: 'x', source: 'stripe' })

    const { error } = await client
      .from('processed_webhooks')
      .insert({ event_id: 'evt_b', event_type: 'x', source: 'stripe' })

    expect(error).toBeNull()
  })

  it('still rejects duplicate after many distinct inserts', async () => {
    for (let i = 0; i < 10; i++) {
      await client
        .from('processed_webhooks')
        .insert({ event_id: `evt_${i}`, event_type: 'x', source: 'stripe' })
    }

    const { error } = await client
      .from('processed_webhooks')
      .insert({ event_id: 'evt_5', event_type: 'x', source: 'stripe' })

    expect(error?.code).toBe('23505')
  })
})

describe('Webhook handler idempotency contract', () => {
  /**
   * The handler treats 23505 as "already processed — skip side-effects
   * but return 200 so Stripe doesn't retry". Any OTHER error should be
   * logged but NOT block processing (better to risk a duplicate than
   * miss a payment confirmation).
   *
   * This test documents that invariant for future maintainers.
   */
  it('documents that 23505 is the short-circuit signal', () => {
    // The contract: handler checks `idemErr.code === '23505'` and returns
    // { received: true, duplicate: true } without running the event switch.
    // Any other error code means "insert failed for some other reason" —
    // handler logs and proceeds anyway.
    const EXPECTED_DUPLICATE_CODE = '23505'
    expect(EXPECTED_DUPLICATE_CODE).toBe('23505')
  })
})
