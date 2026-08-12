import { chromium } from 'playwright';
const url = 'http://localhost:5173/dashboard';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1746, height: 990 } });
const page = await context.newPage();
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

const push = async (text) => page.evaluate((t) => (window).__revealTestPush(t), text);

// Simulate Whisper mis-hearing "Romans" as "romens" and "Corinthians" as "corinth"
await push('please turn to romens chapter 7');
await page.waitForTimeout(700);
await push('now first corinth chapter 3');
await page.waitForTimeout(700);

const r = await page.evaluate(() => ({
  body: document.body.innerText.includes('Romans') && document.body.innerText.includes('Corinthians'),
  cards: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /Confirm & display|Dismiss|Stage/.test(t)),
  unresolved: document.body.innerText.includes('Heard'),
}));
console.log('LIVE INJECT RESULT:', JSON.stringify(r, null, 2));
console.log('UNRESOLVED/SKIP LOGS:', logs.filter(l => /Heard|skipped|no such passage/.test(l)).slice(-5).join(' | ') || 'NONE');

// Screenshot the detection area
await page.screenshot({ path: '/tmp/dash-corrected.png', clip: { x: 700, y: 100, width: 1046, height: 650 } });
await browser.close();
console.log('saved /tmp/dash-corrected.png');
