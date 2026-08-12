# ZoneWise.AI Onboarding Implementation Guide

**Version:** 1.0.0  
**Deploy Date:** Feb 19, 2026  
**Architect:** Claude Sonnet 4.5 (AI Architect)  
**Status:** READY FOR DEPLOYMENT

---

## 🎯 Objective

Deploy conversational onboarding flow for ZoneWise.AI launch that teaches users:
1. How to select a county
2. How to query the AI agent
3. Where artifacts/reports appear
4. How to navigate multi-county mode

**Design Decision:** In-chat conversational flow (NO modals, NO Figma overlays)  
**Rationale:** Faster to build, fits NLP chatbot interface, more natural UX

---

## 📁 Files Deployed

```
zonewise-web/
├── components/
│   ├── OnboardingProvider.tsx      # React Context for state management
│   ├── OnboardingMessage.tsx        # AI message components with buttons
│   └── OnboardingTooltip.tsx        # Right-panel tooltip overlay
├── migrations/
│   └── 20260217_add_onboarding_events.sql  # Supabase schema
└── docs/
    └── zonewise-onboarding-states.json     # State machine spec
```

---

## 🚀 Deployment Steps

### Step 1: Run Supabase Migration (5 min)

```bash
# Navigate to zonewise-web repo
cd zonewise-web

# Copy migration file
cp /mnt/user-data/outputs/20260217_add_onboarding_events.sql migrations/

# Run migration
supabase db push

# Verify table created
supabase db sql "SELECT COUNT(*) FROM onboarding_events;"
```

**Expected Output:** `count: 0` (table exists, empty)

---

### Step 2: Add Components to Repo (5 min)

```bash
# Create components directory if it doesn't exist
mkdir -p components/onboarding

# Copy files
cp /mnt/user-data/outputs/OnboardingProvider.tsx components/onboarding/
cp /mnt/user-data/outputs/OnboardingMessage.tsx components/onboarding/
cp /mnt/user-data/outputs/OnboardingTooltip.tsx components/onboarding/

# Create barrel export
cat > components/onboarding/index.ts << 'EOF'
export { OnboardingProvider, useOnboarding } from './OnboardingProvider';
export { OnboardingMessage } from './OnboardingMessage';
export { OnboardingTooltip } from './OnboardingTooltip';
EOF
```

---

### Step 3: Integrate with Main App (10 min)

#### 3.1: Wrap App with OnboardingProvider

**File:** `pages/_app.tsx` (or `app/layout.tsx` for Next.js 13+)

```tsx
import { OnboardingProvider } from '@/components/onboarding';

export default function App({ Component, pageProps }) {
  return (
    <OnboardingProvider>
      <Component {...pageProps} />
    </OnboardingProvider>
  );
}
```

#### 3.2: Add OnboardingMessage to Chat Interface

**File:** `components/ChatInterface.tsx` (or wherever your chat UI lives)

```tsx
import { OnboardingMessage } from '@/components/onboarding';

export const ChatInterface = () => {
  return (
    <div className="flex h-screen">
      {/* Left panel - Chat */}
      <div className="w-1/2 flex flex-col">
        {/* Onboarding message appears at top of chat */}
        <OnboardingMessage />
        
        {/* Existing chat messages */}
        <ChatMessages />
        <ChatInput />
      </div>
      
      {/* Right panel - Artifacts */}
      <div className="w-1/2">
        <ArtifactPanel />
      </div>
    </div>
  );
};
```

#### 3.3: Add OnboardingTooltip to Report View

**File:** `components/ArtifactPanel.tsx` (or your report display component)

```tsx
import { OnboardingTooltip } from '@/components/onboarding';

export const ArtifactPanel = () => {
  return (
    <div className="relative h-full">
      {/* Tooltip appears when report is first generated */}
      <OnboardingTooltip />
      
      {/* Existing artifact/report content */}
      <ReportContent />
    </div>
  );
};
```

#### 3.4: Hook Onboarding Events into Query Handler

**File:** `components/ChatInput.tsx` (or wherever queries are submitted)

