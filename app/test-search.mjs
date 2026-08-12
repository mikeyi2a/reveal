import { chromium } from 'playwright';
const url = 'http://localhost:5173/dashboard';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1746, height: 990 } });
const page = await context.newPage();
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1800);

await page.fill('input[placeholder^="Manual lookup"]', 'Romans 7:15');
// click "Search" (not Add to queue)
await page.evaluate(() => {
  const inp = document.querySelector('input[placeholder^="Manual lookup"]');
  let el = inp;
  for (let i = 0; i < 5 && el; i++) {
    const b = [...el.querySelectorAll('button')].find(x => x.textContent.trim() === 'Search');
    if (b) { b.click(); return; }
    el = el.parentElement;
  }
});
await page.waitForTimeout(1500);

const r = await page.evaluate(() => ({
  bodyHasConfirm: document.body.innerText.includes('Confirm'),
  bodyHasRomans: document.body.innerText.includes('Romans'),
  detectionCardBtns: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /Confirm|Display|Dismiss|Stage/.test(t)),
  queueLenText: (() => { const m = document.body.innerText.match(/(\d+)\s+verses? detected/i); return m ? m[1] : 'n/a'; })(),
}));
console.log('SEARCH RESULT:', JSON.stringify(r, null, 2));
console.log('LOGS:', logs.slice(-15).join('\n'));
await browser.close();
