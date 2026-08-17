// Display formatting for Florida county values.
//
// multi_county_auctions.county stores lowercase, underscore-separated slugs
// ("brevard", "st_johns", "miami_dade"). Those were rendering RAW in the
// auctions table and in the county filter dropdown on every viewport - found
// during the Aug 17 2026 mobile audit, but it was never a mobile-only defect.
//
// This formats for DISPLAY ONLY. The slug stays the value submitted to the
// API, so filtering is unaffected. Do not "clean up" by renaming the stored
// values - the scraper, the RPCs and fl_county_codes all key off the slug.

const SPECIAL_CASE: Record<string, string> = {
  st_johns: 'St. Johns',
  st_lucie: 'St. Lucie',
  miami_dade: 'Miami-Dade',
  palm_beach: 'Palm Beach',
  santa_rosa: 'Santa Rosa',
  indian_river: 'Indian River',
  desoto: 'DeSoto',
}

export function formatCountyLabel(raw: string | null | undefined): string {
  if (!raw) return ''
  const key = raw.trim().toLowerCase()
  if (SPECIAL_CASE[key]) return SPECIAL_CASE[key]
  return key
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
