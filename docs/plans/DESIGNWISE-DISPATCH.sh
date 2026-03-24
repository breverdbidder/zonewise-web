#!/bin/bash
# SUMMIT DISPATCH: DesignWise Squad Remediation
# Entry point for Claude Code autonomous execution
# Repo: zonewise-web
# Date: 2026-03-23
# Target: All 14 agents → 8.5+

set -euo pipefail

REPO="breverdbidder/zonewise-web"
BRANCH="designwise-remediation"
DISPATCH_DIR="$(dirname "$0")"

echo "🚀 DesignWise Squad Remediation — SUMMIT Dispatch"
echo "=================================================="
echo ""

# ─── PHASE GATE ───
# Claude Code: Execute phases in order.
# Within each phase, parallel streams can run concurrently
# (different files, no merge conflicts).
# After each phase: npm run build must pass.

echo "📋 Execution Plan:"
echo "  P0: Quick Wins         (~2h)  — PARALLEL"
echo "  P1: Unblock Deps       (~2d)  — PARALLEL STREAMS"
echo "  P2A: A11y + CodeQual   (~1w)  — SEQUENTIAL within stream"
echo "  P2B: Support + Deploy  (~1w)  — PARALLEL with P2A"
echo "  P2C: Infra             (~5h)  — PARALLEL with P2A/P2B"
echo "  P3: Full Capability    (~2-3w)— AFTER P2 complete"
echo ""

# ─── P0: QUICK WINS ───
echo "⚡ P0: Quick Wins (ALL PARALLEL — different files)"
echo ""
echo "  P0-1: Copy SkipToContent.tsx → src/components/"
echo "        Update src/app/layout.tsx: import + render FIRST"
echo "        Add id='main-content' to main content div"
echo ""
echo "  P0-2: npx lighthouse https://zonewise.ai --output=json --chrome-flags='--headless --no-sandbox'"
echo "        Store scores in Supabase designwise_scores table"
echo ""
echo "  P0-3: npm install @vercel/analytics @vercel/speed-insights"
echo "        Copy VercelAnalytics.tsx → src/components/"
echo "        Add <VercelAnalytics /> to layout.tsx body"
echo ""
echo "  P0-4: Create src/app/sitemap.ts + src/app/robots.ts"
echo "        Verify public/sitemap.xml is valid"
echo ""
echo "  ✅ GATE: npm run build passes"
echo ""

# ─── P1: UNBLOCK DEPENDENCIES ───
echo "🔗 P1: Unblock Dependencies (PARALLEL STREAMS)"
echo ""
echo "  STREAM D (Analytics):"
echo "    P1-1: npm install posthog-js"
echo "           Copy posthog.ts → src/lib/"
echo "           Copy PostHogProvider.tsx → src/components/"
echo "           Wrap layout.tsx children in PostHogProvider"
echo "    P1-2: Configure PostHog funnel: landing→explorer→pricing→signup"
echo ""
echo "  STREAM A (Code Quality):"
echo "    P1-3: Remove ignoreBuildErrors:true from next.config"
echo "           Run tsc --noEmit, fix ALL errors"
echo "           npm run build must pass clean"
echo ""
echo "  STREAM B (Content):"
echo "    P1-4: Audit '298 KPIs' claim in Hero component"
echo "           Replace with live Supabase count or remove"
echo ""
echo "  ✅ GATE: npm run build + tsc --noEmit both pass"
echo ""

# ─── IMPLEMENTATION FILES ───
echo "📁 Pre-built Implementation Files:"
echo ""
find "$DISPATCH_DIR" -name "*.tsx" -o -name "*.ts" -o -name "*.sh" -o -name "*.yml" | sort | while read f; do
  echo "  $(echo "$f" | sed "s|$DISPATCH_DIR/||")"
done
echo ""

# ─── HITL BLOCKERS ───
echo "⛔ ARIEL HITL Required (< 5 min):"
echo "  1. Create PostHog project → provide NEXT_PUBLIC_POSTHOG_KEY"
echo "  2. Submit sitemap to Google Search Console"
echo "  3. Create Crisp account → provide website ID"
echo "  4. Reach out to 3 beta users for testimonials"
echo ""

echo "🎯 Target: Composite score 6.2 → 8.5+ across all agents"
echo "📊 See TODO.md for checkbox tracking"
echo "🔥 FIRE."
