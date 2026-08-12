import { chromium } from 'playwright';
const url = 'http://localhost:5173/dashboard';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1746, height: 990 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);
const html = await page.evaluate(() => {
  const inp = document.querySelector('input[placeholder^="Manual lookup"]');
  if (!inp) return 'NO INPUT';
  // walk up to find the row containing the input and any buttons
  let el = inp.parentElement;
  for (let i = 0; i < 4 && el; i++) {
    const btns = [...el.querySelectorAll('button')].map(b => b.textContent.trim());
    if (btns.length) return `depth ${i}: buttons=[${btns.join(' | ')}]`;
    el = el.parentElement;
  }
  return 'no buttons found in 4 levels';
});
console.log(html);
await browser.close();
