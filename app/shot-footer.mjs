import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:5173/dashboard';
const out = process.argv[3] || '/tmp/footer-check.png';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1746, height: 990 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1200);
// turn auto-push on to verify its beam + border
try { await page.getByText('Auto-push', { exact: true }).click({ timeout: 3000 }); } catch {}
await page.waitForTimeout(800);
// footer is near bottom; clip the bottom 100px full width
await page.screenshot({ path: out, clip: { x: 0, y: 990 - 100, width: 1746, height: 100 } });
await browser.close();
console.log('footer saved', out);
