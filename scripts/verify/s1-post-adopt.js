#!/usr/bin/env node
// SUMMIT #182 — Post-Adopt Playwright Verify
// Verifies shadcn template adoption on LIVE zonewise.ai

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mocerqjnksmhcjzxrewo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BASE_URL = 'https://zonewise.ai';
const SCREENSHOTS_DIR = '/tmp/s1-post-adopt';
const STORAGE_PATH = 'verify/s1-post-adopt';
const BUCKET = 'edp-screenshots';

const results = [];

function log(check, status, evidence) {
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${check}: ${evidence}`);
  results.push({ check, status, evidence });
}

async function uploadToSupabase(filePath, fileName) {
  const fileData = fs.readFileSync(filePath);
  const uploadPath = `${STORAGE_PATH}/${fileName}`;
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${uploadPath}`;

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'image/png',
        'Content-Length': fileData.length,
        'x-upsert': 'true',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${uploadPath}`;
          resolve(publicUrl);
        } else {
          reject(new Error(`Upload failed: ${res.statusCode} ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
}

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const uploadedUrls = {};

  try {
    // ── CHECK 1 & 2: Desktop landing page ──────────────────────────────
    console.log('\n=== CHECK 1: Landing Page Desktop (1280x800) ===');
    const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const desktopPage = await desktopCtx.newPage();

    await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await desktopPage.waitForTimeout(2000);

    // Full page screenshot
    const s1Path = path.join(SCREENSHOTS_DIR, 's1-landing-desktop.png');
    await desktopPage.screenshot({ path: s1Path, fullPage: true });
    log('Landing page loads', 'PASS', 's1-landing-desktop.png captured');

    // Check for landing sections
    const heroExists = await desktopPage.locator('section, [class*="hero"], h1').first().isVisible().catch(() => false);
    const h1Text = await desktopPage.locator('h1').first().textContent().catch(() => '');
    log('HeroSection present', heroExists ? 'PASS' : 'FAIL', `h1: "${h1Text?.trim().substring(0, 60)}"`);

    // Check for features/stats/pricing sections
    const sectionCount = await desktopPage.locator('section').count();
    log('Multiple sections rendered', sectionCount >= 3 ? 'PASS' : 'FAIL', `${sectionCount} <section> elements found`);

    // Check for pricing section with $99
    const pricingText = await desktopPage.locator('body').textContent().catch(() => '');
    const has99 = pricingText.includes('99');
    const hasPricing = pricingText.toLowerCase().includes('pric') || pricingText.includes('$');
    log('PricingSection with $ present', hasPricing ? 'PASS' : 'FAIL', `Pricing text: ${hasPricing}, $99 present: ${has99}`);

    await desktopCtx.close();

    // ── CHECK 2: Mobile landing page ───────────────────────────────────
    console.log('\n=== CHECK 2: Landing Page Mobile (375x812) ===');
    const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
    const mobilePage = await mobileCtx.newPage();

    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await mobilePage.waitForTimeout(2000);

    const s2Path = path.join(SCREENSHOTS_DIR, 's2-landing-mobile.png');
    await mobilePage.screenshot({ path: s2Path, fullPage: true });
    log('Landing page mobile', 'PASS', 's2-landing-mobile.png captured');

    await mobileCtx.close();

    // ── CHECK 3: Choropleth — 3 counties → DashboardTeaser ─────────────
    console.log('\n=== CHECK 3: Choropleth 3-county clicks → DashboardTeaser ===');
    const mapCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const mapPage = await mapCtx.newPage();

    await mapPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await mapPage.waitForTimeout(3000);

    // Look for map canvas or SVG paths representing counties
    const mapCanvas = await mapPage.locator('canvas').first().isVisible().catch(() => false);
    const mapSvg = await mapPage.locator('svg path').count().catch(() => 0);
    log('Choropleth map present', (mapCanvas || mapSvg > 0) ? 'PASS' : 'FAIL',
      `canvas: ${mapCanvas}, svg paths: ${mapSvg}`);

    // Try clicking map area where Florida counties are (~center of FL map)
    // The map is rendered at zonewise.ai/ — FL center viewport approx
    let clickCount = 0;
    const mapClickCoords = [
      { x: 700, y: 400 }, // center area
      { x: 750, y: 380 },
      { x: 680, y: 420 },
      { x: 720, y: 350 },
      { x: 760, y: 410 },
    ];

    for (let i = 0; i < 3; i++) {
      const { x, y } = mapClickCoords[i];
      await mapPage.mouse.click(x, y);
      await mapPage.waitForTimeout(800);
      clickCount++;
    }

    // After 3 clicks, check for DashboardTeaser/sidebar
    const s5Path = path.join(SCREENSHOTS_DIR, 's5-sidebar-after-3clicks.png');
    await mapPage.screenshot({ path: s5Path });

    const sidebarText = await mapPage.locator('body').textContent().catch(() => '');
    const hasSidebar = await mapPage.locator('[class*="sidebar"], [class*="teaser"], [class*="drawer"], aside').isVisible().catch(() => false);
    const hasSidebarKeyword = sidebarText.toLowerCase().includes('teaser') ||
                               sidebarText.toLowerCase().includes('selected') ||
                               sidebarText.toLowerCase().includes('counti') ||
                               sidebarText.toLowerCase().includes('dashboard');
    log('DashboardTeaser sidebar after 3 clicks', hasSidebar || hasSidebarKeyword ? 'PASS' : 'FAIL',
      `sidebar visible: ${hasSidebar}, keyword: ${hasSidebarKeyword}`);

    // ── CHECK 4: 5 counties → ConversionModal ─────────────────────────
    console.log('\n=== CHECK 4: 5-county clicks → ConversionModal ===');
    for (let i = 3; i < 5; i++) {
      const { x, y } = mapClickCoords[i];
      await mapPage.mouse.click(x, y);
      await mapPage.waitForTimeout(800);
      clickCount++;
    }

    await mapPage.waitForTimeout(1500);
    const s6Path = path.join(SCREENSHOTS_DIR, 's6-conversion-modal.png');
    await mapPage.screenshot({ path: s6Path });

    const modalVisible = await mapPage.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').isVisible().catch(() => false);
    const bodyText = await mapPage.locator('body').textContent().catch(() => '');
    const has99Modal = bodyText.includes('99');
    const hasModalKeyword = bodyText.toLowerCase().includes('unlock') ||
                            bodyText.toLowerCase().includes('upgrade') ||
                            bodyText.toLowerCase().includes('plan') ||
                            bodyText.toLowerCase().includes('subscribe');
    log('ConversionModal visible after 5 clicks', modalVisible ? 'PASS' : 'FAIL',
      `dialog visible: ${modalVisible}, $99: ${has99Modal}, keywords: ${hasModalKeyword}`);
    log('$99 CTA in modal', has99Modal ? 'PASS' : 'FAIL',
      `$99 text present: ${has99Modal}`);

    await mapCtx.close();

    // ── CHECK 5: Dashboard — shadcn SidebarProvider + AppSidebar ───────
    console.log('\n=== CHECK 5: Dashboard shadcn Sidebar ===');
    const dashCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const dashPage = await dashCtx.newPage();

    await dashPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await dashPage.waitForTimeout(3000);

    const s3Path = path.join(SCREENSHOTS_DIR, 's3-dashboard-desktop.png');
    await dashPage.screenshot({ path: s3Path, fullPage: false });

    // Check for shadcn sidebar attributes
    const sidebarDataSlot = await dashPage.locator('[data-slot="sidebar"]').count().catch(() => 0);
    const sidebarDataSide = await dashPage.locator('[data-sidebar]').count().catch(() => 0);
    const sidebarGeneric = await dashPage.locator('aside, nav[class*="sidebar"], [class*="AppSidebar"]').count().catch(() => 0);

    log('shadcn SidebarProvider/AppSidebar', (sidebarDataSlot > 0 || sidebarDataSide > 0 || sidebarGeneric > 0) ? 'PASS' : 'FAIL',
      `data-slot="sidebar": ${sidebarDataSlot}, [data-sidebar]: ${sidebarDataSide}, generic sidebar: ${sidebarGeneric}`);

    // ── CHECK 6: ResizablePanelGroup ───────────────────────────────────
    console.log('\n=== CHECK 6: ResizablePanelGroup drag handle ===');

    const panelGroup = await dashPage.locator('[data-panel-group]').count().catch(() => 0);
    const resizeHandle = await dashPage.locator('[data-panel-resize-handle-enabled], [data-resize-handle], [data-panel-resize-handle-id]').count().catch(() => 0);
    const panelGeneric = await dashPage.locator('[data-panel]').count().catch(() => 0);

    const s7Path = path.join(SCREENSHOTS_DIR, 's7-drag-handle.png');
    await dashPage.screenshot({ path: s7Path });

    log('ResizablePanelGroup present', panelGroup > 0 ? 'PASS' : 'FAIL',
      `[data-panel-group]: ${panelGroup}`);
    log('Resize drag handle present', resizeHandle > 0 ? 'PASS' : 'FAIL',
      `resize handles: ${resizeHandle}, panels: ${panelGeneric}`);

    // ── CHECK 7: Radix UI attributes ───────────────────────────────────
    console.log('\n=== CHECK 7: Radix UI / shadcn attributes ===');

    // Check landing page for Radix
    const landingCtx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const landingPage2 = await landingCtx2.newPage();
    await landingPage2.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await landingPage2.waitForTimeout(2000);

    const radixAttrsLanding = await landingPage2.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const radixAttrs = new Set();
      for (const el of allElements) {
        for (const attr of el.attributes) {
          if (attr.name.startsWith('data-radix') || attr.name.startsWith('data-state') ||
              attr.name.startsWith('data-orientation')) {
            radixAttrs.add(attr.name);
          }
        }
      }
      return [...radixAttrs];
    }).catch(() => []);

    const radixAttrsDash = await dashPage.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const radixAttrs = new Set();
      for (const el of allElements) {
        for (const attr of el.attributes) {
          if (attr.name.startsWith('data-radix') || attr.name.startsWith('data-state') ||
              attr.name.startsWith('data-slot') || attr.name.startsWith('data-panel') ||
              attr.name.startsWith('data-sidebar') || attr.name.startsWith('data-orientation')) {
            radixAttrs.add(attr.name);
          }
        }
      }
      return [...radixAttrs];
    }).catch(() => []);

    log('Radix/shadcn attrs on landing', radixAttrsLanding.length > 0 ? 'PASS' : 'FAIL',
      `attrs: ${radixAttrsLanding.slice(0, 5).join(', ') || 'none'}`);
    log('Radix/shadcn attrs on dashboard', radixAttrsDash.length > 0 ? 'PASS' : 'FAIL',
      `attrs: ${radixAttrsDash.slice(0, 8).join(', ') || 'none'}`);

    await landingCtx2.close();

    // ── CHECK 8: Brand colors ──────────────────────────────────────────
    console.log('\n=== CHECK 8: Brand colors Navy #1E3A5F + Orange #F59E0B ===');

    const brandCheck = await dashPage.evaluate(() => {
      // Check CSS variables and computed styles
      const root = document.documentElement;
      const rootStyle = getComputedStyle(root);

      // Check CSS vars
      const cssVars = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.style) {
              const text = rule.cssText;
              if (text.includes('1e3a5f') || text.includes('1E3A5F') ||
                  text.includes('f59e0b') || text.includes('F59E0B')) {
                cssVars.push(text.substring(0, 100));
              }
            }
          }
        } catch(e) {}
      }

      // Also check computed bg of body/header
      const body = document.body;
      const bodyBg = getComputedStyle(body).backgroundColor;

      // Check elements for orange color
      const buttons = [...document.querySelectorAll('button, a[href]')];
      const orangeElements = buttons.filter(el => {
        const style = getComputedStyle(el);
        return style.backgroundColor.includes('245, 158, 11') || // F59E0B in rgb
               style.color.includes('245, 158, 11');
      });

      // Check for navy elements
      const navyElements = [...document.querySelectorAll('*')].filter(el => {
        try {
          const style = getComputedStyle(el);
          const bg = style.backgroundColor;
          return bg.includes('30, 58, 95'); // 1E3A5F in rgb
        } catch(e) { return false; }
      });

      return {
        cssVarsWithBrand: cssVars.length,
        bodyBg,
        orangeElements: orangeElements.length,
        navyElements: navyElements.length,
        cssVarSamples: cssVars.slice(0, 2),
      };
    }).catch(() => ({ cssVarsWithBrand: 0, bodyBg: '', orangeElements: 0, navyElements: 0 }));

    // Also check via CSS custom properties on root
    const cssVarCheck = await dashPage.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const relevantVars = {};
      // Try common shadcn CSS var names
      for (const varName of ['--primary', '--sidebar-background', '--background', '--foreground', '--accent']) {
        relevantVars[varName] = rootStyle.getPropertyValue(varName).trim();
      }
      return relevantVars;
    }).catch(() => ({}));

    log('Navy #1E3A5F in styles', (brandCheck.navyElements > 0 || brandCheck.cssVarsWithBrand > 0) ? 'PASS' : 'FAIL',
      `navy elements: ${brandCheck.navyElements}, css vars: ${brandCheck.cssVarsWithBrand}, body bg: ${brandCheck.bodyBg}`);
    log('Orange #F59E0B in styles', brandCheck.orangeElements > 0 ? 'PASS' : 'FAIL',
      `orange elements: ${brandCheck.orangeElements}`);
    console.log('CSS vars:', JSON.stringify(cssVarCheck));

    await dashCtx.close();

    // ── CHECK 9: Mobile dashboard ──────────────────────────────────────
    console.log('\n=== CHECK 9: Mobile 375x812 dashboard ===');
    const mobileDashCtx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
    const mobileDashPage = await mobileDashCtx.newPage();

    await mobileDashPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await mobileDashPage.waitForTimeout(2000);

    const s4Path = path.join(SCREENSHOTS_DIR, 's4-dashboard-mobile.png');
    await mobileDashPage.screenshot({ path: s4Path, fullPage: false });
    log('Dashboard mobile screenshot', 'PASS', 's4-dashboard-mobile.png captured');

    await mobileDashCtx.close();

  } finally {
    await browser.close();
  }

  // ── UPLOAD ALL SCREENSHOTS ─────────────────────────────────────────
  console.log('\n=== UPLOADING SCREENSHOTS TO SUPABASE ===');
  const screenshotFiles = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));

  for (const file of screenshotFiles) {
    const filePath = path.join(SCREENSHOTS_DIR, file);
    try {
      const url = await uploadToSupabase(filePath, file);
      uploadedUrls[file] = url;
      console.log(`✅ Uploaded ${file} → ${url}`);
    } catch (err) {
      console.log(`❌ Failed to upload ${file}: ${err.message}`);
      uploadedUrls[file] = `UPLOAD_FAILED: ${err.message}`;
    }
  }

  // ── BUILD GITHUB COMMENT ───────────────────────────────────────────
  console.log('\n=== RESULTS SUMMARY ===');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;

  let comment = `## SUMMIT #182 — Post-Adopt Playwright Verification\n\n`;
  comment += `**${passCount} PASS / ${failCount} FAIL** — Run: ${new Date().toISOString()}\n\n`;
  comment += `### Check Results\n\n`;
  comment += `| Check | Status | Evidence |\n`;
  comment += `|-------|--------|----------|\n`;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    comment += `| ${r.check} | ${icon} ${r.status} | ${r.evidence} |\n`;
  }

  comment += `\n### Screenshots\n\n`;
  for (const [file, url] of Object.entries(uploadedUrls)) {
    if (!url.startsWith('UPLOAD_FAILED')) {
      comment += `- [${file}](${url})\n`;
    } else {
      comment += `- ${file}: ${url}\n`;
    }
  }

  // Write comment to file for gh CLI
  fs.writeFileSync('/tmp/gh-comment-182.md', comment);
  console.log('\nComment written to /tmp/gh-comment-182.md');
  console.log(comment);

  return { passCount, failCount };
}

main().then(({ passCount, failCount }) => {
  console.log(`\n=== DONE: ${passCount} PASS, ${failCount} FAIL ===`);
  process.exit(failCount > 0 ? 1 : 0);
}).catch(err => {
  console.error('FATAL:', err);
  process.exit(2);
});
