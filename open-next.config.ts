import { defineCloudflareConfig } from "@opennextjs/cloudflare"
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache"

// zonewise-web uses real time-based ISR (export const revalidate = N) across
// several routes (app/conquest, app/(marketing)/foreclosures/[county],
// app/api/parcels/[parcelId], app/api/coverage, etc). The OpenNext no-op
// cache would silently make every one of those routes behave as fully
// dynamic (re-fetched on every request) instead of ISR-cached, which is a
// real behavior change vs. Vercel. No revalidateTag/revalidatePath usage was
// found in the app, so the tag cache + queue overrides are not needed here
// -- just the R2-backed incremental cache to preserve ISR semantics.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
})
