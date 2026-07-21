const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const base = process.env.Q3_BASE_URL || 'http://127.0.0.1:56809';
  const executablePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ headless: true, executablePath });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(`${base}/visual_workspace_cn/index.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-channel="warning_graph"]').click();
  await page.locator('.q3-shell').waitFor();

  assert.equal(await page.locator('.q3-time-dot').count(), 77);
  assert.match(await page.locator('.q3-score b').textContent(), /83%/);
  assert.match(await page.locator('.q3-pair-b').textContent(), /05\.29/);

  await page.locator('.q3-time-dot[data-event="20460524_05_006"]').click({ force: true });
  assert.match(await page.locator('.q3-score b').textContent(), /71%/);

  await page.locator('[data-q3-mode="3d"]').click();
  assert.equal(await page.locator('[data-q3-mode="3d"]').getAttribute('class'), 'active');

  await page.locator('.q3-control-copy [data-control="signed_artifact"]').click();
  await page.locator('.q3-control-copy [data-control="cross_account_dlp"]').click();
  assert.match(await page.locator('.q3-route-count').textContent(), /3 \/ 3/);

  await page.screenshot({
    path: path.resolve('visual_workspace_cn/q3-warning-graph-1440x900.png'),
    fullPage: false
  });
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('Q3 warning graph smoke test passed: 77 nodes, A/B sync, 3D toggle, and 3/3 route coverage.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
