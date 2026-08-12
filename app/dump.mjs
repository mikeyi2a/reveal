import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:5173/dashboard';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1728, height: 1080 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);
const html = await page.evaluate(() => {
  const aside = document.querySelector('aside');
  return aside ? aside.innerHTML.slice(0, 2500) : 'NO ASIDE';
});
console.log(html);
await browser.close();
