/**
 * ============================================================
 * PDF Font Loader — Thai Support for jsPDF
 * ============================================================
 *
 * Problem:
 *   jsPDF ships with Helvetica only, which has no Thai glyphs.
 *   Rendering "ห้องพัก" with it produces empty boxes.
 *
 * Solution:
 *   - Operator drops `NotoSansThai-Regular.ttf` (and optionally
 *     `NotoSansThai-Bold.ttf`) into apps/backend/public/fonts/
 *   - At request time we read those files, base64-encode them,
 *     register with jsPDF's VFS, and switch the PDF to use them
 *   - If no font is present we fall back to Helvetica and log
 *     once so Thai strings quietly degrade to English equivalents
 *
 * Why not bundle the font?
 *   - Noto Sans Thai Regular is ~250KB each → would bloat repo
 *   - License (OFL) requires attribution; easier if it's a deploy
 *     step than a commit
 *   - Let ops pick their preferred Thai font
 *
 * Install instructions are in apps/backend/public/fonts/README.md
 * ============================================================
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { jsPDF } from 'jspdf'
import { logger } from './logger'

// ============================================================
// Module-level cache (one-shot read per process)
// ============================================================

type FontCache = {
  regular: string | null
  bold: string | null
  warned: boolean
  loaded: boolean
}

const cache: FontCache = {
  regular: null,
  bold: null,
  warned: false,
  loaded: false,
}

const FONT_DIR = path.join(process.cwd(), 'public', 'fonts')
const REGULAR_FILE = 'NotoSansThai-Regular.ttf'
const BOLD_FILE = 'NotoSansThai-Bold.ttf'

/**
 * Read a TTF file and return its base64 representation, or null if the
 * file does not exist / cannot be read.
 */
async function readTtfAsBase64(filename: string): Promise<string | null> {
  try {
    const buf = await readFile(path.join(FONT_DIR, filename))
    return buf.toString('base64')
  } catch {
    return null
  }
}

/**
 * Populate the cache once per process.
 */
async function ensureLoaded(): Promise<void> {
  if (cache.loaded) return
  cache.loaded = true
  cache.regular = await readTtfAsBase64(REGULAR_FILE)
  cache.bold = await readTtfAsBase64(BOLD_FILE)
  if (!cache.regular && !cache.warned) {
    cache.warned = true
    logger.warn('PDF Thai font not found — invoice will render Latin only', {
      expected: path.join(FONT_DIR, REGULAR_FILE),
    })
  }
}

// ============================================================
// Public API
// ============================================================

export interface ThaiFontRegistration {
  /** true if at least the regular font is registered and usable */
  enabled: boolean
  /** font family name jsPDF should be told to use */
  family: string
  /** true if a bold variant is also registered */
  hasBold: boolean
}

/**
 * Attempt to register the Thai font on a jsPDF instance.
 *
 * Usage:
 *   const thai = await registerThaiFont(pdf)
 *   if (thai.enabled) {
 *     pdf.setFont(thai.family, 'normal')
 *     pdf.text('โรงแรมเชียงราย', 10, 10)
 *   }
 */
export async function registerThaiFont(
  pdf: jsPDF
): Promise<ThaiFontRegistration> {
  await ensureLoaded()

  const family = 'NotoSansThai'

  if (!cache.regular) {
    return { enabled: false, family: 'helvetica', hasBold: false }
  }

  // jsPDF types expose addFileToVFS/addFont on the instance — they existed at
  // runtime before the types caught up. Types are fine now, so no directive needed.
  pdf.addFileToVFS(`${family}-Regular.ttf`, cache.regular)
  pdf.addFont(`${family}-Regular.ttf`, family, 'normal')

  if (cache.bold) {
    pdf.addFileToVFS(`${family}-Bold.ttf`, cache.bold)
    pdf.addFont(`${family}-Bold.ttf`, family, 'bold')
  }

  return {
    enabled: true,
    family,
    hasBold: !!cache.bold,
  }
}

/**
 * Small helper: given a ThaiFontRegistration and a weight,
 * return the best (family, style) jsPDF.setFont() args.
 * Falls back to helvetica if Thai is not registered, and to
 * 'normal' if bold isn't available.
 */
export function fontForWeight(
  reg: ThaiFontRegistration,
  weight: 'normal' | 'bold'
): [string, 'normal' | 'bold'] {
  if (!reg.enabled) return ['helvetica', weight]
  if (weight === 'bold' && !reg.hasBold) return [reg.family, 'normal']
  return [reg.family, weight]
}
