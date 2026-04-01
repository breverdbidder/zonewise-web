import { test } from '@playwright/test';

test('hero 3D after fix', async ({ page }) => {
  const consoleErrors: string[] = [];
  const r3fErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      consoleErrors.push(text);
      if (text.includes('ReactCurrentBatch') || text.includes('three') || text.includes('fiber') || text.includes('WebGL') || text.includes('canvas')) {
        r3fErrors.push(text);
      }
    }
  });
  page.on('pageerror', (err: Error) => {
    consoleErrors.push('PAGE ERROR: ' + err.message);
    if (err.message.includes('ReactCurrentBatch') || err.message.includes('three') || err.message.includes('fiber')) {
      r3fErrors.push('PAGE ERROR: ' + err.message);
    }
  });

  try {
    await page.goto('https://zonewise.ai', { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e: any) {
    console.log('Nav warning:', e.message);
  }
  
  // Wait for React hydration + 3D init
  await page.waitForTimeout(6000);
  
  const canvasCount = await page.locator('canvas').count();
  console.log('CANVAS_COUNT:', canvasCount);
  
  const heroInfo = await page.evaluate(() => {
    const section = document.querySelector('section');
    if (!section) return JSON.stringify({error: 'no section - page crashed'});
    const rect = section.getBoundingClientRect();
    return JSON.stringify({
      height: Math.round(rect.height),
      width: Math.round(rect.width),
      hasCanvas: !!section.querySelector('canvas'),
      totalCanvas: document.querySelectorAll('canvas').length,
    });
  });
  console.log('HERO_INFO:', heroInfo);
  
  console.log('R3F-SPECIFIC ERRORS:', r3fErrors.length ? r3fErrors.join('\n') : 'NONE - good!');
  console.log('ALL ERRORS:', JSON.stringify(consoleErrors.filter(e => 
    !e.includes('clerk') && !e.includes('ERR_NAME_NOT_RESOLVED') && !e.includes('404') && !e.includes('MIME') && !e.includes('script.js')
  )));
  
  await page.screenshot({ path: '/home/runner/pw-test/hero_after.png', fullPage: false });
  console.log('SCREENSHOT saved at /home/runner/pw-test/hero_after.png');
});
