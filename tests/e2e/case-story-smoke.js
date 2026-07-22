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
  await page.locator('.case-story').waitFor();
  assert.equal(await page.locator('.case-act').count(), 5);
  assert.equal(await page.locator('.case-verdict').count(), 2);
  assert.equal(await page.locator('.case-chapter').count(), 3);
  assert.match(await page.locator('.case-story h1').textContent(), /为什么仍在最后一小时失去约束/);

  await page.locator('[data-story-chapter="q1"]').click();
  await page.locator('.evidence-workbench').waitFor();
  assert.match(await page.locator('.evidence-questions .active').textContent(), /边界如何被跨过/);
  await page.locator('[data-evidence-mode="3d"]').click();
  assert.match(await page.locator('[data-evidence-mode="3d"]').getAttribute('class'), /active/);
  await page.locator('#evidence-exit').click();
  await page.locator('.case-story').waitFor();

  await page.locator('[data-story-chapter="q2"]').click();
  await page.locator('.evidence-workbench').waitFor();
  assert.match(await page.locator('.evidence-questions .active').textContent(), /职责何时开始重叠/);
  await page.locator('#evidence-exit').click();
  await page.locator('.case-story').waitFor();

  await page.locator('[data-story-chapter="q3"]').click();
  await page.locator('.q3-shell').waitFor();
  assert.equal(await page.locator('.q3-time-dot').count(), 77);
  assert.match(await page.locator('.q3-score b').textContent(), /83%/);
  await page.locator('.q3-exit').click();
  await page.locator('.case-story').waitFor();

  assert.deepEqual(errors, []);
  await browser.close();
  console.log('Case story smoke test passed: five acts, dual verdicts, and Q1-Q3 visual routes stay connected.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
