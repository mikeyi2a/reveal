import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:5173/dashboard';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1746, height: 990 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1200);
const m = await page.evaluate(() => {
  const header = [...document.querySelectorAll('header')].find(h => h.textContent.includes('Live Console'));
  if (!header) return { error: 'no header' };
  const parent = header.parentElement;
  const siblings = [...parent.children];
  const headerIdx = siblings.indexOf(header);
  const next = siblings[headerIdx + 1];
  const hb = header.getBoundingClientRect();
  const nb = next?.getBoundingClientRect();
  return {
    headerBottom: Math.round(hb.bottom),
    nextTag: next?.tagName,
    nextTop: nb ? Math.round(nb.top) : null,
    gap: (nb) ? Math.round(nb.top - hb.bottom) : null,
    nextChildren: next ? [...next.children].slice(0,3).map(c => c.textContent?.slice(0,20)) : null,
  };
});
console.log(JSON.stringify(m, null, 2));
await browser.close();
