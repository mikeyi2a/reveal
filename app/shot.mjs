import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173/dashboard';
const out = process.argv[3] || '/tmp/app-shot.png';
const w = parseInt(process.argv[4] || '1728', 10);
const h = parseInt(process.argv[5] || '1080', 10);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
// give the app a moment to mount + any entrance motion to settle
await page.waitForTimeout(1500);
await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log('shot saved', out);
