import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  disableGstApi,
  disableWhiteBooks,
  discoverDocTypes,
  fetchCompany,
  fetchDocumentMappings,
  fetchEmailSettings,
  fetchGstApi,
  fetchKnownLineTables,
  fetchSpDiagnostics,
  fetchSpProfile,
  fetchTenantSettings,
  fetchWhiteBooks,
  fetchWhiteBooksSandboxInfo,
  removeLogo,
  saveEmailSettings,
  saveGstApi,
  saveWhiteBooks,
  sendTestEmail,
  setWhiteBooksEnvironment,
  testWhiteBooksSandbox,
  updateDocumentMappings,
  updateSpProfile,
  updateTenantSettings,
  uploadLogo,
} from '../../api';
import type { SpDiagnostics, SpDirectionDiagnostics } from '../../api';
import { apiErrorMessage as apiErr, apiErrorMessage } from '../../api';
import { PageError } from '../../components';
import { useToast } from '../../components';
import type { DiscoveredDocType, DocumentMapping, KnownTableInfo, TenantSettings, WhiteBooksStatus } from '../../types/api';

type SettingsTab = 'company' | 'print' | 'apis' | 'email' | 'sp';

const TABS: { key: SettingsTab; label: string; icon: string }[] = [
  { key: 'company', label: 'Company Profile & Logo', icon: '🏢' },
  { key: 'print', label: 'Invoice Print Defaults', icon: '📄' },
  { key: 'apis', label: 'WhiteBooks & GST APIs', icon: '🔌' },
  { key: 'email', label: 'Email (SMTP) Service', icon: '📧' },
  { key: 'sp', label: 'Database SPs & Sources', icon: '🗄️' },
];

