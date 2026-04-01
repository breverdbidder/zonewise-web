import { test } from '@playwright/test';
import * as fs from 'fs';

test('hero 3D check', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err: Error) => consoleErrors.push('PAGE ERROR: ' + err.message));

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
    if (!section) return JSON.stringify({error: 'no section'});
    const rect = section.getBoundingClientRect();
    const firstDiv = section.querySelector('div');
    return JSON.stringify({
      height: Math.round(rect.height),
      width: Math.round(rect.width),
      hasCanvas: !!section.querySelector('canvas'),
      totalCanvas: document.querySelectorAll('canvas').length,
      sectionClasses: section.className,
      firstChildTag: firstDiv?.tagName,
      innerHTML_preview: section.innerHTML.substring(0, 300),
    });
  });
  console.log('HERO_INFO:', heroInfo);
  
  const webglInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return 'no canvas';
    try {
      const gl = (canvas as HTMLCanvasElement).getContext('webgl2') || (canvas as HTMLCanvasElement).getContext('webgl');
      return gl ? 'WebGL OK' : 'no WebGL context';
    } catch(e: any) { return 'WebGL error: ' + e.message; }
  });
  console.log('WEBGL:', webglInfo);
  
  console.log('CONSOLE ERRORS:', JSON.stringify(consoleErrors, null, 2));
  
  await page.screenshot({ path: '/home/runner/pw-test/hero_before.png', fullPage: false });
  console.log('SCREENSHOT saved at /home/runner/pw-test/hero_before.png');
});
