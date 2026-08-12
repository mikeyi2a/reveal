import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:5173/dashboard';
const out = process.argv[3] || '/tmp/dash-clean.png';
const browser = await chromium.launch();
// fresh context = no persisted state, clean session
const context = await browser.newContext({ viewport: { width: 1746, height: 990 } });
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500); // let whisper init; no detections should appear yet
await page.screenshot({ path: out, clip: { x: 700, y: 100, width: 1046, height: 800 } });
await browser.close();
console.log('clean shot saved', out);
