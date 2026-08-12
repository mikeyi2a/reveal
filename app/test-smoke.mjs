import { chromium } from 'playwright';
const url = 'http://localhost:5173/dashboard';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1746, height: 990 } });
const page = await context.newPage();
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);
const r = await page.evaluate(() => ({
  hasSpeakingNow: document.body.innerText.includes('SPEAKING NOW') || document.body.innerText.includes('Speaking'),
  hasListening: document.body.innerText.toLowerCase().includes('listening'),
  body: document.body.innerText.length,
}));
console.log('SMOKE:', JSON.stringify(r));
console.log('ERRORS:', logs.filter(l => /error|pageerror/i.test(l)).slice(-5).join(' | ') || 'NONE');
await browser.close();
