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
const SHOTS = Boolean(args.shots)
const SHOT_DIR = args.shotDir || './audit-shots'

/** Public + app routes. Add new routes here as they ship. */
const ROUTES = [
  { path: '/', name: 'landing', public: true },
  { path: '/pricing', name: 'pricing', public: true },
  { path: '/explorer', name: 'explorer' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/feasibility', name: 'feasibility', tabs: [
      'Site', 'Market', 'Lodging', 'Comps', 'Capacity', 'Develop', 'Generate',
    ] },
  { path: '/report', name: 'report' },
  { path: '/docs', name: 'docs', public: true },
]

const VIEWPORTS = [
  { name: 'iPhone SE', device: devices['iPhone SE'] },   // 320px — tightest
  { name: 'Pixel 5', device: devices['Pixel 5'] },       // 393px — most common
  { name: 'iPad Mini', device: devices['iPad Mini'] },   // 768px — tablet
  { name: 'Desktop', device: { viewport: { width: 1440, height: 900 } } },
]

/**
 * SSOT positioning guard. ZoneWise.AI sells zoning intelligence + feasibility.
 * Auction / foreclosure / tax-deed content belongs on BidDeed.AI, and Brevard
 * is evidence (case-study provenance) not positioning — so it is allowed only
 * inside an explicit provenance string.
 */
const BANNED_TERMS = [
  { term: 'foreclosure', allowIn: [] },
  { term: 'tax deed', allowIn: [] },
  { term: 'auction', allowIn: [] },
  { term: '10 years', allowIn: [] },
  { term: '10+ years', allowIn: [] },
]
const BREVARD_ALLOWED_CONTEXT = 'Recorded, Brevard County Clerk'

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

  // 5. tap targets under 44px (only when a touch viewport)
  if (window.matchMedia('(pointer: coarse)').matches) {
    const tiny = new Set()
    document.querySelectorAll('a,button,[role="button"]').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0 && r.height < 44) {
        tiny.add(`${Math.round(r.height)}px "${(el.textContent || '').trim().slice(0, 24)}"`)
      }
    })
    ;[...tiny].slice(0, 6).forEach((d) =>
      issues.push({ severity: 'WARN', kind: 'small-tap-target', detail: d })
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

  for (const { term } of BANNED_TERMS) {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    if (re.test(probe.text)) {
      results.push({ view: label, severity: 'BLOCKER', kind: 'banned-term', detail: `"${term}" present` })
    }
  }
  if (/brevard/i.test(probe.text)) {
    const onlyProvenance = probe.text
      .split(/\n/)
      .filter((l) => /brevard/i.test(l))
      .every((l) => l.includes(BREVARD_ALLOWED_CONTEXT))
    if (!onlyProvenance) {
      results.push({ view: label, severity: 'WARN', kind: 'geography-positioning', detail: 'Brevard outside provenance line' })
    }
  }

  probe.issues.forEach((i) => results.push({ view: label, ...i }))
  return probe
}

async function run() {
  const browser = await chromium.launch()
  const results = []
  if (SHOTS) fs.mkdirSync(SHOT_DIR, { recursive: true })

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ ...vp.device, ignoreHTTPSErrors: true })

    for (const route of ROUTES) {
      const page = await ctx.newPage()
      const pageErrors = []
      page.on('pageerror', (e) => pageErrors.push(e.message.slice(0, 120)))
      page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text().slice(0, 120)) })

      const label = `${vp.name} ${route.path}`
      try {
        const resp = await page.goto(BASE + route.path, { waitUntil: 'networkidle', timeout: 60000 })
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
        if (SHOTS) {
          await page.screenshot({
            path: path.join(SHOT_DIR, `${vp.name.replace(/\s/g, '')}_${route.name}.png`),
            fullPage: false,
          })
        }

        // walk in-page tabs — these are distinct views and must be audited too.
        // This is the step that was skipped on 2026-08-15; four broken tabs shipped.
        for (const tab of route.tabs || []) {
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
