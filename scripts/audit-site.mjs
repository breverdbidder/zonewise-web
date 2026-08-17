#!/usr/bin/env node
/**
 * ZoneWise.AI — full-sitemap responsive audit harness
 * ---------------------------------------------------
 * Why this exists: on 2026-08-15 a landing-page rebuild was verified at 1400px
 * desktop only. Four of seven /feasibility tabs were badly broken on mobile
 * (content squeezed into 19-76px columns) and the dashboard shell was not
 * scrollable at all on touch devices. Both shipped to production unnoticed.
 *
 * This harness makes that class of miss non-silent. It walks every route AND
 * every in-page tab, at every breakpoint, and fails loudly on:
 *   - horizontal overflow
 *   - unscrollable overflowing containers   (the "frozen scroll" bug)
 *   - text squeezed into unusably narrow columns (fixed-width flex sidebars)
 *   - sub-12px body text
 *   - undersized tap targets
 *   - console/page errors
 *   - banned positioning terms (SSOT drift)
 *
 * Usage:
 *   node scripts/audit-site.mjs                     # audit production
 *   node scripts/audit-site.mjs --base=http://localhost:3000
 *   node scripts/audit-site.mjs --shots             # also write screenshots
 *   node scripts/audit-site.mjs --json=report.json
 *   node scripts/audit-site.mjs --viewport=Desktop  # one viewport (comma list ok)
 *   node scripts/audit-site.mjs --routes=explorer,pricing
 *
 * A full 4-viewport run takes >4 min. --viewport and --routes exist so a run can
 * be time-boxed across separate invocations; an unmatched filter value is a hard
 * error, never a silent full run.
 *
 * Exit code is non-zero when any BLOCKER is found, so CI can gate on it.
 */

import { chromium, devices } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

// ─── configuration ────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)

const BASE = args.base || 'https://zonewise.ai'

// ── cross-page numeric consistency ───────────────────────────────────────────
// Every page was internally consistent, so a CROSS-page contradiction stayed
// invisible: /explorer claimed "36 FL Counties · 4M+ parcels" for months while
// the homepage claimed 67 / 10.8M and a visitor watched our coverage halve on
// one click. Coverage numbers now come from the county SSOT via /api/stats, so
// every page's headline claim can be checked against a single truth.
const PARCEL_CLAIM = /(\d+(?:\.\d+)?)\s*M\+?\s*parcels/gi
const COUNTY_CLAIM = /\b(\d{1,3})[\s-](?:FL\s+|Florida\s+)?count(?:y|ies)\b/gi

let SSOT = null

async function loadSsot(base) {
  try {
    const res = await fetch(`${base}/api/stats`)
    if (!res.ok) return null
    const d = await res.json()
    const counties = Number(d.counties)
    const parcels = Number(d.parcels_total ?? d.fl_parcels)
    // /api/stats degrades rather than failing; do not gate CI on a bad payload.
    if (counties > 0 && parcels > 1_000_000) return { counties, parcelsM: parcels / 1_000_000 }
  } catch {}
  return null
}

function checkStatClaims(text, label, results) {
  if (!SSOT) return
  for (const m of text.matchAll(PARCEL_CLAIM)) {
    const claimed = parseFloat(m[1])
    // 0.15M tolerance absorbs honest rounding (10.5 vs 10.51), not drift.
    if (Math.abs(claimed - SSOT.parcelsM) > 0.15) {
      results.push({ view: label, severity: 'BLOCKER', kind: 'stat-drift',
        detail: `claims ${claimed}M parcels, SSOT says ${SSOT.parcelsM.toFixed(1)}M` })
    }
  }
  for (const m of text.matchAll(COUNTY_CLAIM)) {
    const claimed = parseInt(m[1], 10)
    if (claimed !== SSOT.counties) {
      results.push({ view: label, severity: 'BLOCKER', kind: 'stat-drift',
        detail: `claims ${claimed} counties, SSOT says ${SSOT.counties}` })
    }
  }
}
const SHOTS = Boolean(args.shots)
const SHOT_DIR = args.shotDir || './audit-shots'

