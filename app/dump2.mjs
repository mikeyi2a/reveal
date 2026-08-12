import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:5173/theme-studio';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1746, height: 990 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1200);
const info = await page.evaluate(() => {
  const aside = document.querySelector('aside');
  if (!aside) return 'NO ASIDE';
  const btns = [...aside.querySelectorAll('button')].map(b => ({ aria: b.getAttribute('aria-label'), title: b.getAttribute('title') }));
  return JSON.stringify({ bg: getComputedStyle(aside).backgroundColor, buttons: btns }, null, 2);
});
console.log(info);
await browser.close();
