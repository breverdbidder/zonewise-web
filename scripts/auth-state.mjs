#!/usr/bin/env node
/**
 * ZoneWise.AI — authenticated storageState generator for the audit harness
 * ------------------------------------------------------------------------
 * Why this exists: /feasibility's 7 tabs reported `tab-unreachable` in every
 * run at every viewport — 28 WARNs a run of pure noise. The cause was never a
 * broken tab: Clerk gates anonymous traffic before the tab buttons render, so
 * the harness was auditing a sign-in page and calling it a feasibility page.
 * Those 7 tabs are the exact views that shipped broken on 2026-08-15, so
 * leaving them permanently unaudited defeats the point of the harness.
 *
 * This logs in once with a dedicated audit user and saves the session to
 * .auth/state.json, which audit-site.mjs then reuses for every context.
 *
 * Usage:
 *   AUDIT_USER_EMAIL=... AUDIT_USER_PASSWORD=... node scripts/auth-state.mjs
 *   node scripts/auth-state.mjs --base=http://localhost:3000 --out=.auth/state.json
 *
 * NOTE ON DEPENDENCIES: this deliberately does NOT use @clerk/testing. Adding a
 * dependency without regenerating package-lock.json breaks `npm ci` in CI, and
 * Clerk Testing Tokens are development-instance only anyway — they would not
 * help against production, which is what we actually audit.
 *
 * NOTE ON SECRETS: the output file contains a LIVE SESSION COOKIE. It is
 * gitignored and must never be uploaded as a CI artifact.
 *
 * Exit codes: 0 = state written, 1 = login failed, 2 = not configured.
 */

import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)

const BASE = args.base || process.env.AUDIT_BASE || 'https://zonewise.ai'
const OUT = args.out || '.auth/state.json'
const EMAIL = process.env.AUDIT_USER_EMAIL
const PASSWORD = process.env.AUDIT_USER_PASSWORD
// Any route that is behind Clerk and proves the session actually took.
const VERIFY_PATH = args.verify || '/feasibility'

if (!EMAIL || !PASSWORD) {
  console.log('auth-state: AUDIT_USER_EMAIL / AUDIT_USER_PASSWORD not set — skipping.')
  console.log('auth-state: the harness will run unauthenticated and skip auth-gated tabs.')
  process.exit(2)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ ignoreHTTPSErrors: true })
const page = await ctx.newPage()

const fail = async (why, err) => {
  console.error(`auth-state: FAILED — ${why}`)
  if (err) console.error(String(err).slice(0, 300))
  try {
    fs.mkdirSync('audit-shots', { recursive: true })
    // Screenshot only. Never dump page HTML: it can contain Clerk tokens.
    await page.screenshot({ path: 'audit-shots/auth-failure.png', fullPage: true })
    console.error('auth-state: wrote audit-shots/auth-failure.png')
  } catch {}
  await browser.close()
  process.exit(1)
}

try {
  await page.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle', timeout: 60000 })

  // Clerk renders its form inside its own component tree and the field names
  // have been stable across v5-v7, but fall back to type-based selectors so a
  // Clerk cosmetic release does not silently break the audit.
  const identifier = page
    .locator('input[name="identifier"], input[type="email"]')
    .first()
  await identifier.waitFor({ state: 'visible', timeout: 20000 })
  await identifier.fill(EMAIL)

  const password = page
    .locator('input[name="password"], input[type="password"]')
    .first()

  // Clerk ships two sign-in layouts depending on instance config: a single-step
  // form with both fields visible, and a two-step form that reveals the password
  // only after the identifier is submitted. zonewise.ai currently renders the
  // single-step variant — pressing Enter there before filling the password
  // submits an empty password and fails the login. Detect, do not assume.
  const singleStep = await password.isVisible().catch(() => false)
  if (!singleStep) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(2500)
    await password.waitFor({ state: 'visible', timeout: 20000 })
  }
  await password.fill(PASSWORD)
  await page.keyboard.press('Enter')

  // Do not trust a URL change alone — Clerk can bounce through interstitials.
  // Wait until we are genuinely off /sign-in.
  await page.waitForURL((u) => !u.pathname.startsWith('/sign-in'), { timeout: 30000 })
  await page.waitForTimeout(2500)
} catch (e) {
  await fail('could not complete the Clerk sign-in flow', e)
}

// Prove the session works on the route we actually care about, rather than
// writing a state file that turns out to be worthless at audit time.
try {
  await page.goto(`${BASE}${VERIFY_PATH}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(2000)
  if (new URL(page.url()).pathname.startsWith('/sign-in')) {
    await fail(`signed in, but ${VERIFY_PATH} still redirects to /sign-in (user may lack entitlement)`)
  }
} catch (e) {
  await fail(`could not verify the session against ${VERIFY_PATH}`, e)
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
await ctx.storageState({ path: OUT })
fs.chmodSync(OUT, 0o600)
await browser.close()

console.log(`auth-state: OK — session verified on ${VERIFY_PATH}, wrote ${OUT}`)
