import { defineCloudflareConfig } from "@opennextjs/cloudflare"

// zonewise-web uses time-based ISR (export const revalidate = N) on several routes.
// The preferred config is the R2-backed incremental cache, but R2 is not enabled on the
// Cloudflare account (API error 10042, 2026-09-05) and Vercel had already disabled the
// production deployment, so this ships with OpenNext's default (no persistent incremental
// cache): those routes render dynamically on every request. Behavior is correct, just
// uncached. Restore when R2 is enabled:
//   import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache"
//   export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache })
// and re-add the NEXT_INC_CACHE_R2_BUCKET binding in wrangler.production.jsonc.
export default defineCloudflareConfig({})
