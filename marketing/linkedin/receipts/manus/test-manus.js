const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname);
const PROMPT = `Score all 197 upcoming Brevard County, Florida foreclosure auctions scheduled for April-May 2026 for maximum bid. Use the 70% ARV rule. Return a table with case number, property address, ARV estimate, estimated repairs, lien position, max bid, confidence score. Include both judicial foreclosures and tax deed sales.`;

(async () => {
  const timing = { start: new Date().toISOString(), steps: [] };
  const log = (msg) => {
    const entry = { ts: new Date().toISOString(), msg };
    timing.steps.push(entry);
    console.log(`[${entry.ts}] ${msg}`);
  };

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    // Navigate to Manus
    log('Navigating to https://manus.im/app');
    const response = await page.goto('https://manus.im/app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    log(`Page loaded. Status: ${response?.status()}`);

    // Wait for page to settle
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: path.join(OUT, 'screenshot.png'), fullPage: true });
    log('Initial screenshot saved');

    // Get page title and URL (may have redirected)
    const finalUrl = page.url();
    const title = await page.title();
    log(`Final URL: ${finalUrl}`);
    log(`Page title: ${title}`);

    // Save page HTML
    const html = await page.content();
    fs.writeFileSync(path.join(OUT, 'session.html'), html);
    log('Page HTML saved');

    // Check for login/signup wall
    const loginSignals = [
      'input[type="email"]',
      'input[type="password"]',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
      'button:has-text("Login")',
      'a:has-text("Sign in")',
      'a:has-text("Log in")',
      'a:has-text("Sign up")',
      '[data-testid="login"]',
      'form[action*="login"]',
      'form[action*="signin"]',
      'form[action*="auth"]',
    ];

    const promptSignals = [
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]',
      '[role="textbox"]',
      'input[placeholder*="ask"]',
      'input[placeholder*="prompt"]',
      'textarea[placeholder*="ask"]',
      'textarea[placeholder*="prompt"]',
      'textarea[placeholder*="type"]',
      'input[placeholder*="type"]',
    ];

    let loginDetected = false;
    let loginElements = [];
    let promptDetected = false;
    let promptElements = [];

    // Check login signals
    for (const sel of loginSignals) {
      try {
        const count = await page.locator(sel).count();
        if (count > 0) {
          loginDetected = true;
          loginElements.push({ selector: sel, count });
          log(`LOGIN SIGNAL: Found ${count} element(s) matching "${sel}"`);
        }
      } catch (e) { /* ignore selector errors */ }
    }

    // Check prompt signals
    for (const sel of promptSignals) {
      try {
        const count = await page.locator(sel).count();
        if (count > 0) {
          promptElements.push({ selector: sel, count });
          log(`PROMPT SIGNAL: Found ${count} element(s) matching "${sel}"`);
        }
      } catch (e) { /* ignore selector errors */ }
    }

    // Check if URL redirected to auth page
    if (finalUrl.includes('login') || finalUrl.includes('signin') || finalUrl.includes('auth') || finalUrl.includes('sign-in')) {
      loginDetected = true;
      log(`LOGIN SIGNAL: URL contains auth path: ${finalUrl}`);
    }

    // Also check page text for login indicators
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const loginPhrases = ['sign in to continue', 'log in to continue', 'create an account', 'sign up to get started', 'welcome back'];
    for (const phrase of loginPhrases) {
      if (bodyText.toLowerCase().includes(phrase)) {
        loginDetected = true;
        log(`LOGIN SIGNAL: Page text contains "${phrase}"`);
      }
    }

    // Determine if prompt input is available without login
    if (promptElements.length > 0 && !loginDetected) {
      promptDetected = true;
    }

    // Decision point
    if (loginDetected) {
      log('BLOCKER: Login/signup wall detected. Stopping per instructions.');

      // Take another screenshot showing the login wall clearly
      await page.screenshot({ path: path.join(OUT, 'screenshot-login-wall.png'), fullPage: true });

      const blockerContent = `# Manus Live Test - Blocker Report

## Date
${new Date().toISOString()}

## URL Tested
https://manus.im/app

## Final URL (after redirects)
${finalUrl}

## Page Title
${title}

## Result
BLOCKED - Login/signup wall detected.

## Login Signals Detected
${loginElements.map(e => `- \`${e.selector}\` (${e.count} element(s))`).join('\n')}
${finalUrl !== 'https://manus.im/app' ? `- URL redirected to: ${finalUrl}` : ''}