// Reuse a Clerk session minted by scripts/auth-state.mjs. Without one, every
// auth-gated route quietly serves the sign-in page and the harness audits that
// instead of the app. A missing file when --auth was explicitly asked for is a
// hard error, never a silent unauthenticated run.
const AUTH_FILE = args.auth === true ? '.auth/state.json' : args.auth || null
const AUTH_STATE = AUTH_FILE && fs.existsSync(AUTH_FILE) ? AUTH_FILE : null
if (AUTH_FILE && !AUTH_STATE) {
  console.error(`audit: --auth=${AUTH_FILE} given but that file does not exist`)
  process.exit(2)
}

/** Public + app routes. Add new routes here as they ship. */
const ROUTES = [
  { path: '/', name: 'landing', public: true },
  { path: '/pricing', name: 'pricing', public: true },
  { path: '/explorer', name: 'explorer' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/feasibility', name: 'feasibility', authGated: true, tabs: [
      'Site', 'Market', 'Lodging', 'Comps', 'Capacity', 'Develop', 'Generate',
    ] },
  // AuctionRadar. Added Aug 17 2026: this route was never in the audit list
  // (it was hidden from nav on Aug 15 and restored Aug 17), which is exactly
  // how a mobile toolbar-overlap bug reached production unseen.
  { path: '/auctions', name: 'auctions' },
  { path: '/report', name: 'report' },
  { path: '/docs', name: 'docs', public: true },
]

const VIEWPORTS = [
  { name: 'iPhone SE', device: devices['iPhone SE'] },   // 320px — tightest
  { name: 'Pixel 5', device: devices['Pixel 5'] },       // 393px — most common
  { name: 'iPad Mini', device: devices['iPad Mini'] },   // 768px — tablet
  { name: 'Desktop', device: { viewport: { width: 1440, height: 900 } } },
]

/** Comma-separated, case-insensitive, matched on `name`. Unmatched = hard error. */
function selectByName(all, raw, kind) {
  if (!raw || raw === true) return all
  const wanted = String(raw).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  const picked = all.filter((x) => wanted.includes(x.name.toLowerCase()))
  const missing = wanted.filter((w) => !all.some((x) => x.name.toLowerCase() === w))
  if (missing.length) {
    console.error(
      `Unknown ${kind}: ${missing.join(', ')}\nAvailable: ${all.map((x) => x.name).join(', ')}`
    )
    process.exit(2)
  }
  return picked
}

const ACTIVE_VIEWPORTS = selectByName(VIEWPORTS, args.viewport, 'viewport')
const ACTIVE_ROUTES = selectByName(ROUTES, args.routes, 'route')

/**
 * SSOT positioning guard. ZoneWise.AI sells zoning intelligence + feasibility.
 * Auction / foreclosure / tax-deed content belongs on BidDeed.AI, and Brevard
 * is evidence (case-study provenance) not positioning — so it is allowed only
 * inside an explicit provenance string.
 */
const BANNED_TERMS = [
  // These three are SSOT positioning rules for the ZoneWise surface, but
  // AuctionRadar (/auctions) IS the distressed-inventory sourcing view - it
  // legitimately says all three. Scoped exemption, not a silenced check.
  { term: 'foreclosure', allowIn: ['/auctions'] },
  { term: 'tax deed', allowIn: ['/auctions'] },
  { term: 'auction', allowIn: ['/auctions'] },
  { term: '10 years', allowIn: [] },
  { term: '10+ years', allowIn: [] },
  // Standing rule from Ariel, Aug 17 2026: this vendor is a data source we pay
  // for, not a name we put in front of customers, and it must never appear on
  // any of our sites. These entries are the regression net so a future card,
  // comparison table or KPI blurb cannot quietly reintroduce it.
  { term: 'propertyonion', allowIn: [] },
  { term: 'property onion', allowIn: [] },
]
// Two legitimate reasons a line can say "brevard" without it being positioning
// drift: (1) case-study provenance framing, (2) documenting a real API default —
// lib/explorer/tracking.ts genuinely defaults county to 'brevard' server-side,
// so /docs correctly describing that behavior is accurate, not stale copy.
const BREVARD_ALLOWED_CONTEXTS = [
  'Recorded, Brevard County Clerk',
  'defaults to "brevard"',
  '"county": "brevard"',
]

