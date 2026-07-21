const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const base = process.env.Q3_BASE_URL || 'http://127.0.0.1:56809';
  const executablePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ headless: true, executablePath });
  const sizes = [[1366, 768], [1440, 900], [1920, 1080]];
  for (const [width, height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(`${base}/visual_workspace_cn/index.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-channel="warning_graph"]').click();
    await page.locator('.q3-shell').waitFor();
    assert.equal(await page.locator('.q3-time-dot').count(), 77);
    assert.match(await page.locator('.q3-score b').textContent(), /83%/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `horizontal overflow at ${width}x${height}: ${overflow}px`);
    await page.screenshot({
      path: path.resolve(`visual_workspace_cn/q3-warning-graph-${width}x${height}.png`),
      fullPage: false
    });
    await page.close();
  }
  await browser.close();
  console.log('Q3 visual matrix passed at 1366x768, 1440x900, and 1920x1080.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