export function Settings() {
  const qc = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');

  const settingsQuery = useQuery({ queryKey: ['tenant-settings'], queryFn: fetchTenantSettings });
  const companyQuery = useQuery({ queryKey: ['company'], queryFn: fetchCompany });

  const [form, setForm] = useState<TenantSettings>({
    showBankDetails: true,
    showSignature: true,
    logoPath: '',
    invoiceFooterText: '',
    termsAndConditions: '',
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setForm({
        showBankDetails: settingsQuery.data.showBankDetails,
        showSignature: settingsQuery.data.showSignature,
        logoPath: settingsQuery.data.logoPath ?? '',
        invoiceFooterText: settingsQuery.data.invoiceFooterText ?? '',
        termsAndConditions: settingsQuery.data.termsAndConditions ?? '',
      });
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (dto: TenantSettings) => updateTenantSettings(dto),
    onSuccess: () => {
      toast.show('Print settings saved successfully.', 'success');
      qc.invalidateQueries({ queryKey: ['tenant-settings'] });
    },
    onError: (err) => toast.show(`Save failed: ${apiErrorMessage(err)}`, 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      logoPath: form.logoPath || null,
      invoiceFooterText: form.invoiceFooterText || null,
      termsAndConditions: form.termsAndConditions || null,
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Settings &amp; Configuration
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Manage company master profile, invoice print templates, WhiteBooks API credentials, SMTP relay, and stored procedure data sources
          </p>
        </div>
      </header>

      <PerCompanyCredsBanner company={companyQuery.data ?? undefined} />

      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#e6f7fa] dark:bg-cyan-950/60 text-[#0096c7] dark:text-cyan-300 font-bold border border-cyan-400/30 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'company' && (
        <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">🏢 Company Profile &amp; Official Logo</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Read-only registered company details from your CarolERP master database along with your official tenant logo.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              CarolERP Registered Master Profile
            </h3>
            {companyQuery.isLoading ? (
              <div className="text-xs text-slate-400">Loading company profile…</div>
            ) : companyQuery.isError ? (
              <PageError error={companyQuery.error} what="company details" />
            ) : companyQuery.data ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <ReadCell label="Company Name" value={companyQuery.data.companyName} bold />
                <ReadCell label="GSTIN" value={companyQuery.data.gstin} mono />
                <ReadCell label="PAN" value={companyQuery.data.pan} mono />
                <ReadCell
                  label="Registered Address"
                  value={[companyQuery.data.address1, companyQuery.data.address2, companyQuery.data.address3]
                    .filter(Boolean)
                    .join(', ')}
                />
                <ReadCell label="PIN Code" value={companyQuery.data.pinCode} mono />
                <ReadCell label="Phone / Tel" value={companyQuery.data.phone} />
                <ReadCell label="Work Email" value={companyQuery.data.email} />
                <ReadCell label="IE Code" value={companyQuery.data.iECode} mono />
                <ReadCell label="Bank Name" value={companyQuery.data.bankName} />
                <ReadCell label="Account Number" value={companyQuery.data.accountNo} mono />
                <ReadCell label="IFSC Code" value={companyQuery.data.ifscCode} mono />
                <ReadCell label="Branch Name" value={companyQuery.data.branchName} />
              </div>
            ) : null}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Official Tenant Logo
            </h3>
            <LogoCard
              savedPath={settingsQuery.data?.logoPath ?? null}
              onChanged={() => qc.invalidateQueries({ queryKey: ['tenant-settings'] })}
            />
          </div>
        </div>
      )}

      {activeTab === 'print' && (
        <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">📄 Invoice Print &amp; PDF Defaults</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure PDF print layout defaults, bank details visibility, signatory lines, and footer terms.
            </p>
          </div>

          {settingsQuery.isLoading ? (
            <div className="text-xs text-slate-400">Loading print options…</div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Show Bank Details Block</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Print bank name, account number, IFSC code, and branch on tax invoice PDFs.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.showBankDetails}
                    onChange={(e) => setForm({ ...form, showBankDetails: e.target.checked })}
                    className="w-4 h-4 rounded text-[#00b4d8] focus:ring-[#00b4d8] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Show Authorised Signatory Line</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Print "For [Company Name] - Authorised Signatory" at the bottom right.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.showSignature}
                    onChange={(e) => setForm({ ...form, showSignature: e.target.checked })}
                    className="w-4 h-4 rounded text-[#00b4d8] focus:ring-[#00b4d8] cursor-pointer"
                  />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Invoice Footer Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. Thank you for your business! Subject to local jurisdiction."
                  value={form.invoiceFooterText ?? ''}
                  onChange={(e) => setForm({ ...form, invoiceFooterText: e.target.value })}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Terms &amp; Conditions
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. 1. Goods once sold will not be taken back. 2. Interest @ 18% per annum will be charged on overdue bills."
                  value={form.termsAndConditions ?? ''}
                  onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })}
                  className="w-full text-xs font-medium p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving Settings…' : 'Save Print Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'apis' && (
        <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">🔌 WhiteBooks &amp; GST API Integrations</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure official API integration credentials for WhiteBooks e-Invoicing, e-Way Bills, and GSTR portal return filing endpoints.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                1. e-Invoice &amp; e-Way Bill API Configuration (WhiteBooks)
              </h3>
              <WhiteBooksCard />
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                2. GST Returns &amp; GSTR-2B API Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Dedicated GST API configuration for live GSTR-2B download, GSTIN validation, and GSTR-3B return submission.
              </p>
              <GstApiCard />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">📧 Email (SMTP Relay) Service</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure your company SMTP mail server to automatically email signed e-Invoice PDFs and QR codes to customers.
            </p>
          </div>

          <EmailConfigCard />
        </div>
      )}

      {activeTab === 'sp' && (
        <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">🗄️ Stored Procedure Data Sources</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure custom stored procedure names in your CarolERP database to query inward &amp; outward line-level GST transactions.
            </p>
          </div>

          <SpProfileCard
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['carolerp-periods'] });
              qc.invalidateQueries({ queryKey: ['invoices'] });
              qc.invalidateQueries({ queryKey: ['gstr1'] });
              qc.invalidateQueries({ queryKey: ['gstr3b'] });
              qc.invalidateQueries({ queryKey: ['gst-summary'] });
            }}
          />

          {SHOW_DOCUMENT_MAPPING && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Legacy Document Mapping
              </h3>
              <DocumentMappingCard
                onSaved={() => {
                  qc.invalidateQueries({ queryKey: ['carolerp-periods'] });
                  qc.invalidateQueries({ queryKey: ['invoices'] });
                  qc.invalidateQueries({ queryKey: ['gstr1'] });
                  qc.invalidateQueries({ queryKey: ['gstr3b'] });
                  qc.invalidateQueries({ queryKey: ['gst-summary'] });
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const SHOW_DOCUMENT_MAPPING = false;

function SpProfileCard({ onSaved }: { onSaved: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['sp-profile'], queryFn: fetchSpProfile });
  const [outward, setOutward] = useState('');
  const [inward, setInward] = useState('');
  const [diag, setDiag] = useState<SpDiagnostics | null>(null);

  const test = useMutation({
    mutationFn: fetchSpDiagnostics,
    onSuccess: (d) => {
      setDiag(d);
      toast.show('Stored procedure test complete.', 'success');
    },
    onError: (err) => {
      toast.show(`Test failed: ${apiErrorMessage(err)}`, 'error');
    },
  });

  useEffect(() => {
    if (query.data) {
      setOutward(query.data.outwardSP ?? '');
      setInward(query.data.inwardSP ?? '');
    }
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      updateSpProfile({
        outwardSP: outward.trim() === '' ? null : outward.trim(),
        inwardSP: inward.trim() === '' ? null : inward.trim(),
      }),
    onSuccess: (data) => {
      toast.show('Stored procedure settings saved.', 'success');
      qc.setQueryData(['sp-profile'], data);
      setOutward(data.outwardSP ?? '');
      setInward(data.inwardSP ?? '');
      onSaved();
    },
    onError: (err) => {
      toast.show(`Save failed: ${apiErrorMessage(err)}`, 'error');
    },
  });

  if (query.isLoading) return <div className="text-xs text-slate-400">Loading…</div>;
  if (query.isError) return <PageError error={query.error} what="this setting" />;

  return (
    <form
      className="flex flex-col gap-4 max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
          Outward SP (Sales / GSTR-1)
        </label>
        <input
          type="text"
          className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
          value={outward}
          onChange={(e) => setOutward(e.target.value)}
          placeholder="e.g. Usp_GSTR_For_Filing"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
          Inward SP (Purchases / GSTR-2A)
        </label>
        <input
          type="text"
          className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
          value={inward}
          onChange={(e) => setInward(e.target.value)}
          placeholder="e.g. Usp_GSTR2A_For_Filing"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] shadow-sm transition-all cursor-pointer disabled:opacity-50"
          disabled={save.isPending}
        >
          {save.isPending ? 'Saving…' : 'Save Stored Procedures'}
        </button>
        <button
          type="button"
          className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#00b4d8] hover:text-[#00b4d8] transition-all cursor-pointer disabled:opacity-50"
          onClick={() => test.mutate()}
          disabled={test.isPending}
        >
          {test.isPending ? 'Testing SPs…' : 'Test Live SPs'}
        </button>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Outward: <strong className="text-slate-800 dark:text-slate-200">{query.data?.outwardSP ? 'SP Active ✓' : 'Table Mapping'}</strong> · Inward:{' '}
          <strong className="text-slate-800 dark:text-slate-200">{query.data?.inwardSP ? 'SP Active ✓' : 'Table Mapping'}</strong>
        </span>
      </div>

      {diag && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-2.5 mt-2">
          <SpDiagRow label="Outward (Sales)" d={diag.outward} />
          <SpDiagRow label="Inward (Purchases)" d={diag.inward} />
        </div>
      )}
    </form>
  );
}

