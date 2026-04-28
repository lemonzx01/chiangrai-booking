-- ===========================================
-- MIGRATION 0020: Review spam score
-- ===========================================
--
-- All reviews already require admin approval (0014), but
-- volume can grow fast — admins waste time on obvious junk
-- ("Buy followers cheap! click here") that any heuristic
-- could have spotted.
--
-- This migration adds two columns:
--   - spam_score: 0..100 integer. 0 = clean, 100 = certain spam.
--   - spam_reasons: TEXT[] — short codes ('many_links',
--     'all_caps', 'too_short', etc.) so admin sees AT A GLANCE
--     why the heuristic flagged it without re-reading the
--     review.
--
-- The actual scoring runs in lib/spam.ts at submission time;
-- the DB just stores what was computed. No CHECK constraints
-- on the score so we can tune the algorithm later without a
-- migration.
-- ===========================================

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS spam_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spam_reasons TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Admin moderation queue sorts by score desc — show the
-- worst offenders first so admin doesn't stare at clean
-- reviews while spam piles up.
CREATE INDEX IF NOT EXISTS idx_reviews_spam_score
  ON public.reviews (spam_score DESC, created_at DESC)
  WHERE is_approved = false;
