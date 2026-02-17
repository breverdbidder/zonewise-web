'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mocerqjnksmhcjzxrewo.supabase.co';

function getSupabase() {
  return createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

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
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('zonewise_onboarding_complete');
    
    if (!hasCompletedOnboarding) {
      // Initialize onboarding
      const newSessionId = `onb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      setCurrentState(ONBOARDING_STATES.WELCOME);
      setIsActive(true);
      
      trackEvent('onboarding_started', { session_id: newSessionId });
    }
  }, []);

  const trackEvent = async (eventName: string, data: Record<string, unknown> = {}) => {
    try {
      await getSupabase().from('onboarding_events').insert({
        session_id: sessionId,
        event_name: eventName,
        event_data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track onboarding event:', error);
    }
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