function SpDiagRow({ label, d }: { label: string; d: SpDirectionDiagnostics }) {
  const isOk = d.ok && d.configured;
  const isErr = !d.ok && d.configured;

  const summary = !d.configured
    ? 'Not configured — using document fallback mapping'
    : d.ok
    ? `${d.invoiceCount.toLocaleString()} invoices detected across ${d.periodCount} month(s)` +
      (d.invoiceCount === 0 ? ' — executed cleanly, but returned 0 rows' : '')
    : `Failed: ${d.error ?? 'Unknown query execution error'}`;

  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          isOk ? 'bg-emerald-500' : isErr ? 'bg-rose-500' : 'bg-slate-400'
        }`}
      />
      <strong className="text-slate-900 dark:text-white min-w-[140px]">{label}:</strong>
      <span className="font-mono text-[#0096c7] font-semibold">{d.spName || '—'}</span>
      <span className="text-slate-500 dark:text-slate-400 truncate">({summary})</span>
    </div>
  );
}

function PerCompanyCredsBanner({ company }: { company?: { companyName?: string; gstin?: string | null } }) {
  const hasCompany = !!company?.companyName;
  return (
    <div
      className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
        hasCompany
          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
          : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
      }`}
    >
      {hasCompany ? (
        <>
          <strong>🔐 Active GST Credentials Scope:</strong> The WhiteBooks e-Invoice and GST API settings below are scoped directly to{' '}
          <strong>{company!.companyName}</strong>
          {company!.gstin ? (
            <>
              {' '}· GSTIN <span className="font-mono font-bold">{company!.gstin}</span>
            </>
          ) : null}.
          {' '}Selecting a different company in the top selector switches to that company's individual credentials.
        </>
      ) : (
        <>
          <strong>🔐 Default Credentials Scope:</strong> Select a company in the sidebar to configure per-GST credentials.
        </>
      )}
    </div>
  );
}

function WhiteBooksCard() {
  const qc = useQueryClient();
  const toast = useToast();
  const statusQuery = useQuery({ queryKey: ['whitebooks'], queryFn: fetchWhiteBooks });
  const sandboxQuery = useQuery({ queryKey: ['whitebooks-sandbox'], queryFn: fetchWhiteBooksSandboxInfo });

  const setEnvMut = useMutation({
    mutationFn: (useSandbox: boolean) => setWhiteBooksEnvironment(useSandbox),
    onSuccess: (data) => {
      qc.setQueryData(['whitebooks'], data);
      toast.show(`Default environment set to ${data.useSandbox ? 'Sandbox' : 'Production'}.`, 'success');
    },
    onError: (err) => toast.show(`Toggle failed: ${apiErr(err)}`, 'error'),
  });

  if (statusQuery.isLoading || sandboxQuery.isLoading) return <div className="text-xs text-slate-400">Loading…</div>;
  const status = statusQuery.data;
  const sandbox = sandboxQuery.data;
  const useSandbox = status?.useSandbox ?? true;

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">Active Environment for IRN Generation</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Currently using <strong className="text-slate-800 dark:text-slate-200">{useSandbox ? 'Sandbox (Test)' : 'Production (Live)'}</strong> credentials.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              useSandbox
                ? 'bg-[#00b4d8] text-white shadow-2xs'
                : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            disabled={setEnvMut.isPending || useSandbox}
            onClick={() => setEnvMut.mutate(true)}
          >
            Sandbox
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !useSandbox
                ? 'bg-[#00b4d8] text-white shadow-2xs'
                : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            disabled={setEnvMut.isPending || !useSandbox}
            onClick={() => setEnvMut.mutate(false)}
          >
            Production
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SandboxCard info={sandbox} active={useSandbox} />
        <ProductionCard status={status} active={!useSandbox} />
      </div>
    </div>
  );
}

