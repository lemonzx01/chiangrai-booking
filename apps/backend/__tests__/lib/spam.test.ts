/**
 * ============================================================
 * Tests for lib/spam.ts (review spam-score heuristics)
 * ============================================================
 *
 * Heuristics need to be deterministic, conservative (don't
 * flag genuine reviews), and aggressive on obvious junk.
 * Pin both ends of that contract here.
 * ============================================================
 */

import { describe, it, expect } from 'vitest'
import { scoreReview } from '@/lib/spam'

describe('scoreReview — clean reviews stay near zero', () => {
  it('rates an empty string as 0', () => {
    const r = scoreReview('')
    expect(r.score).toBe(0)
    expect(r.reasons).toEqual([])
  })

  it('rates a normal Thai review under 30', () => {
    const r = scoreReview(
      'ที่พักดีมาก พนักงานน่ารัก อาหารอร่อย วิวดี อยากกลับมาอีก'
    )
    expect(r.score).toBeLessThan(30)
  })

  it('rates a normal English review under 30', () => {
    const r = scoreReview(
      "Great place, very clean rooms and the staff was really friendly. We'll come back next year."
    )
    expect(r.score).toBeLessThan(30)
  })

  it('a single legit URL in a long, descriptive review is fine', () => {
    const r = scoreReview(
      'We had a wonderful stay. The pool view was amazing, and the breakfast was top-tier. ' +
        'Their website https://example.com had all the info we needed in advance.'
    )
    expect(r.score).toBeLessThan(30)
  })
})

describe('scoreReview — obvious spam scores high', () => {
  it('flags many links (≥3 URLs)', () => {
    const r = scoreReview(
      'Check this https://a.com https://b.com https://c.com'
    )
    expect(r.score).toBeGreaterThanOrEqual(60)
    expect(r.reasons).toContain('many_links')
  })

  it('flags two links (medium signal)', () => {
    const r = scoreReview('Visit https://a.com or https://b.com')
    expect(r.score).toBeGreaterThanOrEqual(30)
    expect(r.reasons).toContain('multiple_links')
  })

  it('flags a single link in a tiny review (link-only spam)', () => {
    const r = scoreReview('https://buy-now.example')
    expect(r.score).toBeGreaterThanOrEqual(25)
    expect(r.reasons).toContain('link_only')
  })

  it('flags all-caps Latin text', () => {
    const r = scoreReview('AMAZING DEAL CLICK THE LINK BELOW NOW NOW NOW NOW')
    expect(r.reasons).toContain('all_caps')
  })

  it('does NOT flag all-caps when the message has fewer than 20 Latin chars', () => {
    // "WOW!" is too short to fairly call all-caps spam
    const r = scoreReview('WOW! ดีมาก')
    expect(r.reasons).not.toContain('all_caps')
  })

  it('flags repeated character runs', () => {
    const r = scoreReview('Wowwwwwwww!!!!!! Amazinggggg')
    expect(r.reasons).toContain('character_runs')
  })

  it('flags too-short reviews', () => {
    const r = scoreReview('ok')
    expect(r.reasons).toContain('too_short')
  })

  it('flags emoji-heavy reviews', () => {
    const r = scoreReview('🔥🔥🔥💯💯💯🎉🎉🎉')
    expect(r.reasons).toContain('emoji_heavy')
  })

  it('flags profanity (English)', () => {
    const r = scoreReview('what a fucking joke this hotel is')
    expect(r.reasons).toContain('profanity')
  })

  it('flags profanity (Thai)', () => {
    const r = scoreReview('โรงแรมเหี้ยมาก อย่ามาเลย')
    expect(r.reasons).toContain('profanity')
  })

  it('flags known spam phrases (English)', () => {
    const r = scoreReview('Great hotel! Click here for limited time offer.')
    expect(r.reasons).toContain('spam_phrase')
  })

  it('flags known spam phrases (Thai gambling pitches)', () => {
    const r = scoreReview('แทงบอล สล็อต หวย รวยเร็ว')
    expect(r.reasons).toContain('spam_phrase')
  })
})

describe('scoreReview — score clamping + dedup', () => {
  it('clamps the score to 100 even when many heuristics fire', () => {
    const r = scoreReview(
      'BUY NOW CLICK HERE LIMITED TIME OFFER ' +
        'wowwwwwwwwwww!!!!!! ' +
        'https://a.com https://b.com https://c.com https://d.com ' +
        'CASINO SLOTS HUGE REWARDS NOWWWWW'
    )
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.score).toBeGreaterThanOrEqual(80)
  })

  it('deduplicates reason codes', () => {
    // Same trigger fired multiple times shouldn't appear twice in
    // the list — admin UI relies on a clean reasons array.
    const r = scoreReview('FUCK FUCK FUCK FUCK FUCK FUCK')
    const profanityCount = r.reasons.filter((c) => c === 'profanity').length
    expect(profanityCount).toBe(1)
  })

  it('returns sensible shape for malformed input', () => {
    expect(scoreReview(null as unknown as string)).toEqual({
      score: 0,
      reasons: [],
    })
    expect(scoreReview(undefined as unknown as string)).toEqual({
      score: 0,
      reasons: [],
    })
  })
})
