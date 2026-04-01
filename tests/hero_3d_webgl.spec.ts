import { test } from '@playwright/test';

test('hero 3D with WebGL', async ({ browser }) => {
  // Launch with WebGL support
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    args: ['--enable-webgl', '--use-gl=swiftshader'],
  } as any);
  const page = await context.newPage();
  
  const consoleErrors: string[] = [];
  const consoleAll: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleAll.push('WARN: ' + msg.text().substring(0, 200));
  });
  page.on('pageerror', (err: Error) => consoleErrors.push('PAGE ERROR: ' + err.message));

  try {
    await page.goto('https://zonewise.ai', { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e: any) {
    console.log('Nav warning:', e.message);
  }
  
  await page.waitForTimeout(8000);
  
  const canvasCount = await page.locator('canvas').count();
  console.log('CANVAS_COUNT:', canvasCount);
  
  const renderInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return JSON.stringify({error: 'no canvas'});
    
    // Check canvas dimensions
    const rect = canvas.getBoundingClientRect();
    
    // Check WebGL
    let webglStatus = 'unknown';
    try {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      webglStatus = gl ? 'active' : 'failed';
      if (gl) {
        // Check if anything was drawn
        const renderer = (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).RENDERER);
        webglStatus = `active - renderer: ${renderer}`;
      }
    } catch(e: any) { webglStatus = 'error: ' + e.message; }
    
    // Check canvas pixel content (is it all black?)
    let pixelInfo = 'unknown';
    try {
      const ctx2d = canvas.getContext('2d');
      if (ctx2d) {
        const px = ctx2d.getImageData(canvas.width/2, canvas.height/2, 1, 1).data;
        pixelInfo = `center pixel: rgba(${px[0]},${px[1]},${px[2]},${px[3]})`;
      }
    } catch(e: any) { pixelInfo = 'pixel check error: ' + e.message; }
    
    return JSON.stringify({
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      webglStatus,
      pixelInfo,
    });
  });
  console.log('RENDER_INFO:', renderInfo);
  
  // Relevant console warnings (three.js issues)
  const threeWarnings = consoleAll.filter(w => w.toLowerCase().includes('three') || w.toLowerCase().includes('webgl') || w.toLowerCase().includes('fiber') || w.toLowerCase().includes('gl'));
  console.log('THREE/WEBGL WARNINGS:', threeWarnings.join('\n') || 'none');
  
  console.log('CONSOLE ERRORS (filtered):', consoleErrors.filter(e => !e.includes('clerk') && !e.includes('ERR_NAME_NOT_RESOLVED') && !e.includes('404') && !e.includes('MIME')).join('\n') || 'none');
  
  await page.screenshot({ path: '/home/runner/pw-test/hero_webgl.png', fullPage: false });
  console.log('SCREENSHOT: /home/runner/pw-test/hero_webgl.png');
  
  await context.close();
});