function SandboxCard({ info, active }: { info: import('../../types/api').WhiteBooksSandboxInfo | undefined; active: boolean }) {
  const toast = useToast();
  const testMut = useMutation({
    mutationFn: () => testWhiteBooksSandbox(),
    onSuccess: () => toast.show('Sandbox auth OK — token returned from NIC IRP.', 'success'),
    onError: (err) => toast.show(`Sandbox test failed: ${apiErr(err)}`, 'error'),
  });

  if (!info) return null;

  return (
    <div
      className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
        active
          ? 'bg-cyan-50/40 dark:bg-cyan-950/20 border-cyan-300 dark:border-cyan-700 shadow-2xs'
          : 'bg-white dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">🧪 Sandbox (Shared Test Account)</span>
          </div>
          {active && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00b4d8] text-white">
              ACTIVE
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div><span className="text-slate-400 text-[11px]">Username:</span> <div className="font-mono text-slate-800 dark:text-slate-200">{info.username}</div></div>
          <div><span className="text-slate-400 text-[11px]">Client ID:</span> <div className="font-mono text-slate-800 dark:text-slate-200">{info.clientId}</div></div>
          <div><span className="text-slate-400 text-[11px]">Test GSTIN:</span> <div className="font-mono text-slate-800 dark:text-slate-200">{info.gstin}</div></div>
          <div><span className="text-slate-400 text-[11px]">Account Email:</span> <div className="font-mono text-slate-800 dark:text-slate-200">{info.email}</div></div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#00b4d8] hover:text-[#00b4d8] transition-all cursor-pointer disabled:opacity-50"
          disabled={testMut.isPending}
          onClick={() => testMut.mutate()}
        >
          {testMut.isPending ? 'Testing Sandbox…' : 'Test Sandbox Connection'}
        </button>
      </div>
    </div>
  );
}

