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
 * Goal metric: signup_clicked events from hero
 *
 * Setup in PostHog:
 *   1. Go to Feature Flags → New Feature Flag
 *   2. Key: hero_cta_variant
 *   3. Rollout: 50% → variant "challenger"
 *   4. Goal: signup_clicked where location contains "hero"
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
    goal: 'signup_clicked from hero buttons',
    start_date: '2026-03-24',
    end_date: '2026-04-07',
  },
} as const

export type ExperimentVariant = 'control' | 'challenger'

export function getHeroCTAVariant(flagValue: string | boolean | undefined): ExperimentVariant {
  if (flagValue === 'challenger') return 'challenger'
  return 'control'
}
