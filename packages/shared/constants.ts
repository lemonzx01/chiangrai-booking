export const STAR_RATINGS = [
  { value: 5, label: '5 ดาว' },
  { value: 4, label: '4 ดาว' },
  { value: 3, label: '3 ดาว' },
  { value: 2, label: '2 ดาว' },
  { value: 1, label: '1 ดาว' },
] as const;

export const CONTACT_INFO = {
  address: 'Chiang Rai, Thailand',
  phone: '+66 81 234 5678',
  email: 'admin@gotjourneythailand.com',
  workingHours: '09:00 - 18:00',
}

export const APP_NAME = 'Got Journey Thailand'

// ===========================================
// Loyalty program — phase 1
// ===========================================
//
// Default earning rate: 1 point per ฿100 spent on a paid
// booking. Backend reads LOYALTY_RATE_THB_PER_POINT env to
// override at runtime; frontend uses this constant directly
// for "+X pts you'll earn" previews on detail pages. If we
// ever want server-side and previews to diverge we'll wire
// a config endpoint, but they don't yet.
export const LOYALTY_DEFAULT_RATE_THB_PER_POINT = 100

/**
 * Compute the points a paid booking of `amountThb` would earn
 * at the default rate. Used by the frontend on detail pages
 * (preview) and by the backend lib/loyalty (actual award).
 *
 * Floors fractional points — you don't half-earn.
 */
export function pointsForAmountAtDefaultRate(amountThb: number): number {
  if (!Number.isFinite(amountThb) || amountThb <= 0) return 0
  return Math.floor(amountThb / LOYALTY_DEFAULT_RATE_THB_PER_POINT)
}
