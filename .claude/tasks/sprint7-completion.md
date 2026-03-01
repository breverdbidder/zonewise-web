# Sprint 7 Completion — Close All Gaps

**Created:** 2026-03-01  
**Sprint:** 7 (continuation)  
**Status:** 60% complete → needs 5 tasks to reach 100%  
**Pre-approved:** All tasks below. Zero human-in-the-loop. Execute sequentially.

---

## ROOT CAUSE ANALYSIS

The auction dashboard at zonewise.ai/auctions returns 200 OK but renders only "Loading auctions..." and then silently fails. Three causes identified:

1. **Auth guard blocks rendering.** `components/auctions/AuctionsLayout.tsx` calls `supabase.auth.getUser()` and redirects to `/login` when no user is found. The `/login` page does not exist in `app/`. Every visitor hits a dead redirect. The API routes work because they bypass auth entirely (server-side Supabase client).

2. **Mapbox token missing.** `AuctionMap.tsx` reads `process.env.NEXT_PUBLIC_MAPBOX_TOKEN`. The `.env.production` file has it blank. The verified token `pk.eyJ1IjoiZXZlcmVzdDE4IiwiYSI6ImNtanB5cDQ5ZzF1eWgzaHB2cGVhZXdqbjMifQ.4RPrkTf84GL1-clmhmCnTw` must be set in Vercel.

3. **Render auction endpoints orphaned.** The 8 FastAPI endpoints committed to `brevard-bidder-scraper/src/api/main.py` never reached Render because Render deploys from `zonewise-agents`. However, the Next.js API routes (`/api/auctions`, `/api/auctions/summary`, `/api/auctions/[id]`) query Supabase directly and are fully functional. The Render endpoints are redundant for the dashboard.

---

## TASK 5A: Remove Auth Guard from Auction Dashboard

**Repo:** `breverdbidder/zonewise-web`  
**File:** `components/auctions/AuctionsLayout.tsx`  
**Risk:** LOW — public data only, no PII

### What to change

Remove the entire auth block from the `useEffect` init function. Replace:

```typescript
useEffect(() => {
  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    await Promise.all([fetchSummary(), fetchAuctions()])
    setLoading(false)
  }
  init()
}, [])
```

With:

```typescript
useEffect(() => {
  const init = async () => {
    await Promise.all([fetchSummary(), fetchAuctions()])
    setLoading(false)
  }
  init()
}, [])
```

Also remove unused imports that are now dead code:
- Remove `useRouter` from the `next/navigation` import
- Remove `createClient` from the `@/lib/supabase/client` import
- Remove `const router = useRouter()` line
- Remove `const supabase = createClient()` line

### Verification

After push, wait for Vercel build, then:
```bash
curl -sL "https://www.zonewise.ai/auctions" | grep -c "Auction Intelligence"
# Expected: 1 (heading renders)
```

---

## TASK 5B: Set Mapbox Token in Vercel Environment

**Platform:** Vercel dashboard  
**Project:** zonewise-web (connected to breverdbidder/zonewise-web)

### What to set

Environment variable: `NEXT_PUBLIC_MAPBOX_TOKEN`  
Value: `pk.eyJ1IjoiZXZlcmVzdDE4IiwiYSI6ImNtanB5cDQ5ZzF1eWgzaHB2cGVhZXdqbjMifQ.4RPrkTf84GL1-clmhmCnTw`  
Scope: Production + Preview

### Method

**Option A (CLI — preferred for zero-touch):**
```bash
npx vercel env add NEXT_PUBLIC_MAPBOX_TOKEN production preview < <(echo "pk.eyJ1IjoiZXZlcmVzdDE4IiwiYSI6ImNtanB5cDQ5ZzF1eWgzaHB2cGVhZXdqbjMifQ.4RPrkTf84GL1-clmhmCnTw")
```

**Option B (Vercel Dashboard):**
Go to vercel.com → zonewise-web project → Settings → Environment Variables → Add.

### Also verify these are set

| Variable | Expected Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mocerqjnksmhcjzxrewo.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ends with `...klKQDw` |
| `SUPABASE_SERVICE_ROLE_KEY` | Ends with `...Tqp9nE` |

If any are missing, set them. Without these, the API routes return 500.

### Verification

