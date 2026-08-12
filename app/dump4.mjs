import { chromium } from 'playwright';
const url = 'http://localhost:5173/dashboard';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1746, height: 990 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);
await page.fill('input[placeholder^="Manual lookup"]', 'John 3:16');
await page.evaluate(() => {
  const inp = document.querySelector('input[placeholder^="Manual lookup"]');
  let el = inp;
  for (let i = 0; i < 4 && el; i++) {
    const b = [...el.querySelectorAll('button')].find(x => x.textContent.trim() === 'Search');
    if (b) { b.click(); return; }
    el = el.parentElement;
  }
});
await page.waitForTimeout(1000);
const btns = await page.evaluate(() => {
  const inputRow = document.querySelector('input[placeholder^="Manual lookup"]').closest('div');
  const card = inputRow?.parentElement?.parentElement; // detection card
  const all = [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(Boolean);
  return all.slice(0, 30);
});
console.log('BUTTONS:', JSON.stringify(btns));
await browser.close();
