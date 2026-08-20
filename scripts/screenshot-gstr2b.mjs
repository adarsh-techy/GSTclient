// Playwright screenshot of the GSTR-2B page (B2B + IMPG sections).
//
// Prereqs: backend running (https://localhost:7124) and the Vite dev server
// (npm run dev). Then: npm run screenshot:gstr2b
//
// Env overrides: PW_API, PW_BASE_URL (vite), PW_TENANT, PW_USER, PW_PASS,
// PW_PERIOD, PW_OUT. Self-logs in and seeds auth into localStorage.
import { chromium } from 'playwright';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // accept the .NET dev cert

const API = process.env.PW_API || 'https://localhost:7124';
const BASE = process.env.PW_BASE_URL || 'http://localhost:5173';
const TENANT = process.env.PW_TENANT || '11111111-1111-1111-1111-111111111111';
const USER = process.env.PW_USER || 'LISS';
const PASS = process.env.PW_PASS || '123';
const PERIOD = process.env.PW_PERIOD || '202604';
const OUT = process.env.PW_OUT || 'gstr2b-screenshot.png';

const res = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT },
  body: JSON.stringify({ username: USER, password: PASS }),
});
if (!res.ok) throw new Error(`login failed: ${res.status}`);
const d = await res.json();
const user = { emplCode: d.emplCode, displayName: d.displayName, role: d.role, tenantId: d.tenantId, expiresAt: d.expiresAt };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });

// Seed auth into localStorage before the app boots (matches AuthContext keys).
await ctx.addInitScript(([token, u]) => {
  localStorage.setItem('gstautopilot.jwt', token);
  localStorage.setItem('gstautopilot.user', u);
}, [d.accessToken, JSON.stringify(user)]);

const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[page error]', m.text()); });

await page.goto(`${BASE}/gstr2b`, { waitUntil: 'load' });
await page.waitForSelector('h1:has-text("GSTR-2B")', { timeout: 20000 });
await page.waitForSelector('#period-select');
await page.selectOption('#period-select', PERIOD).catch(() => console.log('(period not selectable, using default)'));
await page.waitForSelector('h2:has-text("B2B")', { timeout: 20000 });
await page.waitForSelector('h2:has-text("IMPG")', { timeout: 20000 });
await page.waitForTimeout(700);

await page.screenshot({ path: OUT, fullPage: true });
console.log('screenshot written:', OUT);

await browser.close();
