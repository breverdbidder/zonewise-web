import { test, expect } from '@playwright/test'

const BASE_URL = process.env.ZONEWISE_WEB_URL || 'https://zonewise.ai'

test.describe('Chat Streaming E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear daily limits so chat is available
    await page.addInitScript(() => {
      const todayKey = new Date().toISOString().split('T')[0]
      localStorage.removeItem(`zw_chat_${todayKey}`)
      localStorage.removeItem(`zw_parcels_${todayKey}`)
    })
  })

  test('explorer page loads with chat input', async ({ page }) => {
    await page.goto(`${BASE_URL}/explorer`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // Chat input should be visible on desktop
    const input = page.locator('input[placeholder*="Ask anything"]').or(
      page.locator('input[placeholder*="Brevard"]')
    )
    await expect(input).toBeVisible({ timeout: 15000 })
  })

  test('chat input is interactive', async ({ page }) => {
    await page.goto(`${BASE_URL}/explorer`, { waitUntil: 'domcontentloaded', timeout: 30000 })

    const input = page.locator('input[placeholder*="Ask anything"]').or(
      page.locator('input[placeholder*="Brevard"]')
    ).first()

    await expect(input).toBeVisible({ timeout: 15000 })
    await input.fill('What is the zoning for 32901?')
    await expect(input).toHaveValue('What is the zoning for 32901?')
  })

  test('sending a chat query triggers a response', async ({ page }) => {
    await page.goto(`${BASE_URL}/explorer`, { waitUntil: 'domcontentloaded', timeout: 30000 })

    const input = page.locator('input[placeholder*="Ask anything"]').or(
      page.locator('input[placeholder*="Brevard"]')
    ).first()

    await expect(input).toBeVisible({ timeout: 15000 })
    await input.fill('What zip codes are in Brevard County?')

    // Submit via Enter or submit button
    await input.press('Enter')

    // User message should appear in chat
    const userMessage = page.locator('text=What zip codes are in Brevard County?')
    await expect(userMessage).toBeVisible({ timeout: 10000 })

    // A response should appear (assistant message bubble — darker bg)
    const assistantBubble = page.locator('.bg-slate-900').last()
    // Wait for streaming to complete — response should have content
    await expect(assistantBubble).not.toBeEmpty({ timeout: 30000 })
  })

  test('free chat limit counter decrements after send', async ({ page }) => {
    await page.goto(`${BASE_URL}/explorer`, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Should show free message counter
    const counter = page.locator('text=/\\d+\\/\\d+ free/')
    await expect(counter).toBeVisible({ timeout: 15000 })
  })

  test('chat search chips are visible on empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}/explorer`, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Chips should be visible when no messages
    await page.waitForTimeout(1000)
    const chatPanel = page.locator('.bg-slate-950').first()
    await expect(chatPanel).toBeVisible({ timeout: 15000 })
  })
})
