/**
 * lib/experiments.ts
 * A/B Experiment configuration for ZoneWise.AI
 *
 * EXPERIMENT: hero_cta_variant (P3-2)
 * PostHog feature flag: hero_cta_variant
 * Variants: control (default) | challenger
 * Split: 50/50
 * Start: 2026-03-24
 * Duration: 2 weeks
 * Goal metric: cta_clicked events from hero
 *
 * Fallback: cookie-based random split when PostHog is unavailable.
 * Cookie: hero_cta_variant (14 day expiry)
 *
 * Setup in PostHog:
 *   1. Go to Feature Flags → New Feature Flag
 *   2. Key: hero_cta_variant
 *   3. Rollout: 50% → variant "challenger"
 *   4. Goal: cta_clicked where location = "hero"
 */

export const EXPERIMENTS = {
  hero_cta_variant: {
    flag: 'hero_cta_variant',
    variants: {
      control: {
        explorer_cta: 'Explore the Map — Free',
        beta_cta: 'Join the Beta',
      },
      challenger: {
        explorer_cta: 'Analyze Any Florida Parcel — Free',
        beta_cta: 'Get Early Access',
      },
    },
    default: 'control' as const,
    description: 'Test more specific benefit-driven CTA copy vs generic "Explore" wording',
    goal: 'cta_clicked from hero buttons',
    start_date: '2026-03-24',
    end_date: '2026-04-07',
  },
} as const

export type ExperimentVariant = 'control' | 'challenger'

// ---------------------------------------------------------------------------
// Cookie helpers (no external dependency — document.cookie only)
// ---------------------------------------------------------------------------

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split('=')[1]) : undefined
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

// ---------------------------------------------------------------------------
// Variant resolution — PostHog flag → cookie → random 50/50
// ---------------------------------------------------------------------------

const COOKIE_NAME = 'hero_cta_variant'
const COOKIE_TTL_DAYS = 14

export function getHeroCTAVariant(): ExperimentVariant {
  // 1. Try PostHog feature flag (client-side)
  if (typeof window !== 'undefined' && (window as any).posthog) {
    const flag = (window as any).posthog.getFeatureFlag(EXPERIMENTS.hero_cta_variant.flag)
    if (flag === 'control' || flag === 'challenger') return flag
  }

  // 2. Check existing cookie
  const cookie = getCookie(COOKIE_NAME)
  if (cookie === 'control' || cookie === 'challenger') return cookie

  // 3. Random 50/50 split — set cookie so the user stays in the same variant
  const variant: ExperimentVariant = Math.random() < 0.5 ? 'control' : 'challenger'
  setCookie(COOKIE_NAME, variant, COOKIE_TTL_DAYS)
  return variant
}
