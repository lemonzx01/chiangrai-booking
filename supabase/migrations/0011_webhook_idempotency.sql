-- ============================================================
-- Migration 0011: Webhook Idempotency
-- ============================================================
--
-- Stripe (and any other webhook source) may deliver the same event
-- more than once. We need to guarantee each event is processed
-- exactly once. This table acts as a deduplication log:
--
--   - INSERT before processing
--   - PRIMARY KEY on event_id raises 23505 on duplicates
--   - Webhook handler catches 23505 and returns 200 immediately
--
-- Old rows can be cleaned up via a scheduled job — Stripe retries
-- a failed delivery for at most 3 days, so 30 days is a safe buffer.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.processed_webhooks (
  event_id      TEXT PRIMARY KEY,
  event_type    TEXT NOT NULL,
  source        TEXT NOT NULL DEFAULT 'stripe',
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload_hash  TEXT
);

CREATE INDEX IF NOT EXISTS idx_processed_webhooks_processed_at
  ON public.processed_webhooks(processed_at DESC);

CREATE INDEX IF NOT EXISTS idx_processed_webhooks_event_type
  ON public.processed_webhooks(event_type);

-- RLS: writes only via service role (no anon access).
ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;
-- No policies = no anon access.

COMMENT ON TABLE public.processed_webhooks IS
  'Idempotency ledger for webhook events. Writes only via service role.';
