#!/bin/bash
# scripts/oauth-health-check.sh
# P2C-1: Commander — OAuth token health check
# Run before SUMMIT dispatch + daily via cron

set -euo pipefail

WARN_DAYS=7
TELEGRAM_BOT="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT="${TELEGRAM_CHAT_ID:-}"

send_telegram() {
  local level="$1" msg="$2"
  [ -z "$TELEGRAM_BOT" ] && { echo "$msg"; return; }
  curl -sf -X POST "https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage" \
    -d chat_id="${TELEGRAM_CHAT}" \
    -d parse_mode="Markdown" \
    -d text="${level} ${msg}" > /dev/null 2>&1 || true
}

# Decode token
if [ -z "${CLAUDE_OAUTH_B64:-}" ]; then
  send_telegram "🚨" "*OAUTH CRITICAL*: CLAUDE_OAUTH_B64 secret is empty"
  exit 1
fi

TOKEN=$(echo "$CLAUDE_OAUTH_B64" | base64 -d 2>/dev/null || true)

if [ -z "$TOKEN" ]; then
  send_telegram "🚨" "*OAUTH CRITICAL*: Failed to decode CLAUDE_OAUTH_B64"
  exit 1
fi

# Extract expiry if JWT format (check for exp claim)
# Token may be opaque — in that case we can only check if it's non-empty
if echo "$TOKEN" | grep -q '\.'; then
  # Looks like JWT — try to decode payload
  PAYLOAD=$(echo "$TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null || true)
  
  if echo "$PAYLOAD" | jq -e '.exp' > /dev/null 2>&1; then
    EXP=$(echo "$PAYLOAD" | jq -r '.exp')
    NOW=$(date +%s)
    DAYS_LEFT=$(( (EXP - NOW) / 86400 ))
    
    if [ "$DAYS_LEFT" -le 0 ]; then
      send_telegram "🚨" "*OAUTH EXPIRED*: Token expired ${DAYS_LEFT#-} days ago. SUMMIT dispatch BLOCKED."
      exit 1
    elif [ "$DAYS_LEFT" -le "$WARN_DAYS" ]; then
      send_telegram "⚠️" "*OAUTH WARNING*: Token expires in ${DAYS_LEFT} days. Schedule refresh."
      exit 0
    else
      echo "✅ OAuth token healthy: ${DAYS_LEFT} days remaining"
      exit 0
    fi
  fi
fi

# Opaque token — can only verify non-empty
echo "✅ OAuth token present (opaque — cannot check expiry)"
exit 0
