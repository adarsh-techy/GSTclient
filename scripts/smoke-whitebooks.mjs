// Browser smoke-test of Settings -> WhiteBooks "Test Connection & Save".
// Logs in as Admin (LISS/123), seeds the JWT, opens /settings, edits the
// WhiteBooks credentials and submits, then reports the POST status + toast.
import { chromium } from 'playwright';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API = process.env.PW_API || 'https://localhost:7124';
const BASE = process.env.PW_BASE_URL || 'http://localhost:5173';
const TENANT = process.env.PW_TENANT || '11111111-1111-1111-1111-111111111111';
const USER = process.env.PW_USER || 'LISS';
const PASS = process.env.PW_PASS || '123';
const CLIENT_ID = process.env.PW_WB_ID || 'EINSd53588ac-a210-4eda-9e33-ab2a2543267c';
const CLIENT_SECRET = process.env.PW_WB_SECRET || 'EINS115cd30d-bf34-4258-8c88-d6c6a6025cbf';
const USERNAME = process.env.PW_WB_USER || 'BVMGSP';
const PASSWORD = process.env.PW_WB_PASS || 'Wbooks@0142';
const OUT = process.env.PW_OUT || 'whitebooks-smoke.png';

const res = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT },
  body: JSON.stringify({ username: USER, password: PASS }),
});
if (!res.ok) throw new Error(`login failed: ${res.status}`);
const d = await res.json();
console.log(`login ok: ${d.displayName || d.emplCode} role=${d.role}`);
const user = { emplCode: d.emplCode, displayName: d.displayName, role: d.role, tenantId: d.tenantId, expiresAt: d.expiresAt };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.5, ignoreHTTPSErrors: true });
await ctx.addInitScript(([token, u]) => {
  localStorage.setItem('gstautopilot.jwt', token);
  localStorage.setItem('gstautopilot.user', u);
}, [d.accessToken, JSON.stringify(user)]);

const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[page error]', m.text()); });

await page.goto(`${BASE}/settings`, { waitUntil: 'load' });
await page.waitForSelector('h2:has-text("WhiteBooks")', { timeout: 20000 });

let postStatus = null, postBody = '', toastText = '(none)', toastTone = '', ok = false;
try {
  // Wait for the card to finish loading its status: either the connected view
  // (Edit Credentials button) or the entry form (Client ID input) appears.
  await page.locator('button:has-text("Edit Credentials"), .wb-card input[type="text"]').first()
    .waitFor({ state: 'visible', timeout: 20000 });

  const editBtn = page.locator('button:has-text("Edit Credentials")');
  if (await editBtn.count()) {
    console.log('card state: connected -> clicking Edit Credentials');
    await editBtn.first().click();
  } else {
    console.log('card state: not connected (entry form shown)');
  }

  const card = page.locator('.wb-card');
  const texts = card.locator('input[type="text"]');
  const pwds = card.locator('input[type="password"]');
  await texts.first().waitFor({ state: 'visible', timeout: 10000 });
  await texts.nth(0).fill(CLIENT_ID);       // Client ID
  await pwds.nth(0).fill(CLIENT_SECRET);    // Client Secret
  await texts.nth(1).fill(USERNAME);        // e-Invoice API Username
  await pwds.nth(1).fill(PASSWORD);         // e-Invoice API Password
  const sandbox = card.locator('input[type="checkbox"]').first();
  if (!(await sandbox.isChecked())) await sandbox.check();
  console.log(`filled creds (id/secret/user/pass); sandbox checked=${await sandbox.isChecked()}`);

  const respPromise = page.waitForResponse(
    (r) => r.url().includes('/api/settings/whitebooks') && r.request().method() === 'POST',
    { timeout: 30000 },
  );
  await page.getByRole('button', { name: /Test Connection & Save/i }).click();
  console.log('clicked Test Connection & Save...');

  try {
    const resp = await respPromise;
    postStatus = resp.status();
    postBody = await resp.text();
  } catch (e) {
    console.log('no POST response captured:', e.message);
  }
  console.log(`POST /api/settings/whitebooks -> ${postStatus}  body=${postBody.slice(0, 300)}`);

  try {
    const toast = page.locator('.toast').first();
    await toast.waitFor({ state: 'visible', timeout: 10000 });
    toastText = (await toast.innerText()).trim();
    toastTone = (await toast.getAttribute('class')) || '';
  } catch (e) {
    console.log('no toast captured:', e.message);
  }
  console.log(`TOAST: "${toastText}"  [${toastTone}]`);

  ok = postStatus === 200 && /connected/i.test(toastText);
} catch (e) {
  console.log('interaction error:', e.message);
} finally {
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT, fullPage: true }).catch(() => {});
  console.log('screenshot written:', OUT);
}

console.log(ok ? 'SMOKE RESULT: PASS' : 'SMOKE RESULT: CHECK OUTPUT ABOVE');
await browser.close();
process.exit(ok ? 0 : 1);
