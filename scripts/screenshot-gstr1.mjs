// Playwright screenshot of the GSTR-1 tabs (Summary + B2B). See
// screenshot-dashboard.mjs for the auth-seeding approach.
import { chromium } from 'playwright';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API = process.env.PW_API || 'https://localhost:7124';
const BASE = process.env.PW_BASE_URL || 'http://localhost:5173';
const TENANT = process.env.PW_TENANT || '11111111-1111-1111-1111-111111111111';
const USER = process.env.PW_USER || 'LISS';
const PASS = process.env.PW_PASS || '123';
const PERIOD = process.env.PW_PERIOD || '202605';

const res = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT },
  body: JSON.stringify({ username: USER, password: PASS }),
});
if (!res.ok) throw new Error(`login failed: ${res.status}`);
const d = await res.json();
const user = { emplCode: d.emplCode, displayName: d.displayName, role: d.role, tenantId: d.tenantId, expiresAt: d.expiresAt };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.5, ignoreHTTPSErrors: true });
await ctx.addInitScript(([token, u]) => {
  localStorage.setItem('gstautopilot.jwt', token);
  localStorage.setItem('gstautopilot.user', u);
}, [d.accessToken, JSON.stringify(user)]);

const page = await ctx.newPage();
await page.goto(`${BASE}/gstr1`, { waitUntil: 'load' });
await page.waitForSelector('h1:has-text("GSTR-1")', { timeout: 20000 });
await page.waitForSelector('#period-select').catch(() => {});
await page.selectOption('#period-select', PERIOD).catch(() => {});
await page.waitForSelector('.tab', { timeout: 20000 });
await page.waitForTimeout(800);
await page.screenshot({ path: 'gstr1-summary.png', fullPage: true });
console.log('wrote gstr1-summary.png');

// Switch to the Export Invoices tab.
await page.getByRole('tab', { name: /Export Invoices/i }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: 'gstr1-exports.png', fullPage: true });
console.log('wrote gstr1-exports.png');

await browser.close();