After setting env vars, trigger a redeploy:
```bash
npx vercel --prod
```

Then:
```bash
curl -sL "https://www.zonewise.ai/api/auctions/summary" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Total: {d[\"total\"]}, Counties: {len(d[\"by_county\"])}')"
# Expected: Total: 303, Counties: 9
```

---

## TASK 5C: Acknowledge Render Endpoints Redundancy

**Repo:** `breverdbidder/brevard-bidder-scraper`  
**Action:** Add comment header to `src/api/main.py` documenting the architecture decision

Add this block at the top of `src/api/main.py` after imports:

```python
# ──────────────────────────────────────────────────────────────
# ARCHITECTURE NOTE (Sprint 7, 2026-03-01):
#
# These FastAPI auction endpoints exist here for standalone/CLI use
# and future multi-tenant API access. The production auction dashboard
# at zonewise.ai/auctions uses Next.js API routes that query Supabase
# directly (app/api/auctions/ in zonewise-web repo).
#
# Render deploys from zonewise-agents, NOT this repo.
# These endpoints are NOT live on Render and that is intentional.
#
# Data flow:
#   Supabase (multi_county_auctions) → Next.js API routes → Dashboard
#   Supabase (multi_county_auctions) → These endpoints → CLI/scripts
# ──────────────────────────────────────────────────────────────
```

**Commit message:** `sprint7: document auction API architecture decision — Next.js routes are primary, FastAPI for CLI`

---

## TASK 6: Sprint History Sync to Monorepo

**Repo:** `breverdbidder/zonewise`  
**Action:** Create sprint tracking document

Create file: `docs/sprints/sprint7-report.md`

```markdown
# Sprint 7 Report — Auction Dashboard Integration

**Date:** 2026-03-01
**Duration:** 1 day (continuation sprint)
**Repos touched:** brevard-bidder-scraper, zonewise-web

## Objectives
Close integration gap between enrichment pipeline and product UI.

## Delivered

### brevard-bidder-scraper (aada72e)
- Task 1: 21/21 address gaps patched — 5 addresses, 11 vacant land flags, 4 unresolvable tags
- Task 2: 8 FastAPI auction endpoints (standalone/CLI use, not deployed to Render)
- Files: src/api/main.py (+480 -103), src/enrichment/sprint7_data_patch.py (+298 new)

### zonewise-web (ddf93de + sprint7-fix commit)
- Task 3: 3 Next.js API routes — /api/auctions, /summary, /[id]
- Task 4: Auction dashboard page — table, map, filters, summary cards, TopNav
- Task 5A: Removed auth guard (was blocking all visitors)
- Task 5B: Mapbox token configured in Vercel
- Files: 13 files (+887 lines) + auth fix

### Architecture Decisions
- Next.js API routes are the primary data path for the dashboard (query Supabase directly)
- FastAPI endpoints in brevard-bidder-scraper remain for CLI/script use
- Render (zonewise-agents) unchanged — serves zoning chat, not auction data

## Data State
- 303 auctions across 9 counties
- 283 with addresses, 11 vacant land, 4 condos
- Brevard: 182, Broward: 24, Miami-Dade: 21, Lee: 20, Palm Beach: 15

## Known Issues
- 6 counties (Hillsborough, Lee, Orange, Palm Beach, Pinellas, Polk) have corrupted fl_parcels data from ZoneWise import — affects enrichment match rates
- 20 remaining address gaps are genuinely unresolvable (vacant land, unknown heirs)
```

**Commit message:** `sprint7: add sprint report to monorepo docs`

---

## TASK 7: End-to-End Verification Matrix

Run each check. Record PASS or FAIL. If any FAIL, fix before marking sprint complete.

### Data Layer (Supabase)

| # | Check | Command | Expected |
|---|---|---|---|
| 1 | multi_county_auctions has data | `curl -s "https://mocerqjnksmhcjzxrewo.supabase.co/rest/v1/multi_county_auctions?select=count" -H "apikey: <anon_key>" -H "Prefer: count=exact" -I \| grep content-range` | `0-*/303` or similar |
| 2 | Enrichment columns populated | `curl -s ".../multi_county_auctions?select=just_value,year_built&just_value=gt.0&limit=1" -H "apikey: <anon_key>"` | Returns row with values |
| 3 | Geocoded rows exist | `curl -s ".../multi_county_auctions?select=centroid_lat,centroid_lng&centroid_lat=not.is.null&limit=1" -H "apikey: <anon_key>"` | Returns lat/lng |
| 4 | Vacant land flagged | `curl -s ".../multi_county_auctions?select=id,is_vacant_land,address_status&is_vacant_land=eq.true&limit=3" -H "apikey: <anon_key>"` | Returns flagged rows |

