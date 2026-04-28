/**
 * ============================================================
 * Review spam-score heuristics
 * ============================================================
 *
 * Cheap, deterministic scoring designed to help admins
 * triage the moderation queue. Doesn't auto-reject — every
 * review still requires admin approval. The score just
 * sorts the worst offenders to the top.
 *
 * Heuristics (each contributes a partial score):
 *   - Many URLs (≥ 2 links in a short review)
 *   - All caps over a threshold of the message
 *   - Repeated character runs (e.g. "wowwwwwwww")
 *   - Too short (< 5 words AND no sentiment)
 *   - Too many emojis (≥ 30% of characters)
 *   - Profanity / common spam phrases (Thai + English)
 *   - Off-topic phrases ("buy followers", "sex chat", etc.)
 *
 * Each heuristic returns a `code` + `weight`. We sum weights
 * and clamp to [0, 100]. `reasons` is the list of triggered
 * codes for admin visibility.
 *
 * Why not ML:
 *   ML demands training data, infrastructure, and constant
 *   retuning. Heuristics catch ~80% of obvious spam at zero
 *   cost. When volume justifies a real classifier, we can
 *   point this function at a model API behind the same
 *   interface.
 * ============================================================
 */

export interface SpamScore {
  score: number       // 0..100
  reasons: string[]   // short codes
}

const URL_REGEX = /https?:\/\/[^\s]+/gi
const REPEATED_CHAR_REGEX = /(.)\1{4,}/g  // 5+ repeats of any char
const EMOJI_REGEX = /\p{Extended_Pictographic}/gu

const PROFANITY_TH_EN = [
  // English
  'fuck',
  'shit',
  'asshole',
  'bitch',
  // Thai (common written variants)
  'เหี้ย',
  'สัส',
  'แม่ง',
  'ไอ้สัตว์',
]

const SPAM_PHRASES = [
  // Common SEO / link-bait
  'buy now',
  'click here',
  'limited time offer',
  'cheap viagra',
  'casino',
  'sex chat',
  'free money',
  'work from home',
  'crypto pump',
  // Thai
  'รับซื้อ',
  'รับฝาก',
  'แทงบอล',
  'สล็อต',
  'หวย',
  'เงินกู้',
  'พนัน',
]

/**
 * Score a review's text. Returns 0..100 and the list of
 * triggered reason codes.
 *
 * @param text the raw review comment (Thai or English)
 */
export function scoreReview(text: string): SpamScore {
  if (!text || typeof text !== 'string') {
    return { score: 0, reasons: [] }
  }
  const reasons: string[] = []
  let score = 0

  const trimmed = text.trim()
  const words = trimmed.split(/\s+/).filter(Boolean)
  const length = trimmed.length

  // ---- 1. Link spam ------------------------------------------
  const urlMatches = trimmed.match(URL_REGEX) || []
  if (urlMatches.length >= 3) {
    score += 60
    reasons.push('many_links')
  } else if (urlMatches.length === 2) {
    score += 30
    reasons.push('multiple_links')
  } else if (urlMatches.length === 1 && length < 80) {
    // A single link in a near-empty review is almost always spam.
    score += 25
    reasons.push('link_only')
  }

  // ---- 2. All caps (English only — Thai has no case) ---------
  // Count Latin letters and the proportion that are uppercase.
  const latinChars = trimmed.match(/[A-Za-z]/g) || []
  if (latinChars.length >= 20) {
    const upper = latinChars.filter((c) => c >= 'A' && c <= 'Z').length
    const ratio = upper / latinChars.length
    if (ratio > 0.7) {
      score += 25
      reasons.push('all_caps')
    } else if (ratio > 0.5) {
      score += 10
      reasons.push('mostly_caps')
    }
  }

  // ---- 3. Repeated chars: "wowwwwwwww", "!!!!!!!" -----------
  const longRuns = trimmed.match(REPEATED_CHAR_REGEX) || []
  if (longRuns.length >= 2) {
    score += 15
    reasons.push('character_runs')
  } else if (longRuns.length === 1 && longRuns[0].length > 8) {
    score += 10
    reasons.push('long_run')
  }

  // ---- 4. Too short ------------------------------------------
  // < 5 words OR < 15 chars is basically noise. Bump less if
  // it's a star-rating-only review (no comment is fine).
  if (length > 0 && length < 15) {
    score += 15
    reasons.push('too_short')
  } else if (words.length < 5 && length < 30) {
    score += 8
    reasons.push('low_content')
  }

  // ---- 5. Emoji-heavy ----------------------------------------
  const emojiCount = (trimmed.match(EMOJI_REGEX) || []).length
  if (length > 0 && emojiCount / length > 0.3 && emojiCount >= 5) {
    score += 15
    reasons.push('emoji_heavy')
  }

  // ---- 6. Profanity ------------------------------------------
  const lower = trimmed.toLowerCase()
  for (const word of PROFANITY_TH_EN) {
    if (lower.includes(word)) {
      score += 25
      reasons.push('profanity')
      break // only count once
    }
  }

  // ---- 7. Spam phrases ---------------------------------------
  for (const phrase of SPAM_PHRASES) {
    if (lower.includes(phrase)) {
      score += 35
      reasons.push('spam_phrase')
      break
    }
  }

  // Clamp to [0, 100]
  if (score < 0) score = 0
  if (score > 100) score = 100

  return { score, reasons: Array.from(new Set(reasons)) }
}