```tsx
import { useOnboarding } from '@/components/onboarding';

export const ChatInput = () => {
  const { submitFirstQuery, currentState, ONBOARDING_STATES } = useOnboarding();
  
  const handleSubmit = async (query: string) => {
    // Track first query during onboarding
    if (currentState === ONBOARDING_STATES.COUNTY_SELECTED) {
      submitFirstQuery(query);
    }
    
    // Existing query submission logic
    await sendQuery(query);
  };
  
  // Listen for example query clicks
  useEffect(() => {
    const handleExampleQuery = (event: CustomEvent) => {
      const { query } = event.detail;
      handleSubmit(query);
    };
    
    window.addEventListener('zonewise-query', handleExampleQuery);
    return () => window.removeEventListener('zonewise-query', handleExampleQuery);
  }, []);
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(inputValue); }}>
      {/* Input field */}
    </form>
  );
};
```

#### 3.5: Trigger Report Generated State

**File:** `hooks/useQueryResults.ts` (or wherever API responses are handled)

```tsx
import { useOnboarding } from '@/components/onboarding';

export const useQueryResults = () => {
  const { showReport, currentState, ONBOARDING_STATES } = useOnboarding();
  
  const handleQueryResponse = (results: any[]) => {
    // Trigger onboarding tooltip when first report loads
    if (currentState === ONBOARDING_STATES.FIRST_QUERY && results.length > 0) {
      showReport(results.length);
    }
    
    // Existing result handling
    displayResults(results);
  };
  
  return { handleQueryResponse };
};
```

---

### Step 4: Environment Variables (2 min)

**File:** `.env.local`

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://mocerqjnksmhcjzxrewo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2VycWpua3NtaGNqenhyZXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzI1MjYsImV4cCI6MjA4MDEwODUyNn0.vIqLWjGWMG-kKlFw17pT7zVzQY-sO-ZnJ_VL9XklKQDw
```

---

### Step 5: Deploy to Vercel (5 min)

```bash
# Commit all files
git add .
git commit -m "feat: add conversational onboarding flow for Feb 19 launch

- OnboardingProvider for state management
- OnboardingMessage for in-chat guidance  
- OnboardingTooltip for right-panel overlay
- Supabase onboarding_events table
- Zero-modal, conversation-driven UX"

# Push to main (triggers Vercel deployment)
git push origin main

# Verify deployment
vercel --prod
```

**Vercel URL:** https://zonewise.ai

---

## 🧪 Testing Checklist

### Pre-Launch Testing (30 min)

- [ ] Clear localStorage: `localStorage.removeItem('zonewise_onboarding_complete')`
- [ ] Verify welcome message appears on first visit
- [ ] Click each county button → verify county_selected state
- [ ] Click example query → verify query submits
- [ ] Wait for report to load → verify tooltip appears
- [ ] Click "Got it!" → verify tooltip dismisses and onboarding completes
- [ ] Refresh page → verify onboarding does NOT restart
- [ ] Check Supabase: `SELECT * FROM onboarding_events ORDER BY timestamp DESC LIMIT 10;`
- [ ] Verify events: `onboarding_started`, `onboarding_county_selected`, `onboarding_first_query_submitted`, `onboarding_report_generated`, `onboarding_completed`

### Edge Cases

- [ ] Test with slow network (scraper takes >15 seconds)
- [ ] Test with scraper failure → verify error state
- [ ] Test with no results → verify no_results state
- [ ] Test skip functionality (if user dismisses early)
- [ ] Test on mobile (buttons should be touch-friendly)

---

## 📊 Analytics & Monitoring

### Supabase Queries

**Daily completion rate:**
```sql
SELECT * FROM onboarding_funnel 
WHERE date >= CURRENT_DATE - INTERVAL '7 days' 
ORDER BY date DESC;
```

**Drop-off points:**
```sql
SELECT 
    event_name,
    COUNT(DISTINCT session_id) as sessions,
    ROUND(100.0 * COUNT(DISTINCT session_id) / 
          (SELECT COUNT(DISTINCT session_id) FROM onboarding_events WHERE event_name = 'onboarding_started'), 2
    ) as percentage
