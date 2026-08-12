import { chromium } from 'playwright';
const url = 'http://localhost:5173/dashboard';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1746, height: 990 } });
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);
await page.fill('input[placeholder^="Manual lookup"]', 'Romans 7:15');
await page.evaluate(() => {
  const inp = document.querySelector('input[placeholder^="Manual lookup"]');
  let el = inp; for (let i=0;i<5&&el;i++){const b=[...el.querySelectorAll('button')].find(x=>x.textContent.trim()==='Search');if(b){b.click();return;}el=el.parentElement;}
});
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/dash-detect-fixed.png', clip: { x: 700, y: 100, width: 1046, height: 600 } });
await browser.close();
console.log('saved /tmp/dash-detect-fixed.png');
