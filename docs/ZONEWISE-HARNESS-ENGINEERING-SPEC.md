# ZoneWise Harness Engineering Spec
## Derived from learn-claude-code (shareAI-lab, MIT) + everything-claude-code (affaan-m, MIT)

> **Sprint 1 Reference** — Enterprise patterns for split-screen, chatbot, multi-agent, and skill system
> **Date:** 2026-03-31 | **Author:** Claude AI Architect
> **SUMMIT:** #122 (Issue #124)

---

## 1. Core Agent Loop Pattern

Source: `learn-claude-code/agents/s01_agent_loop.py`

```
while stop_reason == "tool_use":
    response = LLM(messages, tools)
    execute tools
    append results
```

### ZoneWise Chat Panel Implementation

```typescript
// chat.zonewise.ai — Dify RAG chat with tool loop
interface ChatMessage {
  role: 'user' | 'assistant' | 'tool_result';
  content: string;
  tool_calls?: ToolCall[];
}

async function agentLoop(messages: ChatMessage[], tools: ZoneWiseTool[]) {
  while (true) {
    const response = await callLLM(messages, tools);
    
    if (response.stop_reason !== 'tool_use') {
      return response; // Final answer to user
    }
    
    // Execute each tool call
    for (const toolCall of response.tool_calls) {
      const result = await executeZoneWiseTool(toolCall);
      messages.push({ role: 'tool_result', content: result });
      
      // Bridge: send spatial results to map panel
      if (toolCall.name.startsWith('spatial_')) {
        bridge.postMessage({ type: 'tool_result', payload: result });
      }
    }
  }
}
```

---

## 2. Bridge Messaging Protocol (Split-Screen)

Source: CC architecture patterns + learn-claude-code subagent pattern

### Message Types

```typescript
// Bridge message protocol between Map Panel ↔ Chat Panel
type BridgeMessage =
  | { type: 'parcel_selected'; payload: { parcelId: string; lat: number; lng: number; address: string } }
  | { type: 'zone_query'; payload: { parcelId: string; question: string } }
  | { type: 'filter_applied'; payload: { metric: string; range: [number, number]; county: string } }
  | { type: 'chat_highlight'; payload: { parcelIds: string[]; color: string; label: string } }
  | { type: 'chat_navigate'; payload: { lat: number; lng: number; zoom: number } }
  | { type: 'tool_result'; payload: { toolName: string; data: Record<string, unknown> } }
  | { type: 'auth_sync'; payload: { token: string; tier: 'free' | 'paid' } }
  | { type: 'click_count'; payload: { count: number; limit: number } };

// Bridge implementation
class PanelBridge {
  private channel: BroadcastChannel;
  private listeners: Map<string, Set<(msg: BridgeMessage) => void>> = new Map();

  constructor(panelId: 'map' | 'chat') {
    this.channel = new BroadcastChannel('zonewise-bridge');
    this.channel.onmessage = (event) => {
      const msg = event.data as BridgeMessage;
      this.listeners.get(msg.type)?.forEach(fn => fn(msg));
    };
  }

  postMessage(msg: BridgeMessage) {
    this.channel.postMessage(msg);
  }

  on(type: BridgeMessage['type'], callback: (msg: BridgeMessage) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(callback);
    return () => this.listeners.get(type)?.delete(callback);
  }
}
```

### Split-Screen Layout

```typescript
// CraftAgentLayout — responsive split-screen
export function ZoneWiseSplitScreen() {
  const [bridge] = useState(() => new PanelBridge('container'));
  const { tier } = useAuth();
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Map Panel — always visible */}
      <div className={tier === 'paid' ? 'w-1/2' : 'w-full'}>
        <MapPanel bridge={bridge} onInteraction={() => {
          const next = clickCount + 1;
          setClickCount(next);
          if (tier === 'free' && next >= 5) {
            bridge.postMessage({ type: 'click_count', payload: { count: next, limit: 5 } });
          }
        }} />
      </div>
      
      {/* Chat Panel — paid only */}
      {tier === 'paid' && (
        <div className="w-1/2 border-l border-slate-800">
          <ChatPanel bridge={bridge} />
        </div>
      )}
      
      {/* Paywall Modal */}
      {tier === 'free' && clickCount >= 5 && <PaywallModal />}
    </div>
  );
}
```

