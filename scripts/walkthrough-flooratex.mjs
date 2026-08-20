// End-to-end walkthrough of the polished GST screens for the Flooratex tenant.
// Captures GSTR-1 (summary + new B2CL/B2CS + HSN/Docs tabs), GSTR-3B (3.1
// breakdown), GSTR-2B (CDNR section), and Recon. Reuses the auth-seeding
// approach from screenshot-gstr1.mjs.
import { chromium } from 'playwright';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API = process.env.PW_API || 'https://localhost:7124';
const BASE = process.env.PW_BASE_URL || 'http://localhost:5173';
const TENANT = process.env.PW_TENANT || '22222222-2222-2222-2222-222222222222'; // Flooratex Live
const USER = process.env.PW_USER || 'LISS';
const PASS = process.env.PW_PASS || '123';
const PERIOD = process.env.PW_PERIOD || '202605';

const res = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT },
  body: JSON.stringify({ username: USER, password: PASS }),
});
if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
const d = await res.json();
const user = { emplCode: d.emplCode, displayName: d.displayName, role: d.role, tenantId: d.tenantId, expiresAt: d.expiresAt };
console.log(`logged in as ${d.displayName} (${d.role}) on tenant ${d.tenantId}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1320, height: 1100 }, deviceScaleFactor: 1.25, ignoreHTTPSErrors: true });
await ctx.addInitScript(([token, u]) => {
  localStorage.setItem('gstautopilot.jwt', token);
  localStorage.setItem('gstautopilot.user', u);
}, [d.accessToken, JSON.stringify(user)]);

const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

async function selectPeriod() {
  await page.waitForSelector('#period-select').catch(() => {});
  await page.selectOption('#period-select', PERIOD).catch(() => {});
  await page.waitForTimeout(700);
}
async function shot(name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `wt-${name}.png`, fullPage: true });
  console.log(`wrote wt-${name}.png`);
}
async function clickTab(re) {
  await page.getByRole('tab', { name: re }).click();
  await page.waitForTimeout(700);
}

// ---- GSTR-1 ----
await page.goto(`${BASE}/gstr1`, { waitUntil: 'load' });
await page.waitForSelector('h1:has-text("GSTR-1")', { timeout: 20000 });
await selectPeriod();
await page.waitForSelector('.tab', { timeout: 20000 });
await shot('gstr1-summary');
await clickTab(/B2C Large/i); await shot('gstr1-b2cl');
await clickTab(/B2C Small/i); await shot('gstr1-b2cs');
await clickTab(/HSN \/ Docs/i); await shot('gstr1-hsn-docs');

// ---- GSTR-3B ----
await page.goto(`${BASE}/gstr3b`, { waitUntil: 'load' });
await page.waitForSelector('h1:has-text("GSTR-3B")', { timeout: 20000 });
await selectPeriod();
await shot('gstr3b');

// ---- GSTR-2B ----
await page.goto(`${BASE}/gstr2b`, { waitUntil: 'load' });
await page.waitForSelector('h1:has-text("GSTR-2B")', { timeout: 20000 });
await selectPeriod();
await shot('gstr2b');

// ---- Recon (run then capture) ----
await page.goto(`${BASE}/recon`, { waitUntil: 'load' });
await page.waitForSelector('h1', { timeout: 20000 });
await selectPeriod();
const runBtn = page.getByRole('button', { name: /Run|Reconcile/i }).first();
if (await runBtn.count()) { await runBtn.click().catch(() => {}); await page.waitForTimeout(2500); }
await shot('recon');

// ---- Dashboard ----
await page.goto(`${BASE}/`, { waitUntil: 'load' });
await page.waitForTimeout(2000);
await shot('dashboard');

if (errors.length) {
  console.log(`\n--- ${errors.length} console error(s) ---`);
  for (const e of errors.slice(0, 15)) console.log(e);
} else {
  console.log('\nno console errors');
}
await browser.close();
