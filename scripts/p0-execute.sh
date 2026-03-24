#!/bin/bash
# scripts/p0-execute.sh
# DesignWise P0 Quick Wins — Claude Code execution
# Run after SkipToContent + layout.tsx are deployed

set -euo pipefail

echo "🚀 DesignWise P0 — Quick Wins Execution"
echo "========================================="

# ─── P0-1: VERIFY SkipToContent deployed ───
echo ""
echo "✅ P0-1: SkipToContent"
if [ -f "components/SkipToContent.tsx" ]; then
  echo "   Component exists"
  grep -q "SkipToContent" app/layout.tsx && echo "   Imported in layout.tsx" || echo "   ⚠️ NOT imported in layout.tsx"
  grep -q "main-content" app/layout.tsx && echo "   id='main-content' present" || echo "   ⚠️ id='main-content' missing"
else
  echo "   ❌ Component missing"
fi

# ─── P0-2: Lighthouse audit ───
echo ""
echo "📊 P0-2: Lighthouse Audit"
if command -v lighthouse &> /dev/null || npx lighthouse --version &> /dev/null 2>&1; then
  echo "   Running Lighthouse..."
  npx lighthouse https://zonewise.ai \
    --output=json \
    --output-path=./lighthouse-report.json \
    --chrome-flags="--headless --no-sandbox" \
    --only-categories=accessibility,seo,performance,best-practices \
    2>/dev/null || echo "   ⚠️ Lighthouse failed (may need Chrome)"
  
  if [ -f lighthouse-report.json ]; then
    echo "   Scores:"
    node -e "
      const r = require('./lighthouse-report.json');
      const cats = r.categories;
      console.log('   Performance:', Math.round(cats.performance.score * 100));
      console.log('   Accessibility:', Math.round(cats.accessibility.score * 100));
      console.log('   SEO:', Math.round(cats.seo.score * 100));
      console.log('   Best Practices:', Math.round(cats['best-practices'].score * 100));
    "
  fi
else
  echo "   ⚠️ Lighthouse not available — run on Hetzner"
fi

# ─── P0-3: Vercel Analytics ───
echo ""
echo "📈 P0-3: Vercel Analytics"

# Install packages
npm install @vercel/analytics @vercel/speed-insights 2>/dev/null
echo "   Packages installed"

# Wire into layout.tsx if not already
if ! grep -q "VercelAnalytics" app/layout.tsx; then
  # Add import after SkipToContent import
  sed -i "/import SkipToContent/a import VercelAnalytics from '@/components/VercelAnalytics'" app/layout.tsx
  # Add component after <SkipToContent />
  sed -i "s|<SkipToContent />|<SkipToContent />\n        <VercelAnalytics />|" app/layout.tsx
  echo "   Wired into layout.tsx"
else
  echo "   Already wired"
fi

# ─── P0-4: SEO Verification ───
echo ""
echo "🔍 P0-4: SEO Verification"
[ -f "app/sitemap.ts" ] && echo "   ✅ app/sitemap.ts exists" || echo "   ❌ sitemap.ts missing"
[ -f "public/robots.txt" ] && echo "   ✅ public/robots.txt exists" || echo "   ❌ robots.txt missing"
grep -q "sitemap.xml" public/robots.txt && echo "   ✅ robots.txt references sitemap" || echo "   ⚠️ robots.txt missing sitemap ref"

# ─── BUILD GATE ───
echo ""
echo "🏗️ Build Gate"
npm run build 2>&1 | tail -5
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
  echo "   ✅ Build passed — P0 COMPLETE"
else
  echo "   ❌ Build failed — check errors above"
  exit 1
fi

echo ""
echo "✅ P0 Complete. Next: P1 (Unblock Dependencies)"
echo "   P1-1: npm install posthog-js + wire PostHogProvider"
echo "   P1-3: Remove ignoreBuildErrors=true from next.config.mjs"