function ProductionCard({ status, active }: { status: WhiteBooksStatus | undefined; active: boolean }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ clientId: '', clientSecret: '', username: '', password: '', useSandbox: false, gstin: '' });

  const saveMut = useMutation({
    mutationFn: () => saveWhiteBooks({ ...form, useSandbox: false }),
    onSuccess: (data) => {
      toast.show('Production credentials saved & verified against WhiteBooks live.', 'success');
      qc.setQueryData(['whitebooks'], data);
      qc.invalidateQueries({ queryKey: ['gst-api'] });
      setEditing(false);
      setForm({ clientId: '', clientSecret: '', username: '', password: '', useSandbox: false, gstin: data.gstin ?? '' });
    },
    onError: (err) => toast.show(`Save failed: ${apiErr(err)}`, 'error'),
  });

  const disableMut = useMutation({
    mutationFn: () => disableWhiteBooks(),
    onSuccess: () => {
      toast.show('Production credentials cleared.', 'info');
      qc.invalidateQueries({ queryKey: ['whitebooks'] });
    },
    onError: (err) => toast.show(`Failed: ${apiErr(err)}`, 'error'),
  });

  const hasProdCreds = status?.hasCredentials ?? false;

  if (hasProdCreds && !editing) {
    return (
      <div
        className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
          active
            ? 'bg-cyan-50/40 dark:bg-cyan-950/20 border-cyan-300 dark:border-cyan-700 shadow-2xs'
            : 'bg-white dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800'
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">🚀 Production (Live Credentials)</span>
            </div>
            {active && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00b4d8] text-white">
                ACTIVE
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div><span className="text-slate-400 text-[11px]">GSTIN:</span> <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{status!.gstin ?? '—'}</div></div>
            <div><span className="text-slate-400 text-[11px]">Client ID:</span> <div className="font-mono text-slate-800 dark:text-slate-200">{status!.clientId}</div></div>
            <div><span className="text-slate-400 text-[11px]">API User:</span> <div className="font-mono text-slate-800 dark:text-slate-200">{status!.username ?? '—'}</div></div>
            <div><span className="text-slate-400 text-[11px]">Password:</span> <div className="font-bold text-emerald-600 dark:text-emerald-400">{status!.hasPassword ? 'Configured ✓' : 'Not Set'}</div></div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#00b4d8] hover:text-[#00b4d8] transition-all cursor-pointer"
            onClick={() => {
              setForm({ clientId: '', clientSecret: '', username: status!.username ?? '', password: '', useSandbox: false, gstin: status!.gstin ?? '' });
              setEditing(true);
            }}
          >
            Edit Credentials
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-40"
            disabled={disableMut.isPending}
            onClick={() => disableMut.mutate()}
          >
            Clear
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex flex-col gap-4">
      <div className="text-xs font-bold text-slate-900 dark:text-white">🚀 Configure Live Production Credentials</div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate();
        }}
      >
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Taxpayer GSTIN (15 chars)
          </label>
          <input
            type="text"
            className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
            maxLength={15}
            minLength={15}
            value={form.gstin}
            onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
            placeholder="e.g. 32AABCF1608B1ZJ"
            required
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Client ID
          </label>
          <input
            type="text"
            className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Client Secret
          </label>
          <input
            type="password"
            className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
            value={form.clientSecret}
            onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            e-Invoice API Username
          </label>
          <input
            type="text"
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            e-Invoice API Password
          </label>
          <input
            type="password"
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={editing ? 'Leave blank to keep current' : ''}
            required={!editing}
          />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-[#00b4d8] hover:bg-[#0096c7] cursor-pointer disabled:opacity-50"
            disabled={saveMut.isPending}
          >
            {saveMut.isPending ? 'Testing Connection…' : 'Test & Save'}
          </button>
          {editing && (
            <button
              type="button"
              className="px-3 py-2 text-xs font-bold rounded-xl text-slate-500 cursor-pointer"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function GstApiCard() {
  const qc = useQueryClient();
  const toast = useToast();
  const statusQuery = useQuery({ queryKey: ['gst-api'], queryFn: fetchGstApi });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ clientId: '', clientSecret: '', username: '', password: '', gstin: '' });

  const saveMut = useMutation({
    mutationFn: () => saveGstApi(form),
    onSuccess: (data) => {
      toast.show('GST API connected & saved successfully.', 'success');
      qc.setQueryData(['gst-api'], data);
      qc.invalidateQueries({ queryKey: ['whitebooks'] });
      setEditing(false);
      setForm({ clientId: '', clientSecret: '', username: '', password: '', gstin: data.gstin ?? '' });
    },
    onError: (err) => toast.show(`Connection failed: ${apiErr(err)}`, 'error'),
  });

  const disableMut = useMutation({
    mutationFn: () => disableGstApi(),
    onSuccess: () => {
      toast.show('GST API disabled.', 'info');
      qc.invalidateQueries({ queryKey: ['gst-api'] });
    },
    onError: (err) => toast.show(`Failed: ${apiErr(err)}`, 'error'),
  });

  if (statusQuery.isLoading) return <div className="text-xs text-slate-400">Loading…</div>;
  const status = statusQuery.data;
  const connected = status?.enabled && status?.hasCredentials;

  if (connected && !editing) {
    return (
      <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">WhiteBooks GST API — Status: Connected</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div><span className="text-slate-400 text-[11px]">GSTIN:</span> <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{status!.gstin ?? '—'}</div></div>
            <div><span className="text-slate-400 text-[11px]">Base URL:</span> <div className="font-mono text-slate-800 dark:text-slate-200 truncate">{status!.baseUrl}</div></div>
            <div><span className="text-slate-400 text-[11px]">Client ID:</span> <div className="font-mono text-slate-800 dark:text-slate-200">{status!.clientId}</div></div>
            <div><span className="text-slate-400 text-[11px]">GST Portal User:</span> <div className="font-mono text-slate-800 dark:text-slate-200">{status!.username ?? '—'}</div></div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#00b4d8] hover:text-[#00b4d8] transition-all cursor-pointer"
            onClick={() => {
              setForm({ clientId: '', clientSecret: '', username: status!.username ?? '', password: '', gstin: status!.gstin ?? '' });
              setEditing(true);
            }}
          >
            Edit Credentials
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-40"
            disabled={disableMut.isPending}
            onClick={() => disableMut.mutate()}
          >
            Disable
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex flex-col gap-4 max-w-xl">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate();
        }}
      >
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Taxpayer GSTIN (15 chars)
          </label>
          <input
            type="text"
            className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
            maxLength={15}
            minLength={15}
            value={form.gstin}
            onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
            placeholder="e.g. 32AABCF1608B1ZJ"
            required
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Client ID
          </label>
          <input
            type="text"
            className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Client Secret
          </label>
          <input
            type="password"
            className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
            value={form.clientSecret}
            onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            GST Portal Username
          </label>
          <input
            type="text"
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            GST Portal Password
          </label>
          <input
            type="password"
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={editing ? 'Leave blank to keep current' : ''}
          />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-[#00b4d8] hover:bg-[#0096c7] cursor-pointer disabled:opacity-50"
            disabled={saveMut.isPending}
          >
            {saveMut.isPending ? 'Testing Connection…' : 'Test & Save'}
          </button>
          {editing && (
            <button
              type="button"
              className="px-3 py-2 text-xs font-bold rounded-xl text-slate-500 cursor-pointer"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function EmailConfigCard() {
  const qc = useQueryClient();
  const toast = useToast();
  const statusQuery = useQuery({ queryKey: ['email-settings'], queryFn: fetchEmailSettings });
  const [form, setForm] = useState({ host: '', port: 587, username: '', password: '', fromName: '', fromEmail: '', enableSsl: true });
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    const s = statusQuery.data;
    if (s) {
      setForm({
        host: s.host ?? '',
        port: s.port ?? 587,
        username: s.username ?? '',
        password: '',
        fromName: s.fromName ?? '',
        fromEmail: s.fromEmail ?? '',
        enableSsl: s.enableSsl,
      });
    }
  }, [statusQuery.data]);

  const saveMut = useMutation({
    mutationFn: () => saveEmailSettings(form),
    onSuccess: (data) => {
      toast.show('Email settings saved successfully.', 'success');
      qc.setQueryData(['email-settings'], data);
      setForm((f) => ({ ...f, password: '' }));
    },
    onError: (err) => toast.show(`Save failed: ${apiErr(err)}`, 'error'),
  });

  const testMut = useMutation({
    mutationFn: () => sendTestEmail(form),
    onSuccess: (data) => toast.show(`Test email dispatched successfully to ${data.sentTo}`, 'success'),
    onError: (err) => toast.show(`Test failed: ${apiErr(err)}`, 'error'),
  });

  if (statusQuery.isLoading) return <div className="text-xs text-slate-400">Loading…</div>;
  const hasPassword = statusQuery.data?.hasPassword ?? false;

  return (
    <form
      className="flex flex-col gap-4 max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        saveMut.mutate();
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            SMTP Host *
          </label>
          <input
            type="text"
            className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
            value={form.host}
            placeholder="smtp.gmail.com"
            required
            onChange={(e) => setForm({ ...form, host: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            SMTP Port *
          </label>
          <input
            type="number"
            className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
            value={form.port}
            required
            onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            SMTP Username
          </label>
          <input
            type="text"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
            value={form.username}
            placeholder="accounts@company.com"
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              className="w-full text-xs pr-8 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
              value={form.password}
              placeholder={hasPassword ? 'Password set' : ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs"
              onClick={() => setShowPwd((v) => !v)}
              title="Show / hide password"
            >
              {showPwd ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Sender Display Name
          </label>
          <input
            type="text"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
            value={form.fromName}
            placeholder="Accounts Department"
            onChange={(e) => setForm({ ...form, fromName: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Sender Email Address *
          </label>
          <input
            type="email"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
            value={form.fromEmail}
            placeholder="invoices@company.com"
            required
            onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={form.enableSsl}
          onChange={(e) => setForm({ ...form, enableSsl: e.target.checked })}
          className="w-4 h-4 rounded text-[#00b4d8] focus:ring-[#00b4d8] cursor-pointer"
        />
        <span>Enable SSL / TLS Security (STARTTLS on port 587, Direct SSL on 465)</span>
      </label>

      <div className="flex items-center gap-3 pt-3">
        <button
          type="submit"
          className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] shadow-sm transition-all cursor-pointer disabled:opacity-50"
          disabled={saveMut.isPending}
        >
          {saveMut.isPending ? 'Saving…' : 'Save Email Settings'}
        </button>
        <button
          type="button"
          className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#00b4d8] hover:text-[#00b4d8] transition-all cursor-pointer disabled:opacity-50"
          disabled={testMut.isPending}
          onClick={() => testMut.mutate()}
        >
          {testMut.isPending ? 'Sending Test…' : 'Send Test Email'}
        </button>
      </div>
    </form>
  );
}

function ReadCell({
  label,
  value,
  mono = false,
  bold = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  bold?: boolean;
}) {
  const toast = useToast();
  const display = value || '—';
  const isCopyable = !!value && ['GSTIN', 'PAN', 'Account Number', 'IFSC Code', 'PIN Code'].includes(label);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast.show(`Copied ${label} to clipboard`, 'info');
  };

  return (
    <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col justify-between gap-1.5">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {label}
        </span>
        {isCopyable && (
          <button
            type="button"
            onClick={handleCopy}
            className="text-[10px] font-bold text-slate-400 hover:text-[#00b4d8] transition-colors p-0.5 cursor-pointer"
            title={`Copy ${label}`}
          >
            📋 Copy
          </button>
        )}
      </div>
      <div
        className={`text-xs text-slate-900 dark:text-slate-100 truncate ${mono ? 'font-mono' : ''} ${
          bold ? 'font-bold' : 'font-medium'
        }`}
        title={display}
      >
        {display}
      </div>
    </div>
  );
}

function LogoCard({ savedPath, onChanged }: { savedPath: string | null; onChanged: () => void }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadLogo(file),
    onSuccess: () => {
      toast.show('Logo saved successfully!', 'success');
      setPendingFile(null);
      onChanged();
    },
    onError: (err) => toast.show(`Save failed: ${apiErrorMessage(err)}`, 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: () => removeLogo(),
    onSuccess: () => {
      toast.show('Logo removed.', 'success');
      onChanged();
    },
    onError: (err) => toast.show(`Remove failed: ${apiErrorMessage(err)}`, 'error'),
  });

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    setPendingFile(file);
  };

  const handleSave = () => {
    if (!pendingFile) return;
    uploadMutation.mutate(pendingFile);
  };

  const handleCancel = () => setPendingFile(null);

  const handleRemove = () => {
    if (!savedPath) return;
    if (!window.confirm('Remove company logo?')) return;
    removeMutation.mutate();
  };

  const openPicker = () => fileRef.current?.click();
  const savedUrl = savedPath ? `/${savedPath}` : null;

  return (
    <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-4 max-w-lg">
      <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={handleSelect} />

      {pendingFile ? (
        <div className="flex flex-col gap-3">
          <div className="h-24 w-48 rounded-xl border border-dashed border-cyan-400 bg-white dark:bg-slate-800 flex items-center justify-center p-2 overflow-hidden">
            {previewUrl ? <img src={previewUrl} alt="New logo preview" className="max-h-full max-w-full object-contain" /> : null}
          </div>
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            ⚠️ Unsaved logo — click Save Logo to apply changes
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer disabled:opacity-50"
              disabled={uploadMutation.isPending}
              onClick={handleSave}
            >
              {uploadMutation.isPending ? 'Saving Logo…' : 'Save Logo ✓'}
            </button>
            <button
              type="button"
              className="px-3 py-2 text-xs font-bold rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              disabled={uploadMutation.isPending}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : savedPath ? (
        <div className="flex flex-col gap-3">
          <div className="h-24 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center p-2 overflow-hidden">
            {savedUrl ? <img src={savedUrl} alt="Tenant logo" className="max-h-full max-w-full object-contain" /> : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#00b4d8] hover:text-[#00b4d8] cursor-pointer"
              onClick={openPicker}
            >
              Change Logo
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer disabled:opacity-50"
              disabled={removeMutation.isPending}
              onClick={handleRemove}
            >
              {removeMutation.isPending ? 'Removing…' : 'Remove Logo'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center gap-2">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">No logo uploaded yet</div>
          <div className="text-[11px] text-slate-400">Recommended: 300×100 px PNG or JPG, up to 2 MB</div>
          <button
            type="button"
            className="mt-1 px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] cursor-pointer"
            onClick={openPicker}
          >
            Upload Official Logo
          </button>
        </div>
      )}
    </div>
  );
}

function appendCsv(existing: string | null, value: number | string): string | null {
  const set = new Set<string>(
    (existing ?? '').split(',').map((s) => s.trim()).filter((s) => s.length > 0),
  );
  set.add(String(value));
  const sorted = Array.from(set)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b)
    .map(String);
  return sorted.length === 0 ? null : sorted.join(',');
}

function DocumentMappingCard({ onSaved }: { onSaved: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['document-mappings'], queryFn: fetchDocumentMappings });
  const knownTablesQuery = useQuery({ queryKey: ['known-line-tables'], queryFn: fetchKnownLineTables });
  const [rows, setRows] = useState<DocumentMapping[]>([]);

  useEffect(() => {
    if (query.data) setRows(query.data);
  }, [query.data]);

  const save = useMutation({
    mutationFn: (m: DocumentMapping[]) => updateDocumentMappings(m),
    onSuccess: (data) => {
      toast.show('Document mappings saved.', 'success');
      qc.setQueryData(['document-mappings'], data);
      setRows(data);
      onSaved();
    },
    onError: (err) => {
      toast.show(`Save failed: ${apiErrorMessage(err)}`, 'error');
    },
  });

  const patch = (i: number, change: Partial<DocumentMapping>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...change } : r)));

  const assignToMapping = (categoryName: string, picks: Array<{ docType: number; subType: number }>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.gstCategory !== categoryName) return r;
        let dt = r.docTypes;
        let st = r.subTypes;
        for (const p of picks) {
          dt = appendCsv(dt, p.docType);
          st = appendCsv(st, p.subType);
        }
        return { ...r, docTypes: dt, subTypes: st };
      }),
    );
  };

  if (query.isLoading || knownTablesQuery.isLoading) return <div className="text-xs text-slate-400">Loading…</div>;
  if (query.isError) return <PageError error={query.error} what="document mappings" />;

  const headerTables = (knownTablesQuery.data?.headerTables ?? []).filter((t) => t.exists);
  const lineTables = (knownTablesQuery.data?.lineTables ?? []).filter((t) => t.exists);

  return (
    <div className="flex flex-col gap-4">
      <DiscoverPanel mappings={rows} onAssign={assignToMapping} />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-center">Active</th>
              <th className="py-2.5 px-3">Direction</th>
              <th className="py-2.5 px-3">Header Table</th>
              <th className="py-2.5 px-3">Line Table</th>
              <th className="py-2.5 px-3">DocTypes</th>
              <th className="py-2.5 px-3">SubTypes</th>
              <th className="py-2.5 px-3">Tax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r, i) => (
              <tr key={r.gstCategory} className={r.isActive ? '' : 'opacity-50'}>
                <td className="py-2.5 px-3">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{r.displayName}</div>
                  <div className="text-[10px] font-mono text-slate-400">{r.gstCategory}</div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={r.isActive}
                    onChange={(e) => patch(i, { isActive: e.target.checked })}
                    className="w-4 h-4 text-[#00b4d8] rounded cursor-pointer"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <select
                    className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                    value={r.isOutward ? 'out' : 'in'}
                    onChange={(e) => patch(i, { isOutward: e.target.value === 'out' })}
                  >
                    <option value="out">Outward</option>
                    <option value="in">Inward</option>
                  </select>
                </td>
                <td className="py-2.5 px-3">
                  <TableSelect options={headerTables} value={r.headerTable} onChange={(v) => patch(i, { headerTable: v })} />
                </td>
                <td className="py-2.5 px-3">
                  <TableSelect options={lineTables} value={r.lineTable} onChange={(v) => patch(i, { lineTable: v })} />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    className="text-xs font-mono px-2 py-1 w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                    placeholder="all"
                    value={r.docTypes ?? ''}
                    onChange={(e) => patch(i, { docTypes: e.target.value || null })}
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    className="text-xs font-mono px-2 py-1 w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                    placeholder="all"
                    value={r.subTypes ?? ''}
                    onChange={(e) => patch(i, { subTypes: e.target.value || null })}
                  />
                </td>
                <td className="py-2.5 px-3">
                  <select
                    className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                    value={r.taxMode}
                    onChange={(e) => patch(i, { taxMode: e.target.value as DocumentMapping['taxMode'] })}
                  >
                    <option value="AUTO">Auto</option>
                    <option value="IGST">IGST</option>
                    <option value="CGSTSGST">CGST+SGST</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <button
          type="button"
          className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-[#00b4d8] hover:bg-[#0096c7] cursor-pointer disabled:opacity-50"
          disabled={save.isPending}
          onClick={() => save.mutate(rows)}
        >
          {save.isPending ? 'Saving…' : 'Save Mappings'}
        </button>
      </div>
    </div>
  );
}

function TableSelect({ options, value, onChange }: { options: KnownTableInfo[]; value: string; onChange: (v: string) => void }) {
  const inList = options.some((o) => o.name.toLowerCase() === value.toLowerCase());
  return (
    <select
      className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none min-w-[140px]"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={options.find((o) => o.name === value)?.description}
    >
      {!inList && value ? <option value={value}>{value} (legacy)</option> : null}
      {options.map((o) => (
        <option key={o.name} value={o.name}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

function DiscoverPanel({
  mappings,
  onAssign,
}: {
  mappings: DocumentMapping[];
  onAssign: (categoryName: string, picks: Array<{ docType: number; subType: number }>) => void;
}) {
  const toast = useToast();
  const [result, setResult] = useState<{ table: string; docTypes: DiscoveredDocType[] } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignTo, setAssignTo] = useState<string>('');

  const discover = useMutation({
    mutationFn: () => discoverDocTypes(),
    onSuccess: (data) => {
      setResult({ table: data.headerTable, docTypes: data.docTypes });
      setSelected(new Set());
    },
    onError: (err) => {
      toast.show(`Discover failed: ${apiErrorMessage(err)}`, 'error');
    },
  });

  const mappedIndex = (() => {
    const map = new Map<string, string[]>();
    for (const m of mappings) {
      const dts = (m.docTypes ?? '').split(',').map((s) => s.trim()).filter(Boolean);
      const sts = (m.subTypes ?? '').split(',').map((s) => s.trim()).filter(Boolean);
      for (const dt of dts) {
        if (sts.length === 0) {
          const key = `${dt}-*`;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(m.displayName);
        } else {
          for (const st of sts) {
            const key = `${dt}-${st}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(m.displayName);
          }
        }
      }
    }
    return map;
  })();

  const mappedFor = (docType: number, subType: number): string[] => {
    const exact = mappedIndex.get(`${docType}-${subType}`) ?? [];
    const wildcard = mappedIndex.get(`${docType}-*`) ?? [];
    return Array.from(new Set([...exact, ...wildcard]));
  };

  const fmtDate = (d: string | null) => (d ? d.slice(0, 10) : '');
  const keyOf = (d: DiscoveredDocType) => `${d.docType}-${d.subType}`;

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleAll = () => {
    if (!result) return;
    if (selected.size === result.docTypes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(result.docTypes.map(keyOf)));
    }
  };

  const applyAssign = () => {
    if (!result || !assignTo || selected.size === 0) return;
    const picks = result.docTypes
      .filter((d) => selected.has(keyOf(d)))
      .map((d) => ({ docType: d.docType, subType: d.subType }));
    onAssign(assignTo, picks);
    toast.show(`Added ${picks.length} DocType(s) to mapping. Don't forget to Save.`, 'success');
    setSelected(new Set());
    setAssignTo('');
  };

  useEffect(() => {
    if (result === null) discover.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong className="text-xs font-bold text-slate-900 dark:text-white">🔎 Discover CarolERP DocTypes</strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2">
            Scans all header tables in this tenant and detects unique (DocType, SubType) combinations.
          </span>
        </div>
        <button
          type="button"
          className="px-3 py-1 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
          disabled={discover.isPending}
          onClick={() => discover.mutate()}
        >
          {discover.isPending ? 'Scanning…' : 'Refresh Discovery'}
        </button>
      </div>

      {result && result.docTypes.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer"
                onClick={toggleAll}
              >
                {selected.size === result.docTypes.length ? 'Clear All' : 'Select All'}
              </button>
              <span className="text-xs text-slate-500">
                {selected.size} of {result.docTypes.length} selected · Scanned table: <code className="font-mono">{result.table}</code>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Assign selected to:</span>
              <select
                className="text-xs px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
              >
                <option value="">— Pick mapping —</option>
                {mappings.map((m) => (
                  <option key={m.gstCategory} value={m.gstCategory}>
                    {m.displayName} ({m.isOutward ? 'Outward' : 'Inward'})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="px-3 py-1 text-xs font-bold rounded-xl text-white bg-[#00b4d8] hover:bg-[#0096c7] disabled:opacity-40 cursor-pointer"
                disabled={!assignTo || selected.size === 0}
                onClick={applyAssign}
              >
                Apply
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2 px-3 w-8"></th>
                  <th className="py-2 px-3">DocType</th>
                  <th className="py-2 px-3">Sub</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3 text-right">Count</th>
                  <th className="py-2 px-3">Header Table</th>
                  <th className="py-2 px-3">Date Range</th>
                  <th className="py-2 px-3">Mapped To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {result.docTypes.map((d) => {
                  const key = keyOf(d);
                  const mapped = mappedFor(d.docType, d.subType);
                  const isChecked = selected.has(key);

                  return (
                    <tr key={key} className={isChecked ? 'bg-cyan-50/50 dark:bg-cyan-950/20' : ''}>
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(key)}
                          className="w-3.5 h-3.5 text-[#00b4d8] rounded cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">{d.docType}</td>
                      <td className="py-2 px-3 font-mono">{d.subType}</td>
                      <td className="py-2 px-3 font-medium">{d.docName || '—'}</td>
                      <td className="py-2 px-3 text-right font-mono">{d.documentCount.toLocaleString()}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{d.headerTable}</td>
                      <td className="py-2 px-3 text-[11px] text-slate-500">
                        {fmtDate(d.firstDate)} → {fmtDate(d.lastDate)}
                      </td>
                      <td className="py-2 px-3">
                        {mapped.length === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span className="text-[11px] font-bold text-[#0096c7]">{mapped.join(', ')}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export { Settings as SystemSettingsPage, Settings as default };
