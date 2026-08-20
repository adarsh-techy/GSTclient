// Quick screenshot of the Login page (shows the tenant/company picker).
import { chromium } from 'playwright';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = process.env.PW_BASE_URL || 'http://localhost:5173';
const OUT = process.env.PW_OUT || 'login-screenshot.png';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT, fullPage: true });
console.log('saved', OUT);
await browser.close();