---

## 3. Tool System with Zod Schemas

Source: `learn-claude-code/agents/s02_tool_use.py` + `everything-claude-code/skills/`

### Tool Definition Pattern

```typescript
import { z } from 'zod';

// Base tool interface — every ZoneWise skill implements this
interface ZoneWiseTool {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  permissionTier: 'free' | 'paid';
  execute: (input: unknown) => Promise<ToolResult>;
}

interface ToolResult {
  success: boolean;
  data: Record<string, unknown>;
  spatial?: { parcelIds?: string[]; geoJson?: GeoJSON.FeatureCollection };
  display?: { type: 'table' | 'card' | 'chart'; content: unknown };
}

// Example: ParcelLookupTool
const ParcelLookupTool: ZoneWiseTool = {
  name: 'parcel_lookup',
  description: 'Look up property details by address or parcel ID in any FL county',
  inputSchema: z.object({
    query: z.string().describe('Address or parcel ID'),
    county: z.string().optional().describe('County name (auto-detected if omitted)'),
  }),
  permissionTier: 'free',
  execute: async (input) => {
    const { query, county } = ParcelLookupTool.inputSchema.parse(input);
    const result = await supabase
      .from('parcels')
      .select('*')
      .textSearch('address', query)
      .limit(5);
    return {
      success: true,
      data: result.data[0],
      spatial: { parcelIds: result.data.map(r => r.parcel_id) },
      display: { type: 'card', content: result.data[0] },
    };
  },
};
```

### Tool Registry (First 10 Skills for Sprint 1)

```typescript
const SPRINT_1_TOOLS: ZoneWiseTool[] = [
  // FREE TIER (5 tools)
  ParcelLookupTool,      // Search by address/ID
  ZoningCheckTool,       // Zoning + permitted uses
  FloodZoneTool,         // FEMA overlay
  DemographicsTool,      // Census neighborhood profile
  HeatmapTool,           // Choropleth for any metric
  
  // PAID TIER (5 more in Sprint 1)
  CompsAnalysisTool,     // Comparable sales
  LienPriorityTool,      // AcclaimWeb lien stack
  MaxBidCalculatorTool,  // ARV formula
  BidDecisionTool,       // ML BID/REVIEW/SKIP
  ReportGeneratorTool,   // One-page property report
];

// Tool dispatch with permission check
async function dispatchTool(
  toolName: string, 
  input: unknown, 
  userTier: 'free' | 'paid'
): Promise<ToolResult> {
  const tool = SPRINT_1_TOOLS.find(t => t.name === toolName);
  if (!tool) throw new Error(`Unknown tool: ${toolName}`);
  if (tool.permissionTier === 'paid' && userTier === 'free') {
    return { success: false, data: { error: 'upgrade_required' } };
  }
  return tool.execute(input);
}
```

---

## 4. Skill Loading (Two-Layer Injection)

Source: `learn-claude-code/agents/s05_skill_loading.py`

```
Layer 1 (cheap): Skill names + descriptions in system prompt (~100 tokens/skill)
Layer 2 (on demand): Full skill body loaded via tool_result when model requests it
```

### ZoneWise Skill Loading

```typescript
// System prompt includes only skill metadata (Layer 1)
function buildSystemPrompt(skills: ZoneWiseTool[]): string {
  const skillList = skills
    .map(s => `- ${s.name}: ${s.description} [${s.permissionTier}]`)
    .join('\n');
  
  return `You are a ZoneWise real estate intelligence assistant.
Available tools:
${skillList}

When a user asks about properties, zoning, or market data, use the appropriate tool.
For spatial results, always include parcel IDs so the map panel can highlight them.`;
}

// Layer 2: Full skill body loaded on demand (saves tokens)
const SKILL_BODIES: Record<string, string> = {
  parcel_lookup: `
    ## Parcel Lookup — Full Instructions
    1. Parse address components (street, city, zip)
    2. Search Supabase parcels table with text search
    3. If no results, try BCPAO API fallback
    4. Return: parcel_id, owner, legal_desc, assessed_value, zoning
    5. Always include lat/lng for map highlighting
  `,
  // ... more skills loaded from markdown files
};
```

