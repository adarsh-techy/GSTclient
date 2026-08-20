// Browser smoke-test of Invoices -> Cancel IRN (🗑) button + modal.
// Logs in as Admin, seeds the JWT, flips tenant to sandbox, opens /invoices,
// finds a row with a Cancellable IRN, clicks the cancel button, fills the
// modal, submits, and screenshots the result.
import { chromium } from 'playwright';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API = process.env.PW_API || 'https://localhost:7124';
const BASE = process.env.PW_BASE_URL || 'http://localhost:5173';
// Must match VITE_DEFAULT_TENANT_ID in .env — the browser uses that
// regardless of localStorage tenantId.
const TENANT = process.env.PW_TENANT || '22222222-2222-2222-2222-222222222222';
const USER = process.env.PW_USER || 'LISS';
const PASS = process.env.PW_PASS || '123';
const PERIOD = process.env.PW_PERIOD || '202605';
const OUT = process.env.PW_OUT || 'einvoice-cancel-smoke.png';

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
console.log(`login ok: ${d.displayName || d.emplCode} role=${d.role}`);
const jwt = d.accessToken;

// Sanity: confirm there's at least one Cancellable IRN to cancel.
const irnsResp = await http('/api/einvoice/list', {
  headers: { Authorization: `Bearer ${jwt}` },
});
const irns = await irnsResp.json();
const cancellable = irns.filter(i => i.lifecycleStatus === 'Cancellable' && i.source && i.source.startsWith('WHITEBOOKS'));
console.log(`${irns.length} IRNs total, ${cancellable.length} cancellable (real WhiteBooks)`);
if (cancellable.length === 0) {
  console.log('NO cancellable real IRNs — run smoke-einvoice.mjs first to generate one.');
  process.exit(2);
}
const target = cancellable[0];
console.log(`will cancel: bill=${target.billId} invNo=${target.invoiceNo} irn=${target.irnNumber.slice(0,24)}...`);

await http('/api/settings/whitebooks/environment', {
  method: 'PUT',
  headers: { Authorization: `Bearer ${jwt}` },
  body: JSON.stringify({ useSandbox: true }),
});
console.log(`tenant ${TENANT} confirmed in Sandbox env`);

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
page.on('console', (m) => { if (m.type() === 'error') console.log('[page error]', m.text()); });

await page.goto(`${BASE}/invoices?period=${PERIOD}`, { waitUntil: 'load' });
console.log(`navigated to /invoices?period=${PERIOD}`);

await page.locator('.ag-center-cols-container .ag-row').first().waitFor({ state: 'visible', timeout: 20000 });

// Cancel button has the title pattern "Cancel IRN · <time>" — match by prefix.
const cancelBtn = page.locator('button[title^="Cancel IRN"]').first();
const count = await cancelBtn.count();
if (count === 0) {
  console.log('NO cancel buttons visible — the IRN may not be in the loaded grid window or already cancelled.');
  await page.screenshot({ path: OUT });
  console.log(`screenshot: ${OUT}`);
  await browser.close();
  process.exit(3);
}
console.log('clicking 🗑 Cancel IRN button');
await cancelBtn.click();

// Wait for the modal to appear.
await page.locator('h3.modal-title:has-text("Cancel e-Invoice")').waitFor({ state: 'visible', timeout: 5000 });
console.log('modal opened');

// Pick reason "1 - Duplicate" and fill remarks (required).
await page.locator('input[type="radio"][value="1"]').check();
await page.locator('textarea.login-input').first().fill('Smoke-test cancel via UI');
console.log('reason=1 (Duplicate), remarks filled');

await page.screenshot({ path: OUT.replace('.png', '-modal.png') });

await page.locator('.modal button.btn-danger:has-text("Cancel e-Invoice")').click();
console.log('submit clicked');

try {
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('.toast, [role="status"], .toast-message'))
      .some((el) => /IRN cancelled|cancel failed|Cancellation/i.test(el.textContent || '')),
    null,
    { timeout: 30000 },
  );
} catch {
  console.log('no toast detected within timeout — taking screenshot anyway');
}
await page.waitForTimeout(800);

const toastText = await page.locator('.toast, [role="status"], .toast-message').allInnerTexts().catch(() => []);
console.log('toast(s):', toastText.length ? toastText.join(' | ') : '(none captured)');

await page.screenshot({ path: OUT });
console.log(`screenshot: ${OUT}`);

// Verify backend: the IRN should now be Cancelled.
const after = await fetch(`${API}/api/einvoice/list`, {
  headers: { 'X-Tenant-Id': TENANT, Authorization: `Bearer ${jwt}` },
});
if (after.ok) {
  const list = await after.json();
  const updated = list.find(i => i.irnId === target.irnId);
  console.log(`backend status: bill=${updated?.billId} status=${updated?.status} lifecycle=${updated?.lifecycleStatus} cancelledOn=${updated?.cancelledOn} reason=${updated?.cancelReason}`);
}

await browser.close();
console.log('done');
