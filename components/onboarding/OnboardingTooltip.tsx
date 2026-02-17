'use client'

import React, { useEffect, useState } from 'react';
import { useOnboarding } from './OnboardingProvider';

export const OnboardingTooltip = () => {
  const { currentState, completeOnboarding, ONBOARDING_STATES } = useOnboarding();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentState === ONBOARDING_STATES.REPORT_GENERATED) {
      setIsVisible(true);
      
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        completeOnboarding();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [currentState, completeOnboarding, ONBOARDING_STATES.REPORT_GENERATED]);

  if (!isVisible || currentState !== ONBOARDING_STATES.REPORT_GENERATED) {
    return null;
  }

  return (
    <div className="fixed top-20 right-6 z-50 max-w-sm">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg shadow-2xl border border-blue-500">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-bold mb-1">✅ Your Foreclosure Report</h3>
            <p className="text-sm mb-3">
              Your report appears here →
            </p>
            <p className="text-xs opacity-90 mb-3">
              You can now:
              <br />• Click any property for details
              <br />• Ask follow-up questions
              <br />• Search another county
            </p>
            <button
              onClick={() => {
                setIsVisible(false);
                completeOnboarding();
              }}
              className="px-3 py-1 bg-white text-blue-700 rounded text-xs font-medium hover:bg-blue-50 transition-colors"
            >
              Got it!
            </button>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              completeOnboarding();
            }}
            className="flex-shrink-0 ml-2 text-white hover:text-blue-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Arrow pointing right */}
        <div className="absolute top-1/2 -right-2 transform -translate-y-1/2">
          <div className="w-4 h-4 bg-blue-600 transform rotate-45"></div>
        </div>
      </div>
    </div>
  );
};