// ─── in-page probes (run inside the browser) ──────────────────────────────────

const PROBE = () => {
  const vw = document.documentElement.clientWidth
  const issues = []

  // 1. horizontal overflow — ignore intentionally clipped decorative layers
  if (document.documentElement.scrollWidth > vw + 2) {
    issues.push({
      severity: 'BLOCKER',
      kind: 'horizontal-overflow',
      detail: `scrollWidth ${document.documentElement.scrollWidth} > viewport ${vw}`,
    })
  }

  // 2. unscrollable overflowing container — the "frozen scroll" bug
  document.querySelectorAll('*').forEach((el) => {
    const s = getComputedStyle(el)
    const overflows = el.scrollHeight > el.clientHeight + 8
    const locked = s.overflowY === 'hidden' || s.overflowY === 'clip'
    if (overflows && locked && el.clientHeight > 200) {
      const clipped = el.scrollHeight - el.clientHeight
      issues.push({
        severity: 'BLOCKER',
        kind: 'unscrollable-content',
        detail: `${el.tagName}.${String(el.className).slice(0, 60)} clips ${clipped}px (overflowY:${s.overflowY})`,
      })
    }
  })

  // 3. squeezed text column — fixed-width flex sidebar starving the main column
  const squeezed = []
  document.querySelectorAll('p,div,li,span,td').forEach((el) => {
    const r = el.getBoundingClientRect()
    const txt = (el.textContent || '').trim()
    if (r.width > 0 && r.width < 110 && txt.length > 40 && r.height > 120) {
      squeezed.push(`w=${Math.round(r.width)}px h=${Math.round(r.height)}px "${txt.slice(0, 40)}"`)
    }
  })
  ;[...new Set(squeezed)].slice(0, 5).forEach((d) =>
    issues.push({ severity: 'BLOCKER', kind: 'squeezed-column', detail: d })
  )

  // 4. sub-12px body text (labels/eyebrows excluded via length heuristic)
  const small = new Set()
  document.querySelectorAll('p,li').forEach((el) => {
    if (el.children.length === 0 && el.textContent.trim().length > 25) {
      const fs = parseFloat(getComputedStyle(el).fontSize)
      if (fs && fs < 12) small.add(`${Math.round(fs)}px "${el.textContent.trim().slice(0, 35)}"`)
    }
  })
  ;[...small].slice(0, 5).forEach((d) =>
    issues.push({ severity: 'WARN', kind: 'small-text', detail: d })
  )

  // 5. tap targets (only when a touch viewport)
  //
  // Two bands, because they are not the same finding:
  //   tap-target-aa-fail  <24px — fails WCAG 2.2 AA (2.5.8). Real defect, fix it.
  //   tap-target-aaa      <44px — misses WCAG 2.1 AAA (2.5.5) / Apple HIG.
  //                               Comfort issue, not a conformance failure.
  //
  // Two classes are excluded entirely, because "fix it" would be the wrong call:
  //   a) vendor widget chrome we do not author — Mapbox GL's own map controls
  //      and Clerk's hosted sign-in UI. Overriding their internals is a
  //      maintenance trap; that sizing is theirs to ship.
  //   b) inline links inside running prose. WCAG 2.5.8 explicitly exempts a
  //      target in a sentence; padding one to 44px breaks the line box.
  if (window.matchMedia('(pointer: coarse)').matches) {
    const VENDOR = '.mapboxgl-ctrl, [class^="cl-"], [class*=" cl-"], [data-clerk-element]'
    const isInlineProse = (el) => {
      if (el.tagName !== 'A') return false
      const p = el.parentElement
      if (!p || !/^(P|LI|TD|BLOCKQUOTE|H[1-6])$/.test(p.tagName)) return false
      if (getComputedStyle(el).display !== 'inline') return false
      const own = (el.textContent || '').trim().length
      return (p.textContent || '').trim().length > own + 10
    }
    const aa = new Set()
    const aaa = new Set()
    document.querySelectorAll('a,button,[role="button"]').forEach((el) => {
      if (el.closest(VENDOR) || isInlineProse(el)) return
      const r = el.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0 || r.height >= 44) return
      const d = `${Math.round(r.height)}px "${(el.textContent || '').trim().slice(0, 24)}"`
      ;(r.height < 24 ? aa : aaa).add(d)
    })
    ;[...aa].slice(0, 6).forEach((d) =>
      issues.push({ severity: 'WARN', kind: 'tap-target-aa-fail', detail: d })
    )
    ;[...aaa].slice(0, 6).forEach((d) =>
      issues.push({ severity: 'WARN', kind: 'tap-target-aaa', detail: d })
    )
  }

  // 8. content spilling out of a non-scrolling container ("clipped spill")
  //
  // Why this check exists: the Aug 17 /auctions toolbar overlap was INVISIBLE
  // to every check above it. document.scrollWidth stayed exactly at the
  // viewport width because the app shell is overflow-x:hidden and silently
  // absorbed 101px of spill, so check #1 could never fire. The measurable
  // signature is a container whose own scrollWidth exceeds its clientWidth
  // while its overflow-x is `visible` - content leaking sideways into its
  // neighbours instead of scrolling or being clipped.
  //
  // Validated against live production before shipping: it reports 134px on the
  // regressed toolbar naming .fc-header-toolbar, and 0 on the fixed one, with
  // no false positives across /, /pricing, /docs, /explorer, /dashboard,
  // /report and /auctions at 320px and 393px.
  //
  // WARN, never BLOCKER, deliberately. A marquee IS legitimately wider than its
  // frame (the homepage has two, ~2750px by design) and the exemption below
  // cannot be certain it catches every such case. A check this heuristic must
  // stay visible without gating CI or firing a Telegram alert at Ariel.
  {
    const spills = []
    document.querySelectorAll('*').forEach((el) => {
      const s = getComputedStyle(el)
      if (s.overflowX !== 'visible') return
      if (s.position === 'absolute' || s.position === 'fixed') return
      // Intentionally translated content: marquees/tickers.
      if (s.animationName !== 'none' || /transform/.test(s.willChange)) return
      const spill = el.scrollWidth - el.clientWidth
      if (spill <= 16) return
      const r = el.getBoundingClientRect()
      if (r.width < 60 || r.height < 16) return
      spills.push({ spill, w: Math.round(r.width), txt: (el.innerText || '').trim().slice(0, 30).replace(/\n/g, ' | ') })
    })
    // One root cause surfaces on every ancestor in the chain, so cap the noise.
    spills.sort((a, b) => b.spill - a.spill).slice(0, 4).forEach((x) =>
      issues.push({ severity: 'WARN', kind: 'clipped-spill',
        detail: `${x.spill}px past a ${x.w}px container "${x.txt}"` })
    )
  }

  return {
    issues,
    text: document.body.innerText,
    height: document.body.scrollHeight,
    canvases: document.querySelectorAll('canvas').length,
  }
}

