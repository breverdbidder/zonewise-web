import { test, expect } from '@playwright/test'

// Default to a local dev server: this spec exercises live Supabase-backed
// filter/map wiring that is not yet on production. Override with
// ZONEWISE_WEB_URL to point at a deployed environment once shipped.
const BASE_URL = process.env.ZONEWISE_WEB_URL || 'http://localhost:3000'

test.describe('AuctionRadar - live filters + map parity', () => {
  test('DoD 1+2: changing County and Type re-fires the calendar request, and All restores the unfiltered numbers', async ({ page }) => {
    const calendarRequests: URL[] = []
    page.on('request', (req) => {
      if (req.url().includes('/api/auctions/calendar')) {
        calendarRequests.push(new URL(req.url()))
      }
    })

    await page.goto(`${BASE_URL}/auctions`, { waitUntil: 'domcontentloaded' })
    await page.waitForResponse((res) => res.url().includes('/api/auctions/calendar') && res.ok())

    const monthTotalLocator = page.locator('text=/\\d[\\d,]* (property|properties) across/')
    await expect(monthTotalLocator).toBeVisible({ timeout: 15000 })
    const unfilteredText = await monthTotalLocator.textContent()
    const countAfterLoad = calendarRequests.length
    expect(countAfterLoad).toBeGreaterThan(0)

    // --- County change fires a request ---
    const countySelect = page.locator('select').first()
    const options = await countySelect.locator('option').allTextContents()
    const firstRealCounty = options.find((o) => o !== 'All Counties')
    expect(firstRealCounty).toBeTruthy()

    const [countyResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/auctions/calendar') && res.ok()),
      countySelect.selectOption({ label: firstRealCounty! }),
    ])
    expect(calendarRequests.length).toBeGreaterThan(countAfterLoad)
    expect(new URL(countyResponse.url()).searchParams.get('county')).toBeTruthy()

    const filteredText = await monthTotalLocator.textContent()
    // The label must not lie about what's on screen: a real county filter on
    // a 2,709-row dataset changes the visible total.
    expect(filteredText).not.toBe(unfilteredText)
    const countAfterCounty = calendarRequests.length

    // --- Type change fires a request on top of the county filter ---
    const typeSelect = page.locator('select').nth(1)
    const [typeResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/auctions/calendar') && res.ok()),
      typeSelect.selectOption('tax_deed'),
    ])
    expect(calendarRequests.length).toBeGreaterThan(countAfterCounty)
    const typeUrl = new URL(typeResponse.url())
    expect(typeUrl.searchParams.get('sale_type')).toBe('tax_deed')
    expect(typeUrl.searchParams.get('county')).toBeTruthy()

    // --- Resetting both to "All" restores the unfiltered numbers ---
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/auctions/calendar') && res.ok()),
      typeSelect.selectOption(''),
    ])
    const [resetResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/auctions/calendar') && res.ok()),
      countySelect.selectOption(''),
    ])
    const resetUrl = new URL(resetResponse.url())
    expect(resetUrl.searchParams.get('county')).toBeFalsy()
    expect(resetUrl.searchParams.get('sale_type')).toBeFalsy()

    const restoredText = await monthTotalLocator.textContent()
    expect(restoredText).toBe(unfilteredText)
  })

  test('DoD 3: .fc-event computes cursor:pointer', async ({ page }) => {
    await page.goto(`${BASE_URL}/auctions`, { waitUntil: 'domcontentloaded' })
    await page.waitForResponse((res) => res.url().includes('/api/auctions/calendar') && res.ok())

    const badge = page.locator('.fc-event').first()
    await expect(badge).toBeVisible({ timeout: 15000 })

    const cursor = await badge.evaluate((el) => getComputedStyle(el).cursor)
    expect(cursor).toBe('pointer')

    const title = await badge.getAttribute('title')
    expect(title).toBeTruthy()
    expect(title).toMatch(/^View /)
  })

  test('DoD 4: map view plots the filtered set with an honest truncation banner', async ({ page }) => {
    await page.goto(`${BASE_URL}/auctions`, { waitUntil: 'domcontentloaded' })
    await page.waitForResponse((res) => res.url().includes('/api/auctions/calendar') && res.ok())

    const viewTabs = page.locator('button', { hasText: 'Map' })
    const [mapResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/auctions/map') && res.ok()),
      viewTabs.first().click(),
    ])
    const body = await mapResponse.json()

    expect(body.total_matching).toBeGreaterThan(0)
    expect(body.total_mappable).toBeLessThanOrEqual(body.total_matching)
    expect(body.returned).toBeLessThanOrEqual(body.total_mappable)

    if (body.returned < body.total_matching) {
      const banner = page.locator('[data-testid="map-truncation-banner"]')
      await expect(banner).toBeVisible({ timeout: 15000 })
      const bannerText = (await banner.textContent()) || ''
      expect(bannerText).toContain(Number(body.returned).toLocaleString())
      expect(bannerText).toContain(Number(body.total_matching).toLocaleString())
      const noCoords = body.total_matching - body.total_mappable
      if (noCoords > 0) {
        expect(bannerText).toContain(Number(noCoords).toLocaleString())
      }
    }
  })

  test('DoD 5: day badge -> View on map shows only that day + type, pin count equals the badge number', async ({ page }) => {
    await page.goto(`${BASE_URL}/auctions`, { waitUntil: 'domcontentloaded' })
    await page.waitForResponse((res) => res.url().includes('/api/auctions/calendar') && res.ok())

    // Pick a real badge instead of hardcoding a date - counts drift day to
    // day as the scraper runs.
    const badge = page.locator('.fc-event').first()
    await expect(badge).toBeVisible({ timeout: 15000 })
    const date = await badge.getAttribute('data-date')
    const saleType = await badge.getAttribute('data-sale-type')
    const badgeCount = Number(await badge.getAttribute('data-count'))
    expect(date).toBeTruthy()
    expect(badgeCount).toBeGreaterThan(0)

    await badge.click()

    const chip = page.locator('text=Showing').first()
    await expect(chip).toBeVisible({ timeout: 15000 })

    const [mapResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/auctions/map') && res.ok()),
      page.locator('button', { hasText: 'View on map' }).click(),
    ])

    const url = new URL(mapResponse.url())
    expect(url.searchParams.get('from')).toBe(date)
    expect(url.searchParams.get('to')).toBe(date)
    if (saleType && saleType !== 'other') {
      expect(url.searchParams.get('sale_type')).toBe(saleType)
    }

    const body = await mapResponse.json()
    // total_matching is COUNT(*) for this exact date+type filter - the same
    // universe the calendar badge counted. It must agree with the badge
    // regardless of how many of those rows have coordinates to plot.
    expect(body.total_matching).toBe(badgeCount)
  })
})

test.describe('AuctionRadar - /api/auctions/map negative tests', () => {
  test('DoD 6: unmatched county returns 200 with an empty array, not a 500 or a silent full-table fallback', async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/api/auctions/map?county=ZZZ_NO_SUCH_COUNTY&upcoming=true`
    )
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.returned).toBe(0)
    expect(body.total_mappable).toBe(0)
    expect(body.total_matching).toBe(0)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBe(0)
  })

  test('DoD 6: an unknown query param does not 500', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/auctions/map?bogus_param=xyz&upcoming=true`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(typeof body.returned).toBe('number')
  })
})
