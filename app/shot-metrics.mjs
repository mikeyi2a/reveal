import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:5173/dashboard';
const out = process.argv[3] || '/tmp/dash-metrics-full.png';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1746, height: 990 } });
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);
// capture the metrics row region: below sidebar (~x 280) to right, y ~60-120
await page.screenshot({ path: out, clip: { x: 280, y: 56, width: 1460, height: 70 } });
await browser.close();
console.log('metrics shot saved', out);
