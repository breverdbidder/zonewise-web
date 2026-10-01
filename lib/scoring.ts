/**
 * Display helpers for auction money values.
 *
 * The old fixed max-bid formula and its BID / REVIEW / SKIP ratio badges
 * lived here. They are retired (Ariel, 29 Sep / 1 Oct 2026): the max bid is
 * the SIGNAL$ Max Bid (assessed value x a county bid share learned from real
 * auction sales x the plaintiff factor, less recorded liens that can survive
 * the sale, alongside the ML third-party-purchase and clearing-price
 * predictions), withheld under report policy v1 until it passes validation.
 * Do not add a rule-of-thumb max bid or verdict back here.
 */

export function formatCurrency(val: number | null | undefined): string {
  if (val == null) return '--'
  return '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 })
}
