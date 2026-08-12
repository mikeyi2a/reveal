import { chromium } from 'playwright';
const url = 'http://localhost:5173/dashboard';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1746, height: 990 } });
const page = await context.newPage();
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

const thr = await page.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => e.textContent === '85%' && e.tagName !== 'BODY');
  return el ? el.textContent : 'not-found';
});
console.log('UI THRESHOLD LABEL:', thr);

const push = async (text) => page.evaluate((t) => (window).__revealTestPush(t), text);
await push('Romans 7');
await page.waitForTimeout(700);
const cardsAfterChapter = await page.evaluate(() => [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>/Confirm|Display/.test(t)).length);
console.log('CARDS after "Romans 7" inject:', cardsAfterChapter);
console.log('SKIP LOGS:', logs.filter(l=>l.includes('skipped')).join(' | ') || 'NONE');

await browser.close();