---

## 5. Context Compression (Infinite Sessions)

Source: `learn-claude-code/agents/s06_context_compact.py`

### Three-Layer Compression for ZoneWise Chat

```typescript
// Layer 1: Micro-compact (every turn, silent)
function microCompact(messages: ChatMessage[]): ChatMessage[] {
  const KEEP_RECENT = 3;
  return messages.map((msg, i) => {
    if (i >= messages.length - KEEP_RECENT) return msg; // Keep recent
    if (msg.role === 'tool_result' && msg.toolName !== 'parcel_lookup') {
      return { ...msg, content: `[Previous: used ${msg.toolName}]` };
    }
    return msg;
  });
}

// Layer 2: Auto-compact (when tokens > threshold)
async function autoCompact(messages: ChatMessage[]): Promise<ChatMessage[]> {
  const tokenCount = estimateTokens(messages);
  if (tokenCount < 50000) return messages;
  
  // Save full transcript
  await saveTranscript(messages);
  
  // Summarize with LLM
  const summary = await callLLM([{
    role: 'user',
    content: `Summarize this conversation. Preserve: 
      - Parcel IDs discussed
      - Decisions made (BID/REVIEW/SKIP)
      - Active filters and search criteria
      - User preferences expressed`
  }]);
  
  return [{ role: 'assistant', content: `[Session Summary]\n${summary}` }];
}

// Layer 3: Manual compact (user triggers)
// Accessible via chat command: "compress context" or button in UI
```

---

## 6. Sub-Agent Pattern (Delegation)

Source: `learn-claude-code/agents/s04_subagent.py`

```
Parent agent → spawns child with fresh context → child works → returns summary → child discarded
Key: "Process isolation gives context isolation for free"
```

### ZoneWise Sub-Agents

```typescript
// When user asks complex question, spawn specialized sub-agent
async function spawnSubAgent(
  task: string,
  agentType: 'spatial' | 'auction' | 'analysis' | 'report',
  parentContext: { parcelId?: string; county?: string }
): Promise<string> {
  const subAgentPrompt = {
    spatial: 'You are a spatial analysis agent. Use Mapbox and PostGIS queries.',
    auction: 'You are an auction intelligence agent. Search foreclosure + tax deed data.',
    analysis: 'You are a market analysis agent. Run XGBoost predictions and comps.',
    report: 'You are a report generation agent. Create formatted property reports.',
  }[agentType];

  // Fresh context — only task-relevant info
  const messages = [
    { role: 'system', content: subAgentPrompt },
    { role: 'user', content: `${task}\nContext: ${JSON.stringify(parentContext)}` },
  ];

  const result = await agentLoop(messages, getToolsForAgent(agentType));
  return result.content; // Summary only — full context discarded
}
```

---

## 7. Agent Teams (Persistent Named Agents)

Source: `learn-claude-code/agents/s09_agent_teams.py`

```
Subagent: spawn → execute → return summary → destroyed
Teammate: spawn → work → idle → work → ... → shutdown
Communication: File-based JSONL inboxes (append-only)
```

### ZoneWise Agent Team Architecture

```yaml
zonewise_team:
  lead:
    role: Router + orchestrator
    model: gemini-flash  # FREE tier
    tools: [all_tools]
    behavior: Routes queries to specialists
    
  spatial_agent:
    role: Map operations + GIS queries
    model: gemini-flash
    tools: [parcel_lookup, zoning_check, flood_zone, heatmap, comps]
    behavior: Handles all location-based queries
    
  auction_agent:
    role: Foreclosure + tax deed intelligence
    model: deepseek-v3.2  # CHEAP tier
    tools: [foreclosure_search, tax_deed_search, lien_priority, max_bid]
    behavior: Handles auction analysis + bid recommendations
    
  analysis_agent:
    role: ML scoring + market analysis
    model: claude-sonnet  # QUALITY tier
    tools: [demographics, market_trend, investment_scorer, bid_decision]
    behavior: Complex analysis requiring reasoning
    
  report_agent:
    role: Document generation
    model: deepseek-v3.2
    tools: [report_generator]
    behavior: Generates PDF/DOCX reports from analysis
    
  communication: supabase_realtime  # Not JSONL files — use Supabase channels
  inbox_pattern: nexus_tasks table with agent_id filter
```