// ─── runner ───────────────────────────────────────────────────────────────────

async function auditView(page, label, results) {
  const probe = await page.evaluate(PROBE)

  for (const { term, allowIn } of BANNED_TERMS) {
    // `allowIn` was declared when BANNED_TERMS was written but never actually
    // read, so every term was enforced on every route regardless. Wiring it up
    // is what makes /auditing /auctions possible at all - otherwise the route
    // files a banned-term BLOCKER and Telegram-alerts Ariel on correct copy.
    // Note: propertyonion entries keep allowIn: [] deliberately. That standing
    // rule has no exemptions anywhere on any surface.
    if ((allowIn || []).some((p) => label.includes(p))) continue
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    if (re.test(probe.text)) {
      results.push({ view: label, severity: 'BLOCKER', kind: 'banned-term', detail: `"${term}" present` })
    }
  }
  if (/brevard/i.test(probe.text)) {
    const onlyProvenance = probe.text
      .split(/\n/)
      .filter((l) => /brevard/i.test(l))
      .every((l) => BREVARD_ALLOWED_CONTEXTS.some((ctx) => l.includes(ctx)))
    if (!onlyProvenance) {
      results.push({ view: label, severity: 'WARN', kind: 'geography-positioning', detail: 'Brevard outside provenance line' })
    }
  }

  probe.issues.forEach((i) => results.push({ view: label, ...i }))
  return probe
}

