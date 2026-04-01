import { test } from '@playwright/test';

test('hero debug - full error trace', async ({ page }) => {
  const allErrors: string[] = [];
  
  page.on('console', msg => {
    allErrors.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err: Error) => {
    allErrors.push(`[pageerror] ${err.stack || err.message}`);
  });

  try {
    await page.goto('https://zonewise.ai', { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch (e: any) {
    console.log('Nav:', e.message);
  }
  
  await page.waitForTimeout(3000);
  
  // Print ALL errors/warnings
  console.log('=== ALL CONSOLE OUTPUT ===');
  allErrors.forEach(e => console.log(e));
  
  // Check page title and if page loaded
  const title = await page.title();
  console.log('PAGE TITLE:', title);
  
  // Check if there's an error boundary message
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('BODY TEXT:', bodyText);
  
  await page.screenshot({ path: '/home/runner/pw-test/hero_debug.png', fullPage: false });
});