---

## 8. Autonomous Agent Pattern (Self-Finding Work)

Source: `learn-claude-code/agents/s11_autonomous_agents.py`

```
Idle cycle: poll task board → claim unclaimed tasks → execute → return to idle
Identity re-injection after context compression
```

### ZoneWise Application: Proactive Alerts

```typescript
// Autonomous agent checks for new auction listings
async function auctionWatcherLoop() {
  while (true) {
    // Poll for new listings every 5 minutes
    const newListings = await checkForNewListings();
    
    if (newListings.length > 0) {
      // Auto-analyze each new listing
      for (const listing of newListings) {
        const analysis = await spawnSubAgent(
          `Analyze this new listing: ${JSON.stringify(listing)}`,
          'auction',
          { county: listing.county }
        );
        
        // Store result + notify user via Telegram
        await supabase.from('auction_alerts').insert({
          listing_id: listing.id,
          analysis,
          recommendation: extractRecommendation(analysis),
        });
        
        await sendTelegramAlert(analysis);
      }
    }
    
    // Idle for 5 minutes
    await sleep(5 * 60 * 1000);
  }
}
```

---

## 9. Cost-Aware Model Routing

Source: `everything-claude-code/skills/cost-aware-llm-pipeline/SKILL.md`

### ZoneWise Smart Router (Already in Stack)

```yaml
smart_router:
  tiers:
    FREE:
      model: gemini-flash
      cost: $0
      use_for: [parcel_lookup, zoning_check, heatmap, demographics, simple_queries]
      
    CHEAP:
      model: deepseek-v3.2
      cost: $0.28/1M input
      use_for: [bulk_parsing, report_generation, lien_analysis, data_extraction]
      
    QUALITY:
      model: claude-sonnet
      cost: $0 (Max plan)
      use_for: [complex_analysis, bid_decisions, user_chat, reasoning_tasks]
      
  routing_logic: |
    if tool in FREE_TOOLS and input_tokens < 10000:
      route → Gemini Flash
    elif task is bulk_processing or report_gen:
      route → DeepSeek V3.2
    else:
      route → Claude Sonnet
      
  budget_tracking:
    session_limit: $10
    daily_limit: $3.33
    alert_at: 80%
```

---

## 10. Design System Audit Pattern

Source: `everything-claude-code/skills/design-system/SKILL.md`

### ZoneWise DesignWise V3 Integration

```yaml
designwise_audit_dimensions:
  1_color_consistency:
    standard: "Navy #1E3A5F primary, Orange #F59E0B accent, bg #020617"
    check: "All components use CSS variables from globals.css"
    
  2_typography_hierarchy:
    standard: "Inter font family, clear h1>h2>h3>body>caption"
    check: "No arbitrary font sizes, consistent scale"
    
  3_spacing_rhythm:
    standard: "4px base unit, Tailwind spacing scale"
    check: "No arbitrary margin/padding values"
    
  4_component_consistency:
    standard: "shadcn/ui base, ZoneWise extensions"
    check: "Similar elements look similar across pages"
    
  5_responsive:
    standard: "Split-screen → stacked on mobile (< 768px)"
    check: "Map and chat panels responsive"
    
  6_dark_mode:
    standard: "Dark-first (slate-950 bg)"
    check: "Complete, no light-mode artifacts"
    
  7_animation:
    standard: "Purposeful only — map transitions, panel slides"
    check: "No gratuitous animations"
    
  8_accessibility:
    standard: "WCAG 2.1 AA minimum"
    check: "Contrast ratios, focus states, touch targets 44px+"
    
  9_information_density:
    standard: "Dense but organized — real estate data is inherently dense"
    check: "Clear visual hierarchy, scannable"
    
  10_polish:
    standard: "Hover states, loading skeletons, empty states, error states"
    check: "Every state designed, not just happy path"

  run_per_sprint: true
  playwright_screenshots: required
  score_threshold: 70/100
```

---

## 11. Parallel Prefetch Implementation

Source: CC architecture patterns + everything-claude-code performance patterns

