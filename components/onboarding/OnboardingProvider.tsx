'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

// EG14 P8 fix (Apr 8 2026): onboarding_events table not yet migrated to prod;
// Supabase JS client `.from('onboarding_events').insert(...)` causes browser to
// log 6+ HTTP_404 console errors per session BEFORE the try/catch can suppress
// them. Disabling the network call entirely until migration 20260217 is applied.
// Re-enable by uncommenting createClient + getSupabase + the insert in trackEvent.

// import { createClient } from '@supabase/supabase-js';
// const SUPABASE_URL = 'https://mocerqjnksmhcjzxrewo.supabase.co';
// function getSupabase() {
//   return createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
// }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OnboardingContext = createContext<any>(null);

const ONBOARDING_STATES = {
  WELCOME: 'welcome',
  COUNTY_SELECTED: 'county_selected',
  FIRST_QUERY: 'first_query_submitted',
  REPORT_GENERATED: 'report_generated',
  COMPLETE: 'onboarding_complete',
  SKIPPED: 'onboarding_skipped'
};

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentState, setCurrentState] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('zonewise_onboarding_complete');
    if (!hasCompletedOnboarding) {
      const newSessionId = `onb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      setCurrentState(ONBOARDING_STATES.WELCOME);
      setIsActive(true);
      trackEvent('onboarding_started', { session_id: newSessionId });
    }
  }, []);

  const trackEvent = async (_eventName: string, _data: Record<string, unknown> = {}) => {
    // EG14 P8 fix: no-op until onboarding_events table is migrated to prod.
    // Suppress unused-var lint warnings via underscore prefix.
    void _eventName; void _data; void sessionId;
    return;
  };

  const selectCounty = (county: string) => {
    setSelectedCounty(county);
    setCurrentState(ONBOARDING_STATES.COUNTY_SELECTED);
    trackEvent('onboarding_county_selected', { county });
  };

  const submitFirstQuery = (query: string) => {
    setCurrentState(ONBOARDING_STATES.FIRST_QUERY);
    trackEvent('onboarding_first_query_submitted', { query });
  };

  const showReport = (resultCount: number) => {
    setCurrentState(ONBOARDING_STATES.REPORT_GENERATED);
    trackEvent('onboarding_report_generated', { result_count: resultCount });
  };

  const completeOnboarding = () => {
    setCurrentState(ONBOARDING_STATES.COMPLETE);
    setIsActive(false);
    localStorage.setItem('zonewise_onboarding_complete', 'true');
    trackEvent('onboarding_completed');
  };

  const skipOnboarding = () => {
    setCurrentState(ONBOARDING_STATES.SKIPPED);
    setIsActive(false);
    localStorage.setItem('zonewise_onboarding_complete', 'true');
    trackEvent('onboarding_skipped');
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentState,
        isActive,
        selectedCounty,
        selectCounty,
        submitFirstQuery,
        showReport,
        completeOnboarding,
        skipOnboarding,
        ONBOARDING_STATES
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};
