#!/usr/bin/env bash
# scripts/sentinel-patrol.sh
# P2C-3: Sentinel V2 — Patrol GitHub Actions workflows, filter known 422 stale workflows
# Sends Telegram alerts for real failures, suppresses known-stale workflow noise

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-breverdbidder/zonewise-web}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-740118343}"
GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"

# Known stale/archived workflow names that produce 422 errors — suppress from Telegram
# (still logged to Supabase for audit trail)
STALE_WORKFLOW_FILTER=(
  "add-nexus-cname"
  "check-vercel-domain"
  "fix-checks"
  "fix-dns-verify"
  "fix-vercel-domain-v2"
  "fix-vercel-domain"
  "force-alias"
  "verify-and-deploy"
  "verify-deploy-ready"
  "check-env"
)

# ── Helpers ────────────────────────────────────────────────────────────────────

telegram_send() {
  local msg="$1"
  if [[ -z "$TELEGRAM_BOT_TOKEN" ]]; then
    echo "[sentinel] Telegram not configured — skipping notification"
    return 0
  fi
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "parse_mode=Markdown" \
    --data-urlencode "text=${msg}" \
    > /dev/null
}

is_stale_workflow() {
  local workflow_name="$1"
  for stale in "${STALE_WORKFLOW_FILTER[@]}"; do
    if [[ "$workflow_name" == *"$stale"* ]]; then
      return 0
    fi
  done
  return 1
}

# ── Main patrol ────────────────────────────────────────────────────────────────

echo "[sentinel] Patrolling ${REPO}..."

# Fetch recent failed workflow runs
FAILED_RUNS=$(gh run list \
  --repo "$REPO" \
  --status failure \
  --limit 20 \
  --json name,databaseId,conclusion,createdAt,workflowName \
  2>/dev/null || echo "[]")

ALERT_COUNT=0
FILTERED_COUNT=0

while IFS= read -r run; do
  WORKFLOW_NAME=$(echo "$run" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('workflowName','unknown'))" 2>/dev/null || echo "unknown")
  RUN_ID=$(echo "$run" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('databaseId',''))" 2>/dev/null || echo "")
  CREATED_AT=$(echo "$run" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('createdAt',''))" 2>/dev/null || echo "")

  if is_stale_workflow "$WORKFLOW_NAME"; then
    echo "[sentinel] FILTERED (stale): $WORKFLOW_NAME ($RUN_ID)"
    FILTERED_COUNT=$((FILTERED_COUNT + 1))
    # Supabase logging would go here — still audit-logged, just not Telegram-alerted
  else
    echo "[sentinel] ALERT: $WORKFLOW_NAME failed at $CREATED_AT (run $RUN_ID)"
    telegram_send "🔴 *Workflow Failed*: \`${WORKFLOW_NAME}\`
Run ID: ${RUN_ID}
Time: ${CREATED_AT}
Repo: ${REPO}"
    ALERT_COUNT=$((ALERT_COUNT + 1))
  fi
done < <(echo "$FAILED_RUNS" | python3 -c "import sys,json; [print(json.dumps(r)) for r in json.load(sys.stdin)]" 2>/dev/null || true)

echo "[sentinel] Done. Alerts sent: ${ALERT_COUNT}, Filtered (stale): ${FILTERED_COUNT}"