FROM onboarding_events
WHERE timestamp >= CURRENT_DATE
GROUP BY event_name
ORDER BY sessions DESC;
```

**Average time to complete:**
```sql
SELECT 
    AVG(
        EXTRACT(EPOCH FROM (
            MAX(timestamp) FILTER (WHERE event_name = 'onboarding_completed') -
            MIN(timestamp) FILTER (WHERE event_name = 'onboarding_started')
        ))
    ) / 60 as avg_minutes_to_complete
FROM onboarding_events
GROUP BY session_id
HAVING COUNT(DISTINCT event_name) >= 2;
```

### Target Metrics (Week 1)

- **Completion rate:** >60% (users who start → complete)
- **Time to complete:** <2 minutes
- **Drop-off:** <20% at any single step
- **Skip rate:** <10% (users who dismiss onboarding)

---

## 🔧 Customization Options

### Change Popular Counties

**File:** `components/onboarding/OnboardingMessage.tsx`

```tsx
const POPULAR_COUNTIES = [
  'Miami-Dade',    // Change to your top 5
  'Broward',
  'Palm Beach',
  'Hillsborough',
  'Orange'
];
```

### Update Example Queries

```tsx
const EXAMPLE_QUERIES = [
  'Show me foreclosures under $200K',  // Customize these
  'Find properties with high equity',
  "What's the auction schedule this week?"
];
```

### Adjust Tooltip Auto-Dismiss Time

**File:** `components/onboarding/OnboardingTooltip.tsx`

```tsx
// Change 8000 to desired milliseconds
const timer = setTimeout(() => {
  setIsVisible(false);
  completeOnboarding();
}, 8000);  // 8 seconds
```

---

## 🚨 Troubleshooting

### Onboarding Doesn't Appear

**Check:**
1. localStorage: `localStorage.getItem('zonewise_onboarding_complete')`
2. Console: Look for `OnboardingProvider` errors
3. Environment: Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set

**Fix:**
```bash
localStorage.removeItem('zonewise_onboarding_complete');
# Refresh page
```

### Supabase Events Not Logging

**Check:**
1. Network tab: Look for failed POST to `/rest/v1/onboarding_events`
2. Supabase dashboard: RLS policies enabled?
3. Console: Check for CORS errors

**Fix:**
```sql
-- Verify RLS allows inserts
SELECT * FROM pg_policies WHERE tablename = 'onboarding_events';
```

### Tooltip Doesn't Appear

**Check:**
1. `currentState === ONBOARDING_STATES.REPORT_GENERATED`?
2. Is `OnboardingTooltip` rendered in the component tree?
3. CSS: Is `z-index: 50` being overridden?

**Debug:**
```tsx
useEffect(() => {
  console.log('Current state:', currentState);
  console.log('Is visible:', isVisible);
}, [currentState, isVisible]);
```

---

## 📈 Post-Launch Iteration Plan

### Week 1 (Feb 19-26)
- Monitor completion rates daily
- Identify drop-off points
- Collect qualitative feedback

### Week 2 (Feb 26-Mar 5)
- A/B test: In-chat vs modal overlay (if needed)
- Optimize example queries based on actual user queries
- Add county auto-detection from IP geolocation

### Week 3 (Mar 5-12)
- Personalize onboarding based on user role (investor vs agent vs researcher)
- Add video tutorial option
- Implement progressive disclosure for advanced features

---

## ✅ Sign-Off

**AI Architect:** Claude Sonnet 4.5  
**Deployment Status:** READY FOR PRODUCTION  
**Launch Date:** Feb 19, 2026  
**Expected Impact:**  
- 60%+ onboarding completion rate
- Reduced support tickets ("Where are my reports?")
- Faster time-to-first-value (<2 min)

**Next Steps:**
1. Developer executes deployment steps above
2. Run testing checklist
3. Deploy to production before Feb 19
4. Monitor analytics dashboard

**Questions?** Check Supabase `onboarding_events` table or review state machine spec in `zonewise-onboarding-states.json`

---

*Generated by AI Architect (Claude Sonnet 4.5) on Feb 17, 2026 at 4:52 PM EST*
