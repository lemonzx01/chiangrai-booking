-- ============================================================
-- Migration 0014: Review Moderation
-- ============================================================
--
-- New reviews should start as PENDING (is_approved = false) and
-- require an admin to approve them before showing on detail pages.
--
-- We also add a moderation audit column so admins can see who
-- approved/rejected and when.
-- ============================================================

-- Flip default so new inserts start un-approved.
ALTER TABLE public.reviews
  ALTER COLUMN is_approved SET DEFAULT false;

-- Audit columns
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS moderated_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by  TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Speed up admin "pending reviews" queries.
CREATE INDEX IF NOT EXISTS idx_reviews_approval_pending
  ON public.reviews(is_approved, created_at DESC);
