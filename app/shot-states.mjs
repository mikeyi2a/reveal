import { chromium } from 'playwright';
const url = 'http://localhost:5173/dashboard';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1746, height: 990 } });
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);

const lookup = page.locator('input[placeholder^="Manual lookup"]');
await lookup.waitFor({ state: 'visible' });
await lookup.fill('John 3:16');

// Click the Search button by walking up from the input to the row that owns it
await page.evaluate(() => {
  const inp = document.querySelector('input[placeholder^="Manual lookup"]');
  let el = inp;
  for (let i = 0; i < 4 && el; i++) {
    const b = [...el.querySelectorAll('button')].find(x => x.textContent.trim() === 'Search');
    if (b) { b.click(); return; }
    el = el.parentElement;
  }
  throw new Error('Search button not found');
});
await page.waitForTimeout(900);

const primary = page.locator('button:has-text("Confirm & display")');
await primary.waitFor({ state: 'visible', timeout: 5000 });
const pb = await primary.boundingBox();
const shot = async (name) => page.screenshot({ path: name, clip: { x: Math.max(0, pb.x - 24), y: Math.max(0, pb.y - 24), width: pb.width + 48, height: pb.height + 48 } });

await shot('/tmp/btn-rest.png');
await primary.hover();
await page.waitForTimeout(400);
await shot('/tmp/btn-hover.png');
await primary.click({ force: true });
await page.waitForTimeout(150);
await shot('/tmp/btn-press.png');

await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Auto-push');
  if (b) b.click();
});
await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/footer-beams.png', clip: { x: 280, y: 915, width: 1460, height: 75 } });

await browser.close();
console.log('OK');
