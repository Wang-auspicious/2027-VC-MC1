const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const base = process.env.STORY_BASE_URL || 'http://127.0.0.1:8765';
  const executablePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ headless: true, executablePath });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(`${base}/visual_workspace_cn/index.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('.message-row').first().waitFor();
  assert.match(await page.locator('#current-channel-name').textContent(), /协作群聊/);
  assert.equal(await page.locator('.case-verdict').count(), 0);
  assert.equal(await page.locator('#evidence-atlas').count(), 1);
  await page.evaluate(() => window.WorkspaceBridge.selectMessage('20460529_08_012'));
  assert.match(await page.locator('.selection-id').textContent(), /20460529_08_012/);

  assert.deepEqual(errors, []);
  await browser.close();
  console.log('Opening chat smoke test passed: the workspace opens on real messages and exposes the atlas bridge.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
