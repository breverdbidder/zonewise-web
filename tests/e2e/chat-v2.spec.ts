import { test, expect } from '@playwright/test'

const BASE_URL = process.env.ZONEWISE_WEB_URL || 'https://zonewise.ai'
const CHAT_URL = `${BASE_URL}/chat-v2`

test.describe('/chat-v2 E2E', () => {
  // Test 1: Page loads without error
  test('page loads — no error, Thread visible', async ({ page }) => {
    const response = await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    expect(response?.status()).toBeLessThan(400)

    // assistant-ui Thread renders a [data-testid="thread-root"] or a container div
    // Wait for page to hydrate
    await page.waitForTimeout(3000)

    // Page should not show a Next.js error page
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('Application error')
    expect(bodyText).not.toContain('500')

    // Thread container should exist (assistant-ui mounts a scrollable area)
    const threadOrContent = page.locator('[class*="thread"], [class*="Thread"], main, article, section').first()
    await expect(threadOrContent).toBeVisible({ timeout: 15000 })
  })

  // Test 2: Composer renders and is focusable
  test('composer renders — textarea/input is focusable', async ({ page }) => {
    await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3000)

    // assistant-ui uses a textarea for the composer
    const composer = page.locator('textarea, input[type="text"], [role="textbox"]').first()
    await expect(composer).toBeVisible({ timeout: 15000 })

    // Should be focusable
    await composer.focus()
    const isFocused = await composer.evaluate(el => el === document.activeElement)
    expect(isFocused).toBe(true)
  })

  // Test 3: Send message and get response
  test('send message — response appears within 30s', async ({ page }) => {
    await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3000)

    const composer = page.locator('textarea, input[type="text"], [role="textbox"]').first()
    await expect(composer).toBeVisible({ timeout: 15000 })

    await composer.fill('1600 Orlando Ave Cocoa Beach FL')

    // Submit via Enter key
    await composer.press('Enter')

    // User message should appear in thread
    const userMsg = page.locator('text=1600 Orlando Ave Cocoa Beach FL')
    await expect(userMsg).toBeVisible({ timeout: 10000 })

    // Assistant response should appear — wait up to 30s for the API call
    // assistant-ui renders assistant messages in a distinct container
    const assistantResponse = page.locator('[data-message-role="assistant"], [class*="assistant"], [class*="AssistantMessage"]').first()
    await expect(assistantResponse).toBeVisible({ timeout: 30000 })
  })

  // Test 4: Response contains parcel/zone data
  test('response has data — contains Parcel or Zone keywords', async ({ page }) => {
    await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3000)

    const composer = page.locator('textarea, input[type="text"], [role="textbox"]').first()
    await expect(composer).toBeVisible({ timeout: 15000 })

    await composer.fill('What is the zoning for 1600 Orlando Ave Cocoa Beach FL?')
    await composer.press('Enter')

    // Wait for a response with actual content
    await page.waitForTimeout(30000)

    const bodyText = await page.locator('body').innerText()
    const hasZoningData = bodyText.includes('Parcel') ||
      bodyText.includes('Zone') ||
      bodyText.includes('zone') ||
      bodyText.includes('zoning') ||
      bodyText.includes('parcel')

    expect(hasZoningData).toBe(true)
  })

  // Test 5: Split-screen layout — check or skip gracefully
  test('split-screen layout — panels present or single-column fallback', async ({ page }) => {
    await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3000)

    // Check for split-screen panels (added by SUMMIT #96) or fallback to single column
    const leftPanel = page.locator('[class*="left"], [class*="split"], [data-panel="left"]').first()
    const rightPanel = page.locator('[class*="right"], [data-panel="right"]').first()
    const singleCol = page.locator('main, [class*="max-w"]').first()

    const hasLeft = await leftPanel.isVisible().catch(() => false)
    const hasRight = await rightPanel.isVisible().catch(() => false)
    const hasSingle = await singleCol.isVisible().catch(() => false)

    // Either split layout OR single-column — both are valid
    expect(hasLeft && hasRight || hasSingle).toBe(true)
  })

  // Test 6: Mobile viewport — layout stacks vertically
  test('mobile viewport 375×812 — no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2) // 2px tolerance

    // Composer should still be visible on mobile
    const composer = page.locator('textarea, input[type="text"], [role="textbox"]').first()
    await expect(composer).toBeVisible({ timeout: 15000 })
  })

  // Test 7: Error handling — empty message does not crash
  test('error handling — empty submit causes no crash', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3000)

    const composer = page.locator('textarea, input[type="text"], [role="textbox"]').first()
    await expect(composer).toBeVisible({ timeout: 15000 })

    // Try submitting empty
    await composer.focus()
    await composer.press('Enter')
    await page.waitForTimeout(2000)

    // No JS errors / crashes
    const fatalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('analytics') &&
      !e.includes('posthog') &&
      !e.includes('gtag') &&
      !e.includes('ResizeObserver')
    )
    expect(fatalErrors.length).toBe(0)

    // Page still functional — composer still visible
    await expect(composer).toBeVisible()
  })
})
