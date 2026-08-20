// Playwright walkthrough of the GSTN filing controls on /gstr1.
// Captures the states that only appear once WhiteBooksGst is configured:
//   1. the header with "Connect to GSTN" / "Submit to GSTN"
//   2. the OTP dialog (previously reachable only from /gstr2b)
//   3. the mapped GSTN error after a failed OTP request
// Prereqs: API on 7124, web on 5173, a Locked GSTR-1 for PW_PERIOD.
import { chromium } from 'playwright';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API = process.env.PW_API || 'https://localhost:7124';
const BASE = process.env.PW_BASE_URL || 'http://localhost:5173';
const TENANT = process.env.PW_TENANT || '11111111-1111-1111-1111-111111111111';
const USER = process.env.PW_USER || 'LISS';
const PASS = process.env.PW_PASS || '123';
const PERIOD = process.env.PW_PERIOD || '202606';

const res = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT },
  body: JSON.stringify({ username: USER, password: PASS }),
});
if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
const d = await res.json();
console.log(`logged in as ${d.displayName} (${d.role})`);
const user = { emplCode: d.emplCode, displayName: d.displayName, role: d.role, tenantId: d.tenantId, expiresAt: d.expiresAt };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await ctx.addInitScript(([token, u]) => {
  localStorage.setItem('gstautopilot.jwt', token);
  localStorage.setItem('gstautopilot.user', u);
}, [d.accessToken, JSON.stringify(user)]);

const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[page error]', m.text()); });

await page.goto(`${BASE}/gstr1`, { waitUntil: 'load' });
await page.waitForSelector('.filing-control', { timeout: 25000 });

// Selecting the period must succeed — the filing state we want to show only
// exists for PERIOD, and silently falling back to the default period is what
// makes this walkthrough report "Draft" when a Locked return exists.
const options = await page.locator('#period-select option').evaluateAll(
  (els) => els.map((e) => ({ value: e.value, label: e.textContent.trim() })));
console.log('period options:', JSON.stringify(options));
if (!options.some((o) => o.value === PERIOD)) {
  throw new Error(`period ${PERIOD} is not in the selector; available: ${options.map((o) => o.value).join(', ')}`);
}
await page.selectOption('#period-select', PERIOD);
await page.waitForFunction(
  (p) => document.querySelector('#period-select')?.value === p, PERIOD, { timeout: 5000 });
await page.waitForTimeout(2000); // let the filing query refetch

const readState = async () => ({
  status: await page.locator('.filing-control .status-badge').first().textContent().catch(() => null),
  buttons: await page.locator('.filing-control button').allTextContents(),
});

let state = await readState();
console.log('initial state:', JSON.stringify(state));

// The GSTN controls only render once a return is Locked. If this period is
// still Draft, lock it — that is the real first step of the filing flow.
if (state.status?.includes('Draft')) {
  console.log('locking the return to reach the GSTN filing state…');
  await page.locator('.filing-control button', { hasText: 'Lock & File' }).click();
  await page.waitForTimeout(4000);
  state = await readState();
}
console.log('filing controls visible:', JSON.stringify(state.buttons));
console.log('status badge:', state.status);

await page.locator('.filing-control').first().screenshot({ path: 'filing-1-controls.png' });
await page.screenshot({ path: 'filing-1-page.png' });

// Open the OTP dialog — the connection previously had no entry point here.
const connect = page.locator('.filing-control button', { hasText: 'Connect to GSTN' });
if (await connect.count()) {
  await connect.first().click();
  await page.waitForSelector('.modal-title', { timeout: 10000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'filing-2-otp-dialog.png' });
  console.log('OTP dialog opened');

  // Request an OTP: sandbox creds are e-Invoice-only, so this exercises the
  // GSTN error mapping rather than succeeding.
  await page.locator('.modal button', { hasText: 'Request OTP' }).click();
  await page.waitForTimeout(6000);
  const err = await page.locator('.modal .page-state-error').allTextContents().catch(() => []);
  console.log('OTP dialog error text:', JSON.stringify(err));
  await page.screenshot({ path: 'filing-3-otp-error.png' });
} else {
  console.log('!! Connect button absent — WhiteBooksGst still not configured?');
}

await browser.close();
console.log('done');