## Prompt Input Elements Found
${promptElements.length > 0 ? promptElements.map(e => `- \`${e.selector}\` (${e.count} element(s))`).join('\n') : 'None visible (behind login wall)'}

## Body Text (first 500 chars)
\`\`\`
${bodyText.substring(0, 500)}
\`\`\`

## Conclusion
Manus requires authentication to access the app interface. Anonymous task submission is NOT possible.
No account was created per instructions.

## Artifacts
- screenshot.png - Initial page state
- screenshot-login-wall.png - Login wall detail
- session.html - Full page HTML
- timing.json - Event timeline
`;
      fs.writeFileSync(path.join(OUT, 'blocker.md'), blockerContent);
      log('blocker.md written');

    } else if (promptDetected) {
      log('Anonymous prompt input detected! Attempting submission...');

      // Try to find and fill the prompt
      const promptSel = promptElements[0].selector;
      const promptEl = page.locator(promptSel).first();

      try {
        await promptEl.click({ timeout: 5000 });
        await promptEl.fill(PROMPT);
        log('Prompt text entered');
        await page.screenshot({ path: path.join(OUT, 'screenshot-prompt-filled.png'), fullPage: true });

        // Look for submit button
        const submitSelectors = [
          'button[type="submit"]',
          'button:has-text("Send")',
          'button:has-text("Submit")',
          'button:has-text("Run")',
          'button:has-text("Go")',
          'button[aria-label="Send"]',
          'button[aria-label="Submit"]',
        ];

        let submitted = false;
        for (const sSel of submitSelectors) {
          try {
            const btn = page.locator(sSel).first();
            if (await btn.isVisible({ timeout: 2000 })) {
              await btn.click();
              submitted = true;
              log(`Clicked submit button: ${sSel}`);
              break;
            }
          } catch (e) { /* try next */ }
        }

        if (!submitted) {
          // Try Enter key
          await promptEl.press('Enter');
          log('Pressed Enter to submit');
          submitted = true;
        }

        if (submitted) {
          log('Waiting for response (up to 120s)...');
          // Wait for response - look for output appearing
          await page.waitForTimeout(10000);
          await page.screenshot({ path: path.join(OUT, 'screenshot-10s.png'), fullPage: true });

          // Wait more if content is still loading
          await page.waitForTimeout(30000);
          await page.screenshot({ path: path.join(OUT, 'screenshot-40s.png'), fullPage: true });

          // Check if login popped up after submission
          const postUrl = page.url();
          if (postUrl.includes('login') || postUrl.includes('auth')) {
            log('BLOCKER: Redirected to login after submission attempt');
          }

          // Capture final state
          const finalHtml = await page.content();
          fs.writeFileSync(path.join(OUT, 'session.html'), finalHtml);

          const outputText = await page.locator('body').innerText().catch(() => '');
          fs.writeFileSync(path.join(OUT, 'output.txt'), outputText);

          await page.screenshot({ path: path.join(OUT, 'screenshot-final.png'), fullPage: true });
          log('Final artifacts saved');
        }
      } catch (err) {
        log(`Error during prompt submission: ${err.message}`);
        await page.screenshot({ path: path.join(OUT, 'screenshot-error.png'), fullPage: true });
      }
    } else {
      log('No login wall and no prompt input detected. Unclear state.');
      await page.screenshot({ path: path.join(OUT, 'screenshot-unclear.png'), fullPage: true });

      const blockerContent = `# Manus Live Test - Unclear State

## Date
${new Date().toISOString()}

## URL Tested
https://manus.im/app

## Final URL
${finalUrl}

## Page Title
${title}

## Result
Neither login wall nor prompt input clearly detected. Manual inspection needed.

## Body Text (first 1000 chars)
\`\`\`
${bodyText.substring(0, 1000)}
\`\`\`

## Artifacts
- screenshot.png
- session.html
- timing.json
`;
      fs.writeFileSync(path.join(OUT, 'blocker.md'), blockerContent);
      log('blocker.md written for unclear state');
    }

    timing.end = new Date().toISOString();
    fs.writeFileSync(path.join(OUT, 'timing.json'), JSON.stringify(timing, null, 2));
    log('timing.json written');

  } catch (err) {
    log(`FATAL ERROR: ${err.message}`);
    timing.error = err.message;
    timing.end = new Date().toISOString();
    fs.writeFileSync(path.join(OUT, 'timing.json'), JSON.stringify(timing, null, 2));
  } finally {
    if (browser) await browser.close();
    log('Browser closed. Done.');
  }
})();
