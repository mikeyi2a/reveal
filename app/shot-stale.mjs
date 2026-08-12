import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:5173/dashboard';
const out = process.argv[3] || '/tmp/dash-stale.png';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1746, height: 990 } });
const page = await context.newPage();
// Simulate the USER's browser: stale localStorage with Romans 7:1-8 from prior testing
await page.addInitScript(() => {
  localStorage.setItem('reveal:projector', JSON.stringify({
    ref: 'ROMANS 7:1-8',
    text: 'For I am not sure...',
    verses: ['For I am not sure...'],
    book: 'Romans', chapter: 7, verseStart: 1, updatedAt: Date.now(),
  }));
});
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: out });
await browser.close();
console.log('stale-load shot saved', out);