```typescript
// app/layout.tsx — fire all prefetches in parallel before hydration
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Parallel prefetch — don't await sequentially
  const [auth, flags, countyIndex] = await Promise.all([
    supabase.auth.getSession(),           // Auth check
    posthog.getFeatureFlags(),            // Feature flags
    prefetchCountyIndex(),                 // Top 10 counties parcel count
  ]);

  return (
    <html lang="en">
      <body className="bg-slate-950 text-white font-sans">
        <AuthProvider session={auth}>
          <FeatureFlagProvider flags={flags}>
            <CountyProvider index={countyIndex}>
              {children}
            </CountyProvider>
          </FeatureFlagProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

// Lazy load heavy modules
const MapPanel = dynamic(() => import('@/components/MapPanel'), {
  loading: () => <MapSkeleton />,
  ssr: false, // Mapbox GL doesn't SSR
});

const ChatPanel = dynamic(() => import('@/components/ChatPanel'), {
  loading: () => <ChatSkeleton />,
});

const MLScorer = dynamic(() => import('@/lib/ml-scorer'), {
  ssr: false, // Load only when first scoring request
});
```

---

## 12. Feature Flags for Tier Separation

```typescript
// PostHog feature flags
const ZONEWISE_FLAGS = {
  SPLIT_SCREEN: 'zonewise-split-screen',     // Paid only
  ML_SCORING: 'zonewise-ml-scoring',          // Paid only
  BATCH_EXPORT: 'zonewise-batch-export',      // Paid only
  ALERT_SYSTEM: 'zonewise-alerts',            // Paid only
  API_ACCESS: 'zonewise-api',                 // Enterprise only
  SPANISH_UI: 'zonewise-i18n-es',             // Sprint 2
  ADMIN_MODE: 'zonewise-admin',               // Internal only
} as const;

// Usage in components
function ChatPanel({ bridge }: { bridge: PanelBridge }) {
  const splitScreen = useFeatureFlag(ZONEWISE_FLAGS.SPLIT_SCREEN);
  if (!splitScreen) return null; // Dead code elimination in free tier build
  
  return <DifyChatEmbed bridge={bridge} />;
}
```

---

## 13. i18n Foundation

```typescript
// next.config.ts
const config = {
  i18n: {
    locales: ['en', 'es', 'pt', 'he'],
    defaultLocale: 'en',
  },
};

// messages/en.json (component-level, not string tables)
{
  "map": {
    "search_placeholder": "Search address or parcel ID...",
    "layers": "Map Layers",
    "zoning": "Zoning",
    "flood": "Flood Zones",
    "parcels": "Parcels"
  },
  "chat": {
    "placeholder": "Ask about any property in Florida...",
    "upgrade_cta": "Upgrade to Pro for full analysis",
    "tool_running": "Analyzing..."
  },
  "paywall": {
    "title": "Unlock Full Intelligence",
    "subtitle": "Get AI-powered property analysis, auction alerts, and more",
    "price": "$99/month",
    "cta": "Start Pro Trial"
  }
}
```

---

## Appendix: Repo Evaluation Scores

### shareAI-lab/learn-claude-code

| Dimension | Score | Notes |
|-----------|-------|-------|
| Security | 9/10 | MIT license, clean original code |
| Value | 9/10 | Complete agent harness curriculum, 12 sessions |
| Stability | 8/10 | Well-maintained, tests included |
| Integration | 8/10 | Python patterns translate directly to TS |
| Cost | 10/10 | Free, MIT |
| **ADOPT Score** | **88** | ADOPT — Reference for all agent patterns |

### affaan-m/everything-claude-code

| Dimension | Score | Notes |
|-----------|-------|-------|
| Security | 8/10 | MIT license, 992+ tests |
| Value | 9/10 | 100+ skills, 30+ agents, production patterns |
| Stability | 7/10 | Active development, frequent updates |
| Integration | 7/10 | CC plugin format, some patterns need adaptation |
| Cost | 10/10 | Free, MIT |
| **ADOPT Score** | **82** | ADOPT — Skill library + design system audit |

---

*Generated 2026-03-31 by Claude AI Architect*
*Sources: MIT-licensed open-source repositories only*
*No proprietary code copied or referenced*
