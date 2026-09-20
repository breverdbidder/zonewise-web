# Supabase legacy service-role cutover

This is a stop-on-failure runbook. It never requires revealing a key in logs or source.

## Protected keys

- Never delete the publishable `default` key.
- `service_role_new` is the replacement secret.
- Do not disable the legacy `service_role` JWT until every gate below passes.

## Consumer inventory

Prove each category on the replacement, not merely configured:

1. GitHub Actions secrets in `zonewise-web`, `cli-anything-biddeed`, and `brevard-bidder-scraper`.
2. Cloudflare Worker `zonewise-web-production` runtime secret.
3. Supabase Vault entries named `service_role_key` and `supabase_service_role_key`.
4. Supabase Edge Functions and database webhooks/cron jobs that carry an API key.
5. Dell scripts, scheduled scrapers, and local `.env` files outside Git.

Record only secret names, key type, scope, update time, and probe result. Never record values or reversible prefixes.

## Cutover sequence

1. Save `service_role_new` in the encrypted Vault as a separate entry. Preserve the old entry.
2. Update GitHub's masked `SUPABASE_SERVICE_ROLE_KEY` secret in each active consumer repository.
3. Run `Supabase legacy-key cutover preflight`; require both jobs green.
4. Merge and deploy the four-route hardening PR.
5. Verify Cloudflare deployment and live API smoke checks.
6. Update Supabase Vault, Edge Function secrets, database webhooks/cron, and Dell runtime secrets.
7. Probe every consumer. Any missing, 401, 403, or unexpected result stops the cutover.
8. Capture the Legacy tab with values hidden and confirm the disable target by name/type/status.
9. Obtain explicit owner approval for the exact legacy-disable action.
10. Disable only the legacy `service_role` key. Do not rotate the JWT secret as part of this cutover.
11. Repeat all probes and watch errors/auth failures. Keep a rollback window.

## Rollback

Before legacy disable, rollback means restore the affected consumer to the last known-good masked secret. After disable, if a missed consumer fails, re-enable the same legacy key only if Supabase offers a reversible toggle and the owner approved that fallback. Never create another key during incident recovery without a new inventory.
