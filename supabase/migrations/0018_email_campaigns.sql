-- ===========================================
-- MIGRATION 0018: Email campaigns
-- ===========================================
--
-- Stores the metadata of bulk emails admins send to filtered
-- customer cohorts (the email body itself is regenerated per-
-- recipient and not stored — saves space and avoids leaking
-- customer names if the table is exfiltrated).
--
-- Design choices:
--   - One row per campaign run, not per recipient. Per-recipient
--     tracking would add 10k+ rows per send; if that detail is
--     ever needed, we re-derive from email provider webhooks.
--   - status values are limited and explicit ('draft' isn't
--     allowed because we don't have a "save and send later" UI;
--     campaigns are sent at creation time).
--   - cohort + filters are stored as JSONB so the schema
--     doesn't have to change every time we add a new audience
--     option.
-- ===========================================

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  created_by_email TEXT,                     -- denormalized for forensics

  -- Content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,                   -- raw HTML (already brand-wrapped at render)
  preheader TEXT,                            -- inbox preview line

  -- Audience
  cohort TEXT NOT NULL,                      -- 'all_customers' | 'past_bookers' | 'recent_bookers' | 'cancelled' | 'custom_emails'
  cohort_filters JSONB DEFAULT '{}'::jsonb,  -- {days?: int, statuses?: text[], custom_emails?: text[], ...}

  -- Outcome
  status TEXT NOT NULL DEFAULT 'sending',    -- 'sending' | 'sent' | 'failed' | 'partial'
  recipient_count INTEGER DEFAULT 0,
  succeeded_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  error_summary TEXT,                        -- non-null only on 'failed' / 'partial'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Soft constraints — Postgres can't enforce JSON shape but
  -- we can at least keep the status field tidy.
  CONSTRAINT email_campaigns_status_chk CHECK (status IN ('sending', 'sent', 'failed', 'partial')),
  CONSTRAINT email_campaigns_cohort_chk CHECK (
    cohort IN ('all_customers', 'past_bookers', 'recent_bookers', 'cancelled', 'custom_emails')
  )
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at
  ON public.email_campaigns (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_actor
  ON public.email_campaigns (created_by, created_at DESC);

-- Defense-in-depth: forbid anon access. The backend uses
-- service-role and bypasses RLS, but if the anon key is ever
-- leaked the campaign history shouldn't be browseable.
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no anon read"
  ON public.email_campaigns
  FOR SELECT
  USING (false);

CREATE POLICY "no anon write"
  ON public.email_campaigns
  FOR ALL
  USING (false)
  WITH CHECK (false);
