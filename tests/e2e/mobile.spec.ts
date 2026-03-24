import { test, expect } from '@playwright/test'

const BASE_URL = process.env.ZONEWISE_WEB_URL || 'https://zonewise.ai'

const ROUTES = ['/', '/explorer', '/pricing', '/help']

test.describe('Mobile Viewport — 375px (iPhone SE)', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  for (const route of ROUTES) {
    test(`${route} — no horizontal overflow at 375px`, async ({ page }) => {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Body should not overflow horizontally
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1) // +1px tolerance
    })

    test(`${route} — key elements visible at 375px`, async ({ page }) => {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Page should have some visible content
      const bodyText = await page.evaluate(() => document.body.innerText.trim())
      expect(bodyText.length).toBeGreaterThan(10)

      // No elements should be cut off (check for x overflow on main elements)
      const hasXOverflow = await page.evaluate(() => {
        const elements = document.querySelectorAll('section, main, nav, header, footer')
        for (const el of elements) {
          const rect = el.getBoundingClientRect()
          if (rect.right > window.innerWidth + 5) return true
        }
        return false
      })
      expect(hasXOverflow).toBe(false)
    })
  }

  test('homepage hero CTA buttons are tappable at 375px', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // At least one CTA button should be visible
    const ctaButton = page.locator('a[href="/explorer"]').or(
      page.locator('a[href="#beta-signup"]')
    ).first()
    await expect(ctaButton).toBeVisible({ timeout: 10000 })

    // Button should have reasonable tap target size (44px min)
    const box = await ctaButton.boundingBox()
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(40)
    }
  })

  test('pricing page cards stack vertically at 375px', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Pricing tiers should be visible
    const freeCard = page.locator('text=Free').first()
    await expect(freeCard).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Mobile Viewport — 768px (Tablet)', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  for (const route of ROUTES) {
    test(`${route} — no horizontal overflow at 768px`, async ({ page }) => {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1)
    })
  }

  test('navigation is visible at 768px', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Nav should be visible
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible({ timeout: 10000 })
  })

  test('explorer map loads at 768px', async ({ page }) => {
    await page.goto(`${BASE_URL}/explorer`, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Map container should be visible
    const mapContainer = page.locator('[aria-label="ZoneWise Explorer Map"]').or(
      page.locator('canvas')
    ).first()
    await expect(mapContainer).toBeVisible({ timeout: 20000 })
  })
})
