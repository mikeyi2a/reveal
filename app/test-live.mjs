import { chromium } from 'playwright';
const url = 'http://localhost:5173/dashboard';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1746, height: 990 } });
const page = await context.newPage();
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500); // let Bible load

const push = async (text) => page.evaluate((t) => (window).__revealTestPush(t), text);

// Inject a CHAPTER-level spoken reference (what preachers say naturally)
await push('Romans 7');
await page.waitForTimeout(800);
const afterChapter = await page.evaluate(() => document.body.innerText.includes('Romans'));

// Inject a VERSE-level reference
await push('Romans 7:15');
await page.waitForTimeout(800);
const r = await page.evaluate(() => ({
  hasConfirm: document.body.innerText.includes('Confirm'),
  cards: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /Confirm|Display|Dismiss|Stage/.test(t)),
}));

console.log('AFTER CHAPTER INJECT (Romans 7):', afterChapter);
console.log('AFTER VERSE INJECT (Romans 7:15):', JSON.stringify(r));
console.log('SKIPPED LOGS:', logs.filter(l => l.includes('skipped')).slice(-5).join('\n'));
await browser.close();
