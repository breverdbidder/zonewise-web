// src/lib/posthog.ts
// P1-1: AnalyticsWise — PostHog initialization
// Install: npm install posthog-js

import posthog from 'posthog-js';

// Initialize only on client side
export function initPostHog(apiKey: string) {
  if (typeof window === 'undefined') return;

  posthog.init(apiKey, {
    api_host: 'https://us.i.posthog.com', // US cloud
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true, // auto-capture clicks, inputs, form submits
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: {
        password: true,
      },
    },
  });
}

// Typed event tracking — replaces dead trackEvent calls
export type AnalyticsEvent =
  | { name: 'page_viewed'; properties: { path: string; title: string } }
  | { name: 'explorer_opened'; properties: { county?: string } }
  | { name: 'parcel_clicked'; properties: { parcel_id: string; county: string; zoning: string } }
  | { name: 'chat_query_sent'; properties: { query: string; county?: string } }
  | { name: 'chat_response_received'; properties: { duration_ms: number; has_map_action: boolean } }
  | { name: 'pricing_viewed'; properties: { source: string } }
  | { name: 'plan_selected'; properties: { plan: 'free' | 'pro' | 'enterprise'; price: number } }
  | { name: 'signup_clicked'; properties: { location: string; plan?: string } }
  | { name: 'upgrade_modal_shown'; properties: { trigger: string } }
  | { name: 'upgrade_modal_cta_clicked'; properties: { plan: string } }
  | { name: 'help_page_viewed'; properties: { section?: string } }
  | { name: 'onboarding_step_completed'; properties: { step: number; step_name: string } }
  | { name: 'onboarding_skipped'; properties: { at_step: number } };

export function track(event: AnalyticsEvent) {
  if (typeof window === 'undefined') return;
  posthog.capture(event.name, event.properties);
}

// Identify user from Clerk auth
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.identify(userId, traits);
}

// Reset on logout
export function resetUser() {
  if (typeof window === 'undefined') return;
  posthog.reset();
}

export { posthog };
