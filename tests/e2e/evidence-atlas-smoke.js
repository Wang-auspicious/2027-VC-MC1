const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const base = process.env.ATLAS_BASE_URL || 'http://127.0.0.1:8765';
  const executablePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ headless: true, executablePath });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(`${base}/visual_workspace_cn/index.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#atlas-entry').click();
  await page.locator('.atlas-stage').waitFor();
  assert.equal(await page.locator('.atlas-message-canvas').count(), 1);
  assert.equal(await page.locator('[data-atlas-layout]').count(), 3);
  assert.match(await page.locator('.atlas-status').textContent(), /912 messages/i);
  await page.locator('[data-atlas-layout="role"]').click();
  assert.equal(await page.locator('.atlas-stage').getAttribute('data-layout'), 'role');
  await page.evaluate(() => window.EvidenceAtlas.selectMessage('20460605_21_026'));
  assert.equal(await page.locator('.atlas-message-detail').count(), 1);
  assert.equal(await page.locator('[data-chain-id]').count(), 3);
  await page.locator('[data-chain-id]').first().click();
  assert.ok(await page.locator('[data-chain-message]').count() >= 3);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('Evidence atlas shell smoke test passed.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
