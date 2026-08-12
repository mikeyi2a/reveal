import { chromium } from 'playwright';
const url = 'http://localhost:5173/dashboard';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1746, height: 990 } });
const page = await context.newPage();
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

const r = await page.evaluate(async () => {
  const m = await import('/src/lib/referenceScanner.ts');
  const scan = (t) => m.scanText(t).map(x => `${x.book} ${x.chapter}${x.verseStart != null ? ':' + x.verseStart : ''}`);
  const cases = [
    'romens 7', 'romance 7 fifteen', 'romans seven fifteen', '1 corinth 3', '1 cor 3',
    'rom 7', 'rev 21', 'genisis 1', 'philipians 4', 'turn to phil 4',
    // regression guards from AGENTS rule 3:
    'romans 7 15', 'romans 7-15', 'romans 715', 'john 3:16', 'romans 8:28-30', 'psalm 119',
  ];
  const out = {};
  for (const c of cases) out[c] = scan(c);
  return out;
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
