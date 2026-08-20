import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiErrorMessage } from '../../api';
import { useToast } from '../../components';
import {
  activateTenant,
  createTenant,
  testTenantConnection,
  type TestConnectionResult,
} from '../../api';

const FLAVOR_DEFAULTS: Record<
  string,
  { header: string; docId: string; line: string; outwardSp: string; inwardSp: string }
> = {
  KSCC: {
    header: 'Bill_File_mas',
    docId: '205',
    line: 'Bill_File_trn',
    outwardSp: 'Usp_GSTR_For_Filing',
    inwardSp: 'Usp_GSTR2A_For_Filing',
  },
  Default: { header: 'Bill_Mas', docId: '51', line: 'Bill_Mas', outwardSp: '', inwardSp: '' },
};

type StepState = 'details' | 'connections' | 'review' | 'done';

const STEPS: { key: StepState; label: string; sub: string }[] = [
  { key: 'details', label: 'Client Details', sub: 'GSTIN & Schema Profile' },
  { key: 'connections', label: 'Connections', sub: 'Databases & Testing' },
  { key: 'review', label: 'Review & Create', sub: 'Audit Configuration' },
  { key: 'done', label: 'Activation', sub: 'Final Provisioning' },
];

export function OnboardingWizard() {
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<StepState>('details');

  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [flavor, setFlavor] = useState('Default');
  const [outwardSp, setOutwardSp] = useState(FLAVOR_DEFAULTS.Default.outwardSp);
  const [inwardSp, setInwardSp] = useState(FLAVOR_DEFAULTS.Default.inwardSp);
  const [header, setHeader] = useState(FLAVOR_DEFAULTS.Default.header);
  const [docId, setDocId] = useState(FLAVOR_DEFAULTS.Default.docId);
  const [line, setLine] = useState(FLAVOR_DEFAULTS.Default.line);
  const [appConn, setAppConn] = useState('');
  const [carolConn, setCarolConn] = useState('');

  const [appTest, setAppTest] = useState<TestConnectionResult | null>(null);
  const [carolTest, setCarolTest] = useState<TestConnectionResult | null>(null);
  const [newTenantId, setNewTenantId] = useState<string | null>(null);
  const [isActivated, setIsActivated] = useState(false);

  const gstinTrimmed = gstin.trim().toUpperCase();
  const gstinState = gstinTrimmed.length >= 2 ? gstinTrimmed.slice(0, 2) : '';
  const gstinValid = gstinTrimmed.length === 15;
  const detailsValid = name.trim().length > 0 && gstinValid;

  const onFlavorChange = (f: string) => {
    setFlavor(f);
    const d = FLAVOR_DEFAULTS[f] ?? FLAVOR_DEFAULTS.Default;
    setOutwardSp(d.outwardSp);
    setInwardSp(d.inwardSp);
    setHeader(d.header);
    setDocId(d.docId);
    setLine(d.line);
  };

  const usesSp = outwardSp.trim() !== '' || inwardSp.trim() !== '';

  const testApp = useMutation({
    mutationFn: () => testTenantConnection(appConn, 'app'),
    onSuccess: setAppTest,
    onError: (e) => setAppTest({ ok: false, message: apiErrorMessage(e) }),
  });

  const testCarol = useMutation({
    mutationFn: () => testTenantConnection(carolConn, 'carolerp'),
    onSuccess: setCarolTest,
    onError: (e) => setCarolTest({ ok: false, message: apiErrorMessage(e) }),
  });

  const create = useMutation({
    mutationFn: () =>
      createTenant({
        name: name.trim(),
        gstin: gstinTrimmed,
        appDbConnection: appConn.trim(),
        carolErpConnection: carolConn.trim(),
        carolErpFlavor: flavor,
        outwardSP: outwardSp.trim() === '' ? null : outwardSp.trim(),
        inwardSP: inwardSp.trim() === '' ? null : inwardSp.trim(),
        salesHeaderTable: header.trim(),
        salesDocId: docId.trim() === '' ? null : Number(docId),
        salesLineTable: line.trim(),
      }),
    onSuccess: (data) => {
      setNewTenantId(data.tenantId);
      setStep('done');
      toast.show('Client provisioned successfully.', 'success');
    },
    onError: (err) => {
      toast.show(`Provisioning failed: ${apiErrorMessage(err)}`, 'error');
    },
  });

  const activate = useMutation({
    mutationFn: () => activateTenant(newTenantId!),
    onSuccess: () => {
      setIsActivated(true);
      toast.show('Client activated — it is now available for login.', 'success');
    },
    onError: (e) => toast.show(`Activation failed: ${apiErrorMessage(e)}`, 'error'),
  });

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Onboard a Client
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Provision a new tenant database, schema flavor profile &amp; automated GST stored procedures
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all cursor-pointer"
        >
          Cancel &amp; Return to Settings
        </button>
      </header>

      <nav aria-label="Progress" className="py-2">
        <ol className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STEPS.map((s, idx) => {
            const isCompleted = idx < stepIndex;
            const isCurrent = idx === stepIndex;

            return (
              <li
                key={s.key}
                className={`relative p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                  isCurrent
                    ? 'bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-700 shadow-2xs'
                    : isCompleted
                    ? 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700'
                    : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800 opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-[#00b4d8] text-white ring-2 ring-cyan-200 dark:ring-cyan-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-bold truncate ${isCurrent ? 'text-[#0096c7] dark:text-cyan-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {s.label}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{s.sub}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      {step === 'details' && (
        <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Client Profile &amp; GSTIN</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter the corporate identity and GST registration details for the new tenant.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Client Corporate Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ABC Trading Company Pvt Ltd"
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8] shadow-2xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Principal GSTIN (15-chars) *
                </label>
                {gstinTrimmed && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                      gstinValid
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                    }`}
                  >
                    {gstinValid ? `State Code: ${gstinState}` : `${gstinTrimmed.length}/15 chars`}
                  </span>
                )}
              </div>
              <input
                type="text"
                maxLength={15}
                required
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="e.g. 32AAAAA0000A1Z5"
                className="w-full text-xs font-mono font-bold tracking-wider px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8] shadow-2xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                CarolERP Schema Profile
              </label>
              <select
                value={flavor}
                onChange={(e) => onFlavorChange(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8] shadow-2xs cursor-pointer"
              >
                <option value="Default">Default (Flooratex-style table schema)</option>
                <option value="KSCC">KSCC (Kerala State Coir Corp SP-driven schema)</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-[#00b4d8] flex items-center justify-center font-bold text-xs">
                ⚡
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Data Source — Stored Procedures (Recommended)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              When specified, the app executes <code className="font-mono text-[#0096c7] bg-cyan-50 dark:bg-cyan-950/50 px-1 py-0.5 rounded">EXEC &lt;sp&gt; @GstNo, @StartDate, @EndDate</code> directly against the ERP database.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Outward SP (Sales / GSTR-1)
                </label>
                <input
                  type="text"
                  value={outwardSp}
                  onChange={(e) => setOutwardSp(e.target.value)}
                  placeholder="e.g. Usp_GSTR_For_Filing"
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Inward SP (Purchases / GSTR-2A)
                </label>
                <input
                  type="text"
                  value={inwardSp}
                  onChange={(e) => setInwardSp(e.target.value)}
                  placeholder="e.g. Usp_GSTR2A_For_Filing"
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
                />
              </div>
            </div>
          </div>

          <details className="group rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 bg-white dark:bg-slate-900/30">
            <summary className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none flex items-center justify-between">
              <span>Advanced: Legacy Table Mapping (Fallback only)</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="pt-3 flex flex-col gap-3">
              <p className="text-[11px] text-slate-400">
                Only used if either SP field above is left blank.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Sales Header Table
                  </label>
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => setHeader(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Sales DocId
                  </label>
                  <input
                    type="text"
                    value={docId}
                    onChange={(e) => setDocId(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Sales Line Table
                  </label>
                  <input
                    type="text"
                    value={line}
                    onChange={(e) => setLine(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </details>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!detailsValid}
              onClick={() => setStep('connections')}
              className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              Next: Database Connections →
            </button>
          </div>
        </div>
      )}

      {step === 'connections' && (
        <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Database Connections &amp; Health Test</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify SQL Server connection strings for the tenant application database and the source CarolERP instance.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Tenant App Database Connection *
            </label>
            <textarea
              rows={2}
              value={appConn}
              onChange={(e) => {
                setAppConn(e.target.value);
                setAppTest(null);
              }}
              placeholder="Data Source=192.168.1.10;Initial Catalog=GSTAutoPilot_Client;User ID=sa;Password=…;TrustServerCertificate=True"
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8] shadow-2xs"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!appConn.trim() || testApp.isPending}
                onClick={() => testApp.mutate()}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#00b4d8] hover:text-[#00b4d8] transition-all cursor-pointer disabled:opacity-40"
              >
                {testApp.isPending ? 'Testing App DB…' : 'Test App Database'}
              </button>
              {appTest && (
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    appTest.ok
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {appTest.ok ? '✓ Connected successfully' : `⚠ ${appTest.message}`}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Source CarolERP Database Connection *
            </label>
            <textarea
              rows={2}
              value={carolConn}
              onChange={(e) => {
                setCarolConn(e.target.value);
                setCarolTest(null);
              }}
              placeholder="Data Source=192.168.1.10;Initial Catalog=CarolERP_Client;User ID=sa;Password=…;TrustServerCertificate=True"
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8] shadow-2xs"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!carolConn.trim() || testCarol.isPending}
                onClick={() => testCarol.mutate()}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#00b4d8] hover:text-[#00b4d8] transition-all cursor-pointer disabled:opacity-40"
              >
                {testCarol.isPending ? 'Testing CarolERP…' : 'Test CarolERP'}
              </button>
              {carolTest && (
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    carolTest.ok
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {carolTest.ok ? '✓ Connected successfully' : `⚠ ${carolTest.message}`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              ← Back to Details
            </button>
            <button
              type="button"
              disabled={!appConn.trim() || !carolConn.trim()}
              onClick={() => setStep('review')}
              className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              Next: Review &amp; Create →
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Configuration Review &amp; Provisioning</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Confirm the parameters below before initializing tenant provisioning in the system.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/40 divide-y divide-slate-200/60 dark:divide-slate-800">
            <ReviewRow label="Client Corporate Name" value={name} bold />
            <ReviewRow label="Principal GSTIN" value={gstinTrimmed} mono />
            <ReviewRow label="Schema Flavor Profile" value={flavor} />
            <ReviewRow
              label="Data Source Execution"
              value={
                usesSp
                  ? `Stored Procedures · Outward: [${outwardSp.trim() || '—'}] · Inward: [${inwardSp.trim() || '—'}]`
                  : `Legacy Tables · Header: [${header}] · Line: [${line}]`
              }
              mono
            />
            <ReviewRow
              label="App Database Connection"
              value={maskConn(appConn)}
              mono
              badge={appTest ? (appTest.ok ? 'Verified ✓' : 'Failed ⚠') : undefined}
              badgeTone={appTest?.ok ? 'good' : 'warn'}
            />
            <ReviewRow
              label="CarolERP Database Connection"
              value={maskConn(carolConn)}
              mono
              badge={carolTest ? (carolTest.ok ? 'Verified ✓' : 'Failed ⚠') : undefined}
              badgeTone={carolTest?.ok ? 'good' : 'warn'}
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <span className="text-base leading-none">ℹ️</span>
            <span>
              The client will be initially created in an <strong>inactive state</strong>. You will be able to apply database migrations and configure GSTN / WhiteBooks credentials before activating it for users.
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep('connections')}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              ← Back to Connections
            </button>
            <button
              type="button"
              disabled={create.isPending}
              onClick={() => create.mutate()}
              className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {create.isPending ? 'Provisioning Client…' : 'Create Client (Inactive)'}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg">
              ✓
            </div>
            <div>
              <div className="text-sm font-bold">Client Provisioned Successfully!</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300">
                <strong>{name}</strong> ({gstinTrimmed}) has been registered in the system.
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Setup &amp; Activation Checklist
            </h3>
            <div className="space-y-2.5">
              <ChecklistItem
                num={1}
                title="Apply Tenant Database Migrations"
                desc="Run the idempotent .sql schema scripts against the newly created tenant app database."
              />
              <ChecklistItem
                num={2}
                title="Verify SPs & Document Mappings"
                desc={
                  usesSp
                    ? `Data source is configured to stored procedures (${outwardSp || '—'} / ${inwardSp || '—'}).`
                    : 'Configure Document Mappings in Settings → SP Profile if needed.'
                }
              />
              <ChecklistItem
                num={3}
                title="Configure GSTN & e-Invoice API Credentials"
                desc="Go to Settings → GST API & e-Invoice to enter the client's WhiteBooks API keys."
              />
              <ChecklistItem
                num={4}
                title="Activate Tenant for Login"
                desc="Once activated, the client appears on the corporate company picker."
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Go to Settings
            </button>

            {isActivated ? (
              <span className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                ✓ Client Activated &amp; Ready
              </span>
            ) : (
              <button
                type="button"
                disabled={activate.isPending || !newTenantId}
                onClick={() => activate.mutate()}
                className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {activate.isPending ? 'Activating Client…' : 'Activate Client Now'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewRow({
  label,
  value,
  mono = false,
  bold = false,
  badge,
  badgeTone = 'good',
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
  badge?: string;
  badgeTone?: 'good' | 'warn';
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-4 py-3 text-xs">
      <span className="font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`${mono ? 'font-mono' : ''} ${bold ? 'font-bold' : ''} text-slate-900 dark:text-slate-100 text-right`}
        >
          {value || '—'}
        </span>
        {badge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
              badgeTone === 'good'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function ChecklistItem({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60">
      <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#00b4d8] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
        {num}
      </div>
      <div>
        <div className="text-xs font-bold text-slate-900 dark:text-white">{title}</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function maskConn(cs: string): string {
  return cs.replace(/(Password|Pwd)\s*=\s*[^;]*/i, '$1=••••');
}

export { OnboardingWizard as ClientOnboardingPage, OnboardingWizard as default };
