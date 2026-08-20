// Browser smoke-test of Invoices -> Generate IRN (🧾) button.
// Logs in as Admin, seeds the JWT, flips tenant to sandbox, opens /invoices
// for the chosen period, finds an un-generated row, clicks the generate
// button, waits for the success toast and screenshots the result.
import { chromium } from 'playwright';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API = process.env.PW_API || 'https://localhost:7124';
const BASE = process.env.PW_BASE_URL || 'http://localhost:5173';
// Browser uses VITE_DEFAULT_TENANT_ID from .env regardless of localStorage —
// default to the LIVE tenant since that's what the .env points at. (For the
// UI test we still flip its WhiteBooks env to Sandbox so it routes to the
// shared BVMGSP test account.)
const TENANT = process.env.PW_TENANT || '22222222-2222-2222-2222-222222222222';
const USER = process.env.PW_USER || 'LISS';
const PASS = process.env.PW_PASS || '123';
const PERIOD = process.env.PW_PERIOD || '202605';
const OUT = process.env.PW_OUT || 'einvoice-smoke.png';
// If set, click the generate button for this specific BillId. Otherwise,
// pick the first row that doesn't already have an IRN (the only ones that
// show the generate button).
const PREFERRED_BILL = process.env.PW_BILL ? Number(process.env.PW_BILL) : null;

async function http(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} -> ${res.status}: ${await res.text()}`);
  return res;
}

const login = await http('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ username: USER, password: PASS }),
});
const d = await login.json();
console.log(`login ok: ${d.displayName || d.emplCode} role=${d.role} -> tenant resolved by API: ${d.tenantId} (header sent: ${TENANT})`);
const jwt = d.accessToken;
// The API picks the user's primary tenant from the login, which may differ
// from the X-Tenant-Id header sent. The browser will use d.tenantId, so all
// subsequent API calls + the env-toggle must target the SAME tenant — else
// we set sandbox on tenant A and the UI calls hit tenant B (typically the
// LIVE tenant, missing creds → WhiteBooks "email not registered").
const effectiveTenant = d.tenantId || TENANT;

await http('/api/settings/whitebooks/environment', {
  method: 'PUT',
  headers: { Authorization: `Bearer ${jwt}`, 'X-Tenant-Id': effectiveTenant },
  body: JSON.stringify({ useSandbox: true }),
});
console.log(`tenant ${effectiveTenant} set to Sandbox env`);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.25,
  ignoreHTTPSErrors: true,
});
await ctx.addInitScript(([token, user]) => {
  localStorage.setItem('gstautopilot.jwt', token);
  localStorage.setItem('gstautopilot.user', user);
}, [jwt, JSON.stringify({
  emplCode: d.emplCode, displayName: d.displayName, role: d.role,
  tenantId: d.tenantId, expiresAt: d.expiresAt,
})]);

const page = await ctx.newPage();
const toastLog = [];
page.on('console', (m) => {
  if (m.type() === 'error') console.log('[page error]', m.text());
});

await page.goto(`${BASE}/invoices?period=${PERIOD}`, { waitUntil: 'load' });
console.log(`navigated to /invoices?period=${PERIOD}`);

// Wait for the AG-Grid to be populated.
await page.locator('.ag-center-cols-container .ag-row').first().waitFor({ state: 'visible', timeout: 20000 });
const rowCount = await page.locator('.ag-center-cols-container .ag-row').count();
console.log(`grid loaded with ${rowCount} visible rows`);

// Find a row that has the generate (🧾) button (i.e., no IRN yet).
const genButton = page.locator('button[title="Generate e-Invoice IRN"]').first();
const exists = await genButton.count();
if (exists === 0) {
  console.log('NO generate buttons visible — every loaded row already has an IRN.');
  await page.screenshot({ path: OUT, fullPage: false });
  console.log(`screenshot: ${OUT}`);
  await browser.close();
  process.exit(2);
}

// Capture the nearest row's id for logging (just the first matching ancestor).
const row = genButton.locator('xpath=ancestor::div[@role="row"][1]');
const billText = await row.first().getAttribute('row-id').catch(() => null) || '(unknown)';
console.log(`clicking Generate on grid row-id=${billText}`);

// Hook toast capture before clicking.
page.on('console', (m) => {
  if (m.text().includes('IRN generated') || m.text().includes('IRN failed')) toastLog.push(m.text());
});

await genButton.click();
// Wait for toast that mentions either success or failure.
try {
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('.toast, [role="status"], .toast-message'))
      .some((el) => /IRN (generated|failed)/i.test(el.textContent || '')),
    null,
    { timeout: 30000 },
  );
} catch {
  console.log('no toast detected within timeout — taking screenshot anyway');
}
await page.waitForTimeout(800);

const toastText = await page.locator('.toast, [role="status"], .toast-message').allInnerTexts().catch(() => []);
console.log('toast(s):', toastText.length ? toastText.join(' | ') : '(none captured)');

await page.screenshot({ path: OUT, fullPage: false });
console.log(`screenshot: ${OUT}`);

// Verify backend has the IRN now.
const status = await fetch(`${API}/api/einvoice/list`, {
  headers: { 'X-Tenant-Id': TENANT, Authorization: `Bearer ${jwt}` },
});
if (status.ok) {
  const irns = await status.json();
  const realIrns = irns.filter(i => i.source && i.source.startsWith('WHITEBOOKS'));
  console.log(`backend reports ${irns.length} total IRNs (${realIrns.length} real WhiteBooks)`);
  if (realIrns.length) {
    const latest = realIrns.sort((a,b)=> (b.createdOn||'').localeCompare(a.createdOn||''))[0];
    console.log(`latest real: bill=${latest.billId} invNo=${latest.invoiceNo} irn=${latest.irnNumber.slice(0,24)}... ack=${latest.acknowledgementNo} source=${latest.source}`);
  }
}

await browser.close();
console.log('done');
