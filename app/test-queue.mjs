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

// Add a verse to the queue via the manual "Add to queue" button
await page.fill('input[placeholder^="Manual lookup"]', 'Romans 7:15');
await page.evaluate(() => {
  const inp = document.querySelector('input[placeholder^="Manual lookup"]');
  let el = inp;
  for (let i = 0; i < 5 && el; i++) {
    const b = [...el.querySelectorAll('button')].find(x => x.textContent.trim() === 'Add to queue');
    if (b) { b.click(); return; }
    el = el.parentElement;
  }
});
await page.waitForTimeout(1200);

const detection = await page.evaluate(() => {
  const txt = document.body.innerText;
  return {
    hasConfirm: txt.includes('Confirm'),
    hasRomans: txt.includes('Romans'),
    buttons: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(Boolean).slice(0, 25),
  };
});
console.log('DETECTION RESULT:', JSON.stringify(detection, null, 2));
console.log('CONSOLE LOGS (last 20):');
console.log(logs.slice(-20).join('\n'));
await browser.close();
