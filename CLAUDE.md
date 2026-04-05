# CLAUDE.md — BidDeed.AI / Everest Capital USA

## Who I Am
Ariel Shapira. Solo founder of BidDeed.AI and Everest Capital USA. 10+ years foreclosure investing in Brevard County, Florida. Licensed FL broker and general contractor. Building an AI-powered foreclosure auction intelligence platform. ADHD — I need systems that run themselves.

## My Stack
- **Repos:** github.com/breverdbidder/* (cli-anything-biddeed, zonewise-scraper-v4, biddeed-ai, biddeed-ai-ui, zonewise-web, cliproxy-gateway, tax-insurance-optimizer)
- **Database:** Supabase (mocerqjnksmhcjzxrewo.supabase.co) — multi_county_auctions (245K rows), activities, insights, daily_metrics
- **Compute:** Hetzner everest-dispatch (87.99.129.125) with CLIProxyAPI on 127.0.0.1:8317
- **AI:** Gemini Flash (FREE via CLIProxyAPI), DeepSeek V3.2 ($0.28/1M), Claude (Max plan, never API)
- **Deploy:** GitHub Actions + Cloudflare Pages + Render
- **Brand:** Navy #1E3A5F, Orange #F59E0B, Inter font, bg #020617

## Context Rules

When I mention an auction or property → query Supabase `multi_county_auctions` first
When I mention a case number → search `multi_county_auctions` by case_number field
When analyzing a deal → apply max bid formula: (ARV×70%)-Repairs-$10K-MIN($25K,15%×ARV)
When I ask about pipeline health → check `daily_metrics` and recent GitHub Action runs
When I mention a county → check if config exists in `counties/` before assuming anything
When something needs building → follow cli-anything HARNESS.md 7-phase pattern
When deploying code → push to GitHub, never local installs or Google Drive
When spending money → stop and confirm if >$10/session
When I context-switch mid-task → flag it: "📌 [previous task] is still open"
When I say "Summit" → execute immediately, no questions, no clarification

## How I Work
- Direct, no softening language. Facts and actions.
- Cost discipline: $10/session max. Batch operations. One attempt per approach.
- Zero HITL: try 3 alternatives before surfacing a blocker.
- Execute first, report results. Don't ask what to do.
- Push back with strong opinions when you disagree.
- Wrong = "I was wrong." Never invent numbers.

## Slash Commands
- `/auction-brief` — morning auction briefing from Supabase
- `/county-setup` — onboard a new Florida county
- `/deal-intel` — process foreclosure documents into structured data
- `/tldr` — end-of-session summary, updates memory.md
- `/transcript` — YouTube video analysis via Hetzner pipeline

## Family Context (when relevant)
- Wife Mariam: runs Property360 real estate, Protection Partners insurance, contracting
- Son Michael (16): D1 competitive swimmer, Satellite Beach HS, keto diet, Shabbat observance
- Orthodox practices: Shabbat (no work Fri sunset–Sat havdalah), kosher, holidays

## Claude Code Session Hygiene (Mar 15, 2026)

### Mandatory Plugins
These plugins MUST be installed in every Claude Code environment:

1. **Context7** — Live API documentation. Fixes 6-12 month knowledge lag on Supabase, Cloudflare, LangGraph, Firecrawl, Mapbox APIs. Install: `/plugin` → Discover → context7. Zero cost.
2. **claude-2x-statusline** — Context window monitor (Full tier). Shows model, context %, session cost, git branch. Install: `git clone https://github.com/Nadav-Fux/claude-2x-statusline.git ~/.claude/cc-2x-statusline && bash ~/.claude/cc-2x-statusline/install.sh`. RepoEval: 86.
4. **Supabase CLI** — Autonomous migrations, zero HITL. Install: `npm i -g supabase && supabase link --project-ref mocerqjnksmhcjzxrewo`. Project: mocerqjnksmhcjzxrewo.
5. **cctop** — Claude Code sessions dashboard. Monitor all sessions from one TUI: status, context %, tokens, errors, git branch. Install: `curl -fsSL https://raw.githubusercontent.com/DeanLa/cctop/main/install.sh | bash`. Run `cctop` in separate terminal. Fork: breverdbidder/cctop.


### Supabase CLI — Autonomous Operations (Apr 4, 2026)
```yaml
supabase_cli:
  auth: SUPABASE_ACCESS_TOKEN (sbp_ token)
  project: mocerqjnksmhcjzxrewo
  autonomous_ops:
    - supabase db push          # Apply migrations — NO HITL
    - supabase db diff           # Generate migration from schema changes — NO HITL  
    - supabase migration new     # Create new migration file — NO HITL
    - supabase db reset          # BLOCKED — requires Ariel approval (production data)
    - supabase functions deploy  # Edge functions — NO HITL
  migration_workflow:
    1: "supabase migration new <name>"
    2: "Write SQL in supabase/migrations/<timestamp>_<name>.sql"
    3: "supabase db push"
    4: "Verify via REST API or psql"
    5: "Commit migration file to repo"
  never_ask_ariel:
    - CREATE TABLE / ALTER TABLE (non-destructive)
    - CREATE INDEX / CREATE FUNCTION
    - INSERT/UPDATE to non-critical tables
    - RLS policies
  always_ask_ariel:
    - DROP TABLE / TRUNCATE on production tables
    - Schema changes to billing/payment tables
    - supabase db reset
```

### Context Window Rules
- **Context Brackets** (replaces 50% rule):
  - **FRESH (>70%):** Full file reads OK. Complex multi-step work OK. Parallel ops OK.
  - **MODERATE (40-70%):** Re-read STATE before decisions. Summaries over full files. Single-concern tasks.
  - **DEEP (20-40%):** Finish current task ONLY. Prepare session summary. No new complex work.
  - **CRITICAL (<20%):** Write session summary NOW. Update TODO.md. No new file reads. Exit.
- **NEVER /compact.** Worst of both worlds — loses working context but keeps stale/poisoned context. Always start fresh.
- **Sub-agents for heavy work.** Dispatch sub-agents (via Superpowers execute-plan) so main orchestrator context stays clean.
- **cli-anything harnesses:** Add context checkpoint between HARNESS.md phases. If context > 50% mid-pipeline, save state and restart.

### CC Status Line Config
```
Line 1: model | context% | session_cost | session_clock
Line 2: git_branch | git_worktree
```

## 3-Layer CLAUDE.md Hierarchy (Claude Architect Standard)
```yaml
layer_1_user: ~/.claude/CLAUDE.md  # personal prefs, not version-controlled
layer_2_project: ./CLAUDE.md       # THIS FILE — team rules, architecture, triggers
layer_3_path_rules: .claude/rules/ # pattern-matched, loaded ONLY when editing matching files
  deployed: [components(src/components/**), data(src/lib/**), deploy(.github/workflows/**)]
  principle: lean context window — rules load only when relevant
  enforcement: hooks for 100% reliability (finance/security), prompts for style/tone
```


## Loop Discipline (Mar 25, 2026)

### Evidence-Before-Claims (upgrades NEVER-LIE)
```yaml
# The evidence chain: Execute → Verify → Read output → Compare to spec → THEN claim.
# Breaking ANY link = false completion.
anti_rationalization:
  "Should work now":           "Run the verify command and read its output"
  "I already checked this":    "Check it again fresh — memory of checking ≠ verification"
  "It's close enough":         "Compare against the AC/spec word by word"
  "The test passes":           "Also compare against the spec — tests can be incomplete"
  "This is a minor deviation": "Log it explicitly — minor deviations compound into drift"
  "I'm confident it works":    "Run it and prove it — confidence without evidence is failure cause #1"
rules:
  - NEVER mark a task [x] in TODO.md without fresh verification evidence in same session
  - NEVER claim a DB count, %, or metric without running the actual query first
  - When wrong: say "I was wrong" — not "I misspoke" or "let me clarify"
```

### Scope Classification (pre-step to all tasks)
```yaml
# Before executing ANY task, classify scope FIRST:
scope_classification:
  quick_fix:
    signals: "Fits 1 sentence AND 1-2 files AND no architectural implications"
    ceremony: "No spec. Execute directly. Mark [x] with 1-line commit."
  standard:
    signals: "3-5 files OR design decision needed OR multiple components"
    ceremony: "Spec recommended. Full protocol. Session summary required."
  complex:
    signals: "6+ files OR architectural change OR multi-repo OR new patterns/deps"
    ceremony: "Spec MANDATORY (BRAINSTORM_PROTOCOL). Must split into sub-tasks."
# Classify BEFORE work starts. When uncertain → choose HIGHER ceremony.
```

### Boundaries Enforcement
```yaml
# Every spec/plan SHOULD include a boundaries section.
# When present, boundaries are HARD constraints, not suggestions.
boundaries:
  DO_NOT_CHANGE: "STOP and confirm before ANY modification to listed items"
  SCOPE_LIMITS: "Log to deferred issues if encountered, do not address"
# No boundaries in spec? → ask once at session start: "Any files I should avoid touching?"
# SUMMIT-dispatched work → treat spec as full scope, nothing beyond it.
```

### Session Summary Loop Closure
```yaml
# Every session summary MUST include (in addition to Status Board):
loop_closure:
  plan_vs_actual: "| Task | Planned | Actual | Deviation | — ALWAYS required"
  deviation_log: "What changed, why, downstream impact — required if any deviation"
  verification_evidence: "Command run → output observed → spec comparison — required if any task completed"
# The session summary IS the loop closure. No summary = orphaned loop.
# Evidence-Before-Claims applies: don't claim DONE without proof in the summary.
```


---

# GSTACK PATTERNS (Cherry-picked from garrytan/gstack, MIT License)
# Deployed: Mar 17, 2026 | Source: breverdbidder/gstack

## AskUserQuestion Format (MANDATORY for all human-facing questions)

When asking the user ANY question, ALWAYS follow this structure:

1. **Re-ground:** State the project, the current branch, and the current task. (1-2 sentences)
2. **ELI16:** Explain the problem in plain English a smart 16-year-old could follow. No function names, no internal jargon, no implementation details. Use concrete examples and analogies. Say what it DOES, not what it's called.
3. **Recommend:** `RECOMMENDATION: Choose [X] because [one-line reason]`
4. **Options:** Lettered options: `A) ... B) ... C) ...`

Assume the user hasn't looked at this window in 20 minutes and doesn't have the code open. If you'd need to read the source to understand your own explanation, it's too complex.

## Review Modes (use when reviewing plans or PRs)

### CEO Mode (Product Review)
Use when: Strategic decisions, new features, product direction, architecture pivots.
Trigger: `/plan-ceo` or when reviewing plans that change product behavior.

Three sub-modes — ask user to select ONE, then COMMIT to it fully:
- **SCOPE EXPANSION:** Dream big. Ask "what's the 10x version for 2x effort?" Find the 10-star product. Push scope UP.
- **HOLD SCOPE:** Maximum rigor. Scope is accepted. Make it bulletproof — catch every failure mode, map every error path.
- **SCOPE REDUCTION:** Be a surgeon. Find the minimum viable version. Cut everything else. Ruthless.

**Critical rule:** Once mode is selected, DO NOT silently drift. If EXPANSION selected, don't argue for less. If REDUCTION selected, don't sneak scope back in.

CEO Mode Prime Directives:
1. Zero silent failures — every failure mode must be visible
2. Every error has a name — don't say "handle errors", name the specific exception
3. Data flows have shadow paths — nil input, empty input, upstream error. Trace all four.
4. Diagrams are mandatory — ASCII art for every new data flow, state machine, pipeline
5. Everything deferred must be written down — TODOS.md or it doesn't exist
6. Optimize for 6-month future, not just today
7. You have permission to say "scrap it and do this instead"

### Eng Mode (Technical Review)
Use when: Code review, PR review, technical implementation plans.
Trigger: `/plan-eng` or when reviewing technical changes.

Three sub-modes — ask user to select ONE:
- **SCOPE REDUCTION:** Plan is overbuilt. Propose minimal version, then review that.
- **BIG CHANGE:** Work through interactively, one section at a time (Architecture → Code Quality → Tests → Performance) with at most 8 top issues per section.
- **SMALL CHANGE:** Compressed review — scope check + one combined pass. Pick the single most important issue per section. One question round at the end.

Eng Mode walks through 4 sections in order:
1. **Architecture:** System design, dependencies, coupling, scaling, security, failure scenarios
2. **Code Quality:** DRY violations, error handling, edge cases, tech debt, over/under-engineering
3. **Tests:** Diagram all new UX/data flows/codepaths. For each, verify a test exists. Check eval.json assertions.
4. **Performance:** N+1 queries, unbounded selects, missing indexes, unnecessary recomputation

**STOP after each section.** Present issues one at a time with options and recommendations. Do NOT batch multiple issues. Only proceed after all issues in current section are resolved.

## Fix-First Review (MANDATORY for all PR reviews)

When reviewing code changes, apply the Fix-First heuristic from `docs/GSTACK_REVIEW_CHECKLIST.md`:
1. Read the full diff FIRST
2. Run Pass 1 (CRITICAL): SQL safety, race conditions, LLM trust boundary, enum completeness
3. Run Pass 2 (INFORMATIONAL): Side effects, magic numbers, dead code, test gaps, crypto, types
4. For each finding: AUTO-FIX if mechanical, ASK if ambiguous (see checklist for classification)
5. Output format: `Pre-Landing Review: N issues (X critical, Y informational)` with AUTO-FIXED and NEEDS INPUT sections


## visual-explainer Skill
- Source: ~/.claude/skills/visual-explainer/plugins/visual-explainer/SKILL.md
- Read SKILL.md + references/ before generating any HTML diagram
- Output to ~/.agent/diagrams/ and open in browser
- Commands: /diff-review, /plan-review, /project-recap, /generate-web-diagram, /generate-slides, /fact-check
- Brand preset: templates/biddeed-brand-preset.html (Navy #1E3A5F + Orange #F59E0B)
- Auto-trigger: Any table with 4+ rows or 3+ columns renders as HTML instead of ASCII

## gh-aw Integration (Mar 23, 2026)

### Active Agentic Workflows
- `doc-sync-agent.md` — Auto-updates docs on code push (auto-merge)
- `issue-triage-agent.md` — Labels new issues P0-P3 + type
- `ci-failure-agent.md` — Diagnoses CI failures, opens fix issues
- `pr-gate-agent.md` — Classifies PR risk: LOW/MEDIUM/HIGH
- `dep-guardian-agent.md` — Weekly dependency updates (Monday 3AM EST)
- `changelog-agent.md` — Auto-changelog on release

### Merge Strategy
- LOW risk: auto-merge (docs, deps patch, style, tests)
- MEDIUM risk: merge after CI green
- HIGH risk: needs-human-review label → Ariel reviews

### Engine
All workflows use `engine: claude` with ANTHROPIC_API_KEY secret.


## AUTODREAM (Memory 2.0)

Status: PENDING_ACTIVATION

```yaml
autodream:
  what: Background sub-agent that consolidates/prunes memory .md files
  layers:
    L1: Normal sessions (code, debug, refactor)
    L2: AutoMemory (records decisions/patterns to memory.md)
    L3: AutoDream (compacts/prunes L2 files periodically)
  activation: /memory toggle AutoDream ON then /dream to invoke
  cadence: ~12hr or ~300 sessions (unconfirmed)
  scope: Only .md memory files, NEVER code/scripts
  duration: 8-10 min typical
  rules:
    - Enable per-repo once available
    - Do NOT disable AutoMemory (L2 feeds L3)
    - Verify pruned files after first dream
    - If AutoDream conflicts with CLAUDE.md manual sections, CLAUDE.md wins
```

## HONESTY PROTOCOL (Mar 28 2026, PERMANENT)

```yaml
# Every claim MUST carry a tag:
tags:
  VERIFIED: proof attached (curl output, DB query, test result, commit hash)
  UNTESTED: not tested yet — ZERO penalty, always acceptable
  INFERRED: guessing from context — must include 1-sentence evidence

rules:
  - BLANK > WRONG: saying "I don't know" is always better than guessing
  - 3x PENALTY: wrong VERIFIED = logged to honesty_violations table
  - SHOW SOURCE: every claim labeled EXTRACTED or INFERRED with evidence
  - NEVER score untested systems with numeric ratings
  - NEVER declare PRDs/roadmaps/guides as "handled" — execution is separate from planning
  - NEVER mark tasks DONE without curl/DB/test proof
  - AUTO-VERIFY: if tagged UNTESTED and tools exist to test NOW → test immediately, don't ask

self_check_before_any_claim:
  1: "Did I actually test/run/query this?"
  2: "Can I show proof?"
  3: "Where did this number come from?"
  4: "If I'm wrong, what's the cost?"
  5: "Is UNTESTED acceptable? → ALWAYS YES"

anti_patterns:
  - Scoring capabilities without running them
  - Rating ourselves favorably on untested features
  - Creating plans about testing instead of testing
  - Dismissing gaps as "least relevant" without evidence
```


## SEARCH-FIRST MANDATE (PERMANENT — Apr 1 2026)

BEFORE any architecture, design, or component work:
1. Search GitHub for mature, tested repositories solving the same problem
2. Run REPOEVAL: security + value + stability + integration + cost  
3. ADOPT (score>=80) -> install and compose, build only the delta
4. EVAL (60-79) -> test 1 week before committing
5. REJECT (<40) -> build custom

NEVER build from scratch what already exists tested and verified.
Applies: UI (shadcn/ui), frameworks, pipelines, auth, payments, charts, maps.
