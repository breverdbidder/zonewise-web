# PostHog Dashboard Spec — ZoneWise.AI

## Project
- PostHog Project: US Cloud 35462x
- Environment: Production (zonewise.ai)
- API Host: https://us.i.posthog.com

## Core Metrics Dashboard

### 1. Daily Active Users (DAU)
- PostHog Insight: Trends → Unique users per day
- Event: `$pageview`
- Filter: last 30 days
- Target: 100 DAU by end of April 2026

### 2. Explorer Opens
- PostHog Insight: Trends → event count per day
- Event: `explorer_opened`
- Properties tracked: `county` (default: "brevard")
- Breakdown: by referrer
- Target: 60% of DAU open explorer

### 3. Chat Queries Sent
- PostHog Insight: Trends → event count per day
- Event: `chat_query_sent`
- Properties tracked: `query` (string), `county` (optional string)
- Breakdown: by county
- Target: 3 queries per explorer session average

### 4. Pricing Page Views
- PostHog Insight: Funnel → DAU → pricing_viewed → signup_clicked
- Events: `pricing_viewed`, `signup_clicked`
- Properties: `pricing_viewed.source` (string), `signup_clicked.location` (string)
- Target: 5% conversion rate

### 5. Signups
- PostHog Insight: Trends → unique users who triggered signup
- Event: `signup_clicked`
- Properties tracked: `location` (e.g. "hero_primary", "hero_secondary", "unknown"), `plan` (optional)
- Goal: 10 signups/day by May 2026

## Event Taxonomy (Full List)

All events are fired via `posthog.capture(event.name, event.properties)` through the typed
`track()` helper in `lib/posthog.ts`, or directly via `posthog.capture()` for system events.

### Auto-captured (PostHog built-ins)
| Event | Trigger | Properties |
|---|---|---|
| `$pageview` | Every route change | `$current_url` |
| `$pageleave` | Page exit | (standard PostHog) |
| `$experiment_started` | HeroCTA mount — A/B exposure | `experiment: "hero_cta_variant"`, `variant: "control" \| "challenger"` |

### Custom events (typed via `lib/posthog.ts` AnalyticsEvent union)
| Event | Trigger | Properties |
|---|---|---|
| `page_viewed` | Manual page view (typed, not currently wired to autocapture) | `path`, `title` |
| `explorer_opened` | ExplorerV2 mount; also fires on map style change | `county` (default: "brevard") |
| `parcel_clicked` | User clicks a parcel on the map | `parcel_id`, `county`, `zoning` |
| `chat_query_sent` | User submits a chat message in ExplorerChat | `query`, `county` (optional) |
| `chat_response_received` | (typed, available for wiring) | `duration_ms`, `has_map_action` |
| `pricing_viewed` | PricingTracker component renders | `source` (default: "direct") |
| `plan_selected` | (typed, available for wiring) | `plan: "free" \| "pro" \| "enterprise"`, `price` |
| `signup_clicked` | GlowButton CTA click; also fires via cta_clicked funnel event | `location`, `plan` (optional) |
| `upgrade_modal_shown` | Parcel click when user is over limit | `trigger` (default: "conversion_gate") |
| `upgrade_modal_cta_clicked` | (typed, available for wiring) | `plan` |
| `help_page_viewed` | (typed, available for wiring) | `section` (optional) |
| `onboarding_step_completed` | (typed, available for wiring) | `step`, `step_name` |
| `onboarding_skipped` | User skips onboarding in typed flow | `at_step` |

### Onboarding events (Supabase-only via OnboardingProvider — NOT in PostHog)
These fire to `onboarding_events` Supabase table only, not to PostHog:

| Event | Trigger |
|---|---|
| `onboarding_started` | Onboarding flow initializes |
| `onboarding_county_selected` | User picks a county |
| `onboarding_first_query_submitted` | User submits first query |
| `onboarding_report_generated` | Report renders |
| `onboarding_completed` | User completes flow |
| `onboarding_skipped` | User skips flow |

### Funnel events (Supabase `conversion_funnel` table + PostHog dual-fire)
These internal `FunnelEvent` strings map to PostHog events via `lib/explorer/tracking.ts`:

| Internal FunnelEvent | PostHog event fired |
|---|---|
| `parcel_click` | `parcel_clicked` |
| `chat_message` | `chat_query_sent` |
| `upgrade_modal_shown` | `upgrade_modal_shown` |
| `cta_clicked` | `signup_clicked` |

## Setup Instructions
1. Log into PostHog US Cloud → Project 35462x
2. Create new Dashboard: "ZoneWise Core Metrics"
3. Add 5 insights above in order
4. Set date range: Last 30 days (rolling)
5. Pin to homepage

## A/B Test Tracking
- Feature Flag: `hero_cta_variant` (50/50 split)
- Variants: `control` ("Explore the Map — Free" / "Join the Beta") vs `challenger` ("Analyze Any Florida Parcel — Free" / "Get Early Access")
- Exposure event: `$experiment_started` with properties `experiment: "hero_cta_variant"`, `variant`
- Goal metric: `signup_clicked` where `location` contains "hero"
- Duration: 2026-03-24 → 2026-04-07
- Tracking: CTA clicks broken down by variant using PostHog Funnel → `$experiment_started` → `signup_clicked`
- See: `lib/experiments.ts`

## Notes
- `autocapture: true` is enabled — PostHog will auto-capture clicks, form submits, and inputs. Tag key elements with `data-ph-capture-attribute-*` if you need custom properties on autocaptured events.
- `person_profiles: 'identified_only'` — anonymous users are tracked but not profiled until `identifyUser()` is called (fires on Clerk sign-in).
- Session recording is active with password inputs masked.