### Next.js API Routes (zonewise.ai)

| # | Check | Command | Expected |
|---|---|---|---|
| 5 | /api/auctions returns data | `curl -sL "https://www.zonewise.ai/api/auctions?limit=3" \| python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d['data']), d['total'])"` | `3 303` |
| 6 | /api/auctions/summary works | `curl -sL "https://www.zonewise.ai/api/auctions/summary" \| python3 -c "import json,sys; d=json.load(sys.stdin); print(d['total'], len(d['by_county']))"` | `303 9` |
| 7 | /api/auctions/[id] works | `curl -sL "https://www.zonewise.ai/api/auctions/607" \| python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('county','FAIL'))"` | `Brevard` |
| 8 | County filter works | `curl -sL "https://www.zonewise.ai/api/auctions?county=Brevard&limit=1" \| python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data'][0]['county'])"` | `Brevard` |
| 9 | Type filter works | `curl -sL "https://www.zonewise.ai/api/auctions?type=tax_deed&limit=1" \| python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data'][0]['auction_type'])"` | `tax_deed` |

### Dashboard UI (browser)

| # | Check | Command | Expected |
|---|---|---|---|
| 10 | Page loads without redirect | `curl -sL -o /dev/null -w "%{http_code} %{url_effective}" "https://www.zonewise.ai/auctions"` | `200 https://www.zonewise.ai/auctions` |
| 11 | Heading renders | `curl -sL "https://www.zonewise.ai/auctions" \| grep -c "Auction Intelligence"` | `1` |
| 12 | Table data renders | `curl -sL "https://www.zonewise.ai/auctions" \| grep -c "auction"` | `>5` |
| 13 | TopNav renders | `curl -sL "https://www.zonewise.ai/auctions" \| grep -c "Dashboard"` | `≥1` |

### Render (zonewise-agents — unchanged)

| # | Check | Command | Expected |
|---|---|---|---|
| 14 | Health endpoint | `curl -s "https://zonewise-agents.onrender.com/health" \| python3 -c "import json,sys; print(json.load(sys.stdin)['status'])"` | `healthy` |
| 15 | Zoning chat still works | `curl -s "https://zonewise-agents.onrender.com/chat-ui" -o /dev/null -w "%{http_code}"` | `200` |

### GitHub (code state)

| # | Check | Command | Expected |
|---|---|---|---|
| 16 | Sprint report committed | `curl -s -H "Authorization: token $GH_TOKEN" "https://api.github.com/repos/breverdbidder/zonewise/contents/docs/sprints/sprint7-report.md" \| python3 -c "import json,sys; print('EXISTS' if 'content' in json.load(sys.stdin) else 'MISSING')"` | `EXISTS` |

---

## EXECUTION ORDER

```
1. TASK 5A  → Push auth guard fix to zonewise-web → wait for Vercel build
2. TASK 5B  → Set Mapbox + verify Supabase env vars in Vercel → trigger redeploy
3. TASK 5C  → Push architecture comment to brevard-bidder-scraper
4. TASK 6   → Push sprint report to zonewise monorepo
5. TASK 7   → Run all 16 verification checks → record results
6. IF all 16 PASS → Sprint 7 = COMPLETE
7. IF any FAIL → fix and re-verify that check only
```

## COMMIT CONVENTIONS

All commits prefixed with `sprint7:` for traceability.

## BLOCKERS

**TASK 5B may require Ariel's Vercel access** if Claude Code doesn't have the Vercel CLI authenticated. If blocked:
1. Try `npx vercel env add` (may work if token is cached)
2. If that fails, try GitHub Actions with Vercel deploy hook
3. If truly blocked after 3 attempts, surface to Ariel with exact env var names and values to set manually

Everything else is zero-touch.