async function run() {
  const browser = await chromium.launch()
  SSOT = await loadSsot(BASE)
  if (!SSOT) console.warn('audit: /api/stats unavailable — skipping cross-page stat consistency check')
  const results = []
  if (SHOTS) fs.mkdirSync(SHOT_DIR, { recursive: true })

  for (const vp of ACTIVE_VIEWPORTS) {
    const ctx = await browser.newContext({
      ...vp.device,
      ignoreHTTPSErrors: true,
      ...(AUTH_STATE ? { storageState: AUTH_STATE } : {}),
    })

    for (const route of ACTIVE_ROUTES) {
      const page = await ctx.newPage()
      const pageErrors = []
      page.on('pageerror', (e) => pageErrors.push(e.message.slice(0, 120)))
      page.on('console', (m) => {
        if (m.type() !== 'error') return
        const t = m.text()
        // A 429 is this harness's own request rate against production, not a
        // product defect. It used to surface as a phantom js-error BLOCKER.
        if (/\b429\b/.test(t)) return
        pageErrors.push(t.slice(0, 120))
      })

      const label = `${vp.name} ${route.path}`
      try {
        // Production rate-limits a fast sequential walk of 7 routes x 7 tabs.
        // Concurrency was only half the story: even a single CI run walking all
        // four viewports trips 429 on whichever routes land last (consistently
        // Desktop /pricing and /feasibility). Throttle, then back off and retry
        // before believing a 429.
        await page.waitForTimeout(1200)
        let resp = null
        for (let attempt = 0; attempt < 4; attempt++) {
          resp = await page.goto(BASE + route.path, { waitUntil: 'networkidle', timeout: 60000 })
          if (!resp || resp.status() !== 429) break
          pageErrors.length = 0
          // 5s/10s/15s was not enough — the rate-limit window outlasts it.
          // Back off exponentially instead: 10s, 20s, 40s.
          if (attempt < 3) await page.waitForTimeout(10000 * Math.pow(2, attempt))
        }
        // A 429 is our own request rate, never a statement about the product, so
        // it must not gate CI or fire a Telegram alert at Ariel. /feasibility is
        // the repeat offender because unauthenticated it serves Clerk's hosted
        // sign-in page, which is rate-limited harder than our own routes. A
        // PERSISTENT 429 still has to be visible though, so record it as a WARN
        // and skip the view rather than audit an error page and report garbage.
        if (resp && resp.status() === 429) {
          results.push({ view: label, severity: 'WARN', kind: 'rate-limited-skipped', detail: 'still 429 after 4 attempts; view not audited' })
          await page.close()
          continue
        }
        if (!resp || resp.status() >= 400) {
          results.push({ view: label, severity: 'BLOCKER', kind: 'bad-status', detail: String(resp && resp.status()) })
          await page.close()
          continue
        }
        await page.waitForTimeout(2200)

        // dismiss any overlay that would mask the content beneath it
        for (const sel of ['text=Skip tour', 'text=Skip tour ✕']) {
          try { await page.click(sel, { timeout: 1200 }); await page.waitForTimeout(600) } catch {}
        }

        await auditView(page, label, results)
        checkStatClaims(await page.evaluate(() => document.body.innerText || ''), label, results)
        if (SHOTS) {
          await page.screenshot({
            path: path.join(SHOT_DIR, `${vp.name.replace(/\s/g, '')}_${route.name}.png`),
            fullPage: false,
          })
        }

        // An auth-gated route answers HTTP 200 while quietly serving the Clerk
        // sign-in page, so `bad-status` never fires and the harness audits a
        // login form believing it is the app. Status is not enough — check where
        // we actually landed.
        const landedOn = new URL(page.url()).pathname
        const bounced = Boolean(route.authGated) && landedOn.startsWith('/sign-in')
        if (bounced && AUTH_STATE) {
          results.push({ view: label, severity: 'BLOCKER', kind: 'auth-state-rejected', detail: `session supplied but ${route.path} still bounced to ${landedOn}` })
        }

        // walk in-page tabs — these are distinct views and must be audited too.
        // This is the step that was skipped on 2026-08-15; four broken tabs shipped.
        let tabsSkipped = 0
        for (const tab of route.tabs || []) {
          // Unauthenticated, all 7 tabs "fail" identically because the page
          // behind them never rendered. That is 28 WARNs a run of noise, not 28
          // findings. Say it once per view instead.
          if (bounced && !AUTH_STATE) { tabsSkipped++; continue }
          try {
            await page.click(`text="${tab}"`, { timeout: 5000 })
            await page.waitForTimeout(1600)
            await auditView(page, `${label} [${tab}]`, results)
            if (SHOTS) {
              await page.screenshot({
                path: path.join(SHOT_DIR, `${vp.name.replace(/\s/g, '')}_${route.name}_${tab}.png`),
                fullPage: false,
              })
            }
          } catch {
            results.push({ view: `${label} [${tab}]`, severity: 'WARN', kind: 'tab-unreachable', detail: 'could not activate tab' })
          }
        }
        if (tabsSkipped) {
          results.push({ view: label, severity: 'INFO', kind: 'tabs-unaudited-no-session', detail: `${tabsSkipped} tabs behind Clerk — run scripts/auth-state.mjs to audit them` })
        }
      } catch (e) {
        results.push({ view: label, severity: 'BLOCKER', kind: 'navigation-failed', detail: String(e.message).slice(0, 120) })
      }

      ;[...new Set(pageErrors)].slice(0, 4).forEach((d) =>
        results.push({ view: label, severity: 'BLOCKER', kind: 'js-error', detail: d })
      )
      await page.close()
    }
    await ctx.close()
  }
  await browser.close()

  // ─── report ────────────────────────────────────────────────────────────────
  const blockers = results.filter((r) => r.severity === 'BLOCKER')
  const warns = results.filter((r) => r.severity === 'WARN')

  console.log(`\n${'='.repeat(72)}`)
  console.log(`ZoneWise site audit — ${BASE}`)
  console.log(`viewports: ${ACTIVE_VIEWPORTS.map((v) => v.name).join(', ')}`)
  console.log(`${blockers.length} blockers · ${warns.length} warnings`)
  console.log('='.repeat(72))

  for (const group of [['BLOCKER', blockers], ['WARN', warns]]) {
    const [name, list] = group
    if (!list.length) continue
    console.log(`\n${name}S`)
    const byView = {}
    list.forEach((r) => { (byView[r.view] ||= []).push(r) })
    for (const [view, items] of Object.entries(byView)) {
      console.log(`\n  ${view}`)
      items.forEach((i) => console.log(`    [${i.kind}] ${i.detail}`))
    }
  }

  if (args.json) {
    fs.writeFileSync(String(args.json), JSON.stringify({ base: BASE, results }, null, 2))
    console.log(`\nJSON written to ${args.json}`)
  }

  console.log(`\n${blockers.length ? 'FAIL' : 'PASS'}\n`)
  process.exit(blockers.length ? 1 : 0)
}

run().catch((e) => { console.error(e); process.exit(1) })
