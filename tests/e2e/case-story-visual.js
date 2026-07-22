const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const base = process.env.STORY_BASE_URL || 'http://127.0.0.1:8765';
  const executablePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ headless: true, executablePath });
  const sizes = [[1366, 768], [1440, 900], [1920, 1080]];
  for (const [width, height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(`${base}/visual_workspace_cn/index.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('.case-story').waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `${width}x${height} has ${overflow}px horizontal overflow`);
    assert.equal(await page.locator('.case-act').count(), 5);
    await page.screenshot({ path: path.resolve(`visual_workspace_cn/story-reframe-${width}x${height}.png`), fullPage: false });
    if (width === 1440) {
      await page.locator('.case-story-chapters').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.resolve('visual_workspace_cn/story-reframe-lower-1440x900.png'), fullPage: false });
    }
    await page.close();
  }
  await browser.close();
  console.log('Case story visual check passed at 1366x768, 1440x900, and 1920x1080.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
