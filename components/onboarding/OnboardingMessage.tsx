import React from 'react';
import { useOnboarding } from './OnboardingProvider';

const POPULAR_COUNTIES = [
  'Miami-Dade',
  'Broward',
  'Palm Beach',
  'Hillsborough',
  'Orange'
];

const EXAMPLE_QUERIES = [
  'Show me foreclosures under $200K',
  'Find properties with high equity',
  "What's the auction schedule this week?"
];

export const OnboardingMessage = () => {
  const { currentState, selectedCounty, selectCounty, ONBOARDING_STATES } = useOnboarding();

  if (!currentState || currentState === ONBOARDING_STATES.COMPLETE || currentState === ONBOARDING_STATES.SKIPPED) {
    return null;
  }

  const renderWelcome = () => (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-blue-800 font-medium mb-3">
            Welcome to ZoneWise.AI! I can search foreclosure auctions across 67 Florida counties in real-time.
          </p>
          <p className="text-sm text-blue-700 mb-3">Which county are you targeting?</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_COUNTIES.map(county => (
              <button
                key={county}
                onClick={() => selectCounty(county)}
                className="px-3 py-1.5 bg-white border border-blue-300 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-colors"
              >
                {county}
              </button>
            ))}
            <button
              onClick={() => {
                const county = prompt('Enter county name:');
                if (county) selectCounty(county);
              }}
              className="px-3 py-1.5 bg-white border border-blue-300 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-colors"
            >
              Other...
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCountySelected = () => (
    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-green-800 font-medium mb-3">
            Great! I'll search <span className="font-bold">{selectedCounty}</span>. Try asking:
          </p>
          <div className="space-y-2">
            {EXAMPLE_QUERIES.map((query, idx) => (
              <div key={idx} className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <button
                  onClick={() => {
                    // This will be handled by the parent chat component
                    const event = new CustomEvent('zonewise-query', { detail: { query } });
                    window.dispatchEvent(event);
                  }}
                  className="text-sm text-green-700 hover:text-green-900 hover:underline text-left"
                >
                  "{query}"
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSearching = () => (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-amber-800 font-medium">
            🔍 Searching <span className="font-bold">{selectedCounty}</span> with AgentQL...
          </p>
          <p className="text-xs text-amber-600 mt-1">
            (This takes 5-15 seconds while I scrape live auction data)
          </p>
        </div>
      </div>
    </div>
  );

  switch (currentState) {
    case ONBOARDING_STATES.WELCOME:
      return renderWelcome();
    case ONBOARDING_STATES.COUNTY_SELECTED:
      return renderCountySelected();
    case ONBOARDING_STATES.FIRST_QUERY:
      return renderSearching();
    default:
      return null;
  }
};
