const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const base = process.env.ATLAS_BASE_URL || 'http://127.0.0.1:8765';
  const executablePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const out = path.resolve('artifacts/evidence-atlas');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath });
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${base}/visual_workspace_cn/index.html`, { waitUntil: 'networkidle' });
    await page.locator('#atlas-entry').click();
    await page.locator('.atlas-stage').waitFor();
    for (const id of ['atlas-universe', 'atlas-q3', 'atlas-q2', 'atlas-q1', 'atlas-igc', 'atlas-prevention']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
      const stage = await page.locator('.atlas-stage').boundingBox();
      const rail = await page.locator('.atlas-evidence-rail').boundingBox();
      assert.ok(stage && stage.width > viewport.width * 0.72);
      assert.ok(rail && rail.x + rail.width <= viewport.width + 1);
      await page.screenshot({ path: path.join(out, `${viewport.width}x${viewport.height}-${id}.png`), fullPage: false });
    }
    await page.close();
  }
  await browser.close();
  console.log('Evidence atlas visual verification passed at 1366, 1440, and 1920 widths.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
