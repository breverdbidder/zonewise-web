# A/B Experiments — ZoneWise.AI

## Active Experiments

### hero_cta_variant
- **Hypothesis:** A more direct CTA ("Start Exploring Free") will outperform the generic CTA ("Get Started") by 20%+
- **Control:** "Get Started" — standard CTA
- **Challenger:** "Start Exploring Free" — action-oriented with benefit
- **Primary Metric:** `cta_clicked` event on hero section
- **Secondary Metric:** `signup_clicked` within 5 minutes of CTA click
- **Split:** 50/50 random (PostHog feature flag with cookie fallback)
- **Duration:** 2 weeks minimum (started ~March 24, 2026)
- **Sample Size:** Need 1,000+ visitors per variant for significance
- **PostHog Flag:** `hero_cta_variant` (US Cloud project 35462x)

## Tracking
- Conversion event: `cta_clicked` with `{ variant, location, button_text }`
- Funnel: `cta_clicked` → `signup_clicked`
- Dashboard: PostHog → Experiments → hero_cta_variant

## Fallback
If PostHog is unavailable, random 50/50 cookie split ensures experiment continues.
Cookie: `hero_cta_variant` (14 day expiry)

## Results Tracking
Update this section when experiment concludes.
| Variant | Visitors | CTA Clicks | CTR | Signups | Conv Rate |
|---------|----------|------------|-----|---------|-----------|
| Control | - | - | - | - | - |
| Challenger | - | - | - | - | - |
