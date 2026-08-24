import { useEffect, useState, useMemo, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { login as apiLogin } from '../../api';
import { fetchPublicTenants, type TenantSummary } from '../../api';
import { getActiveTenantId, setActiveTenantId } from '../../api';
import { apiErrorMessage } from '../../api';
import loginPageImg from '../../assets/loginpage.png';
import caroLogo from '../../assets/carologo.png';
import caroLogoDark from '../../assets/carologodark.png';
import bufferImg from '../../assets/bufferimage.png';

export function Login() {
  const { commitAuth, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Preload and decode splash animation images immediately on mount so they appear with 0ms delay
  useEffect(() => {
    const preloadAsset = (src: string) => {
      const img = new Image();
      img.src = src;
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    };
    preloadAsset(caroLogoDark);
    preloadAsset(bufferImg);
    preloadAsset(caroLogo);
    preloadAsset(loginPageImg);
  }, []);

  const [tenantId, setTenantId] = useState<string>(getActiveTenantId());
  const tenantsQuery = useQuery<TenantSummary[]>({
    queryKey: ['public-tenants'],
    queryFn: async () => {
      const data = await fetchPublicTenants();
      try {
        localStorage.setItem('gst_public_tenants', JSON.stringify(data));
      } catch {
        // Ignore storage quotas
      }
      return data;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem('gst_public_tenants');
        return cached ? (JSON.parse(cached) as TenantSummary[]) : undefined;
      } catch {
        return undefined;
      }
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
  });
  const tenants = useMemo<TenantSummary[]>(() => tenantsQuery.data ?? [], [tenantsQuery.data]);

  useEffect(() => {
    if (tenants.length === 0) return;
    const current = getActiveTenantId();
    const next = tenants.some((t: TenantSummary) => t.tenantId === current) ? current : tenants[0].tenantId;
    if (next !== current) setActiveTenantId(next);
    setTenantId(next);
  }, [tenants]);

  useEffect(() => {
    if (isAuthenticated && !submitting) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, submitting, navigate, from]);

  const onTenantChange = (id: string) => {
    setActiveTenantId(id);
    setTenantId(id);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const authPromise = apiLogin({ username: username.trim(), password });
      const timerPromise = new Promise((resolve) => setTimeout(resolve, 3400));
      const [authResponse] = await Promise.all([authPromise, timerPromise]);

      commitAuth(authResponse);
      navigate(from, { replace: true });
    } catch (err) {
      setSubmitting(false);
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-950 overflow-x-hidden">
      {/* Hidden eager-loaded DOM references ensuring GPU textures are warm */}
      <div className="sr-only opacity-0 pointer-events-none -z-50 absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <img src={caroLogoDark} alt="" loading="eager" decoding="sync" />
        <img src={bufferImg} alt="" loading="eager" decoding="sync" />
      </div>

      {/* Buffer Splash Loading Screen */}
      {submitting ? (
        <div className="fixed inset-0 bg-slate-950 z-[99999] flex items-center justify-center p-6">
          <img
            src={bufferImg}
            alt="Buffer Background"
            loading="eager"
            decoding="sync"
            className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_85%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <div className="relative w-72 sm:w-96 h-28 sm:h-36 flex items-center justify-center">
              <img
                src={caroLogoDark}
                alt="Carol Solutions Base"
                loading="eager"
                decoding="sync"
                className="max-w-full max-h-full object-contain opacity-25"
              />
              <img
                src={caroLogoDark}
                alt="Carol Solutions Filling"
                loading="eager"
                decoding="sync"
                className="absolute inset-0 m-auto max-w-full max-h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.65)]"
                style={{ animation: 'logoWhiteFill 3.4s linear forwards' }}
              />
            </div>

            <div className="w-80 sm:w-96 h-2 bg-white/15 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#00b4d8] via-cyan-300 to-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.9)]"
                style={{ animation: 'splashFill 3.4s linear forwards' }}
              />
            </div>
            <p className="text-xs text-slate-300 font-medium tracking-wide">
              Authenticating &amp; provisioning GST workspace…
            </p>
          </div>
        </div>
      ) : null}

      {/* Left Column: Branding Showcase */}
      <div className="relative md:w-[58%] lg:w-[62%] min-h-[400px] md:min-h-screen bg-slate-950 flex flex-col justify-end p-8 sm:p-12 lg:p-16 text-white overflow-hidden">
        <img
          src={loginPageImg}
          alt="GSTAutoPilot Illustration"
          loading="eager"
          decoding="sync"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider text-blue-300 bg-blue-500/20 border border-blue-400/40 mb-3">
            ENTERPRISE GST AUTOMATION
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-2.5">
            Smart &amp; Automated GST Compliance Engine
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            Powered by <span className="font-semibold text-[#ef4444]">Carol</span>{' '}
            <span className="font-semibold text-[#3b82f6]">Solutions</span>’ high-speed ERP integration framework.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-100 font-medium">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Direct CarolERP Stored Procedure Sync</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-100 font-medium">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Automated GSTR-1, 2B &amp; 3B Reconciliation</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-100 font-medium">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Instant e-Invoice &amp; e-Way Bill Processing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Always Light Theme Form */}
      <div className="md:w-[42%] lg:w-[38%] min-h-screen bg-white flex flex-col justify-between p-8 sm:p-12 lg:p-14 text-slate-900 z-20 shadow-2xl">
        <div className="w-full max-w-sm mx-auto my-auto flex flex-col">
          {/* Logo & Headline */}
          <div className="flex flex-col items-center text-center mb-6">
            <img src={caroLogo} alt="Carol Solutions" loading="eager" decoding="sync" className="w-56 sm:w-64 h-auto object-contain -mb-3 sm:-mb-4 drop-shadow-xs" />
            <p className="text-xs text-slate-500 leading-relaxed max-w-[320px]">
              Streamline your GST compliance with Carol Solutions automated filing &amp; reconciliation engine.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Multi-Tenant Selector */}
            {tenants.length > 1 ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600" htmlFor="company-select">
                  Company / Tenant Organization
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                      <line x1="9" y1="6" x2="9" y2="6.01" />
                      <line x1="15" y1="6" x2="15" y2="6.01" />
                      <line x1="9" y1="10" x2="9" y2="10.01" />
                      <line x1="15" y1="10" x2="15" y2="10.01" />
                      <line x1="9" y1="14" x2="9" y2="14.01" />
                      <line x1="15" y1="14" x2="15" y2="14.01" />
                      <line x1="9" y1="18" x2="15" y2="18" />
                    </svg>
                  </span>
                  <select
                    id="company-select"
                    className="w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                    value={tenantId}
                    onChange={(e) => onTenantChange(e.target.value)}
                    disabled={submitting}
                  >
                    {tenants.map((t) => (
                      <option key={t.tenantId} value={t.tenantId}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600" htmlFor="username-input">
                Username / User Code
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="username-input"
                  type="text"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#d2e2fa] bg-[#edf4fe] text-slate-900 text-xs font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  placeholder="GUEST"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600" htmlFor="password-input">
                Security Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#d2e2fa] bg-[#edf4fe] text-slate-900 text-xs font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message Display */}
            {error ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            ) : null}

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mt-1"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner w-4 h-4 border-2" aria-hidden="true" />
                  <span>Authenticating Workspace…</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <span className="text-base font-normal">→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Attribution */}
          <div className="mt-8 text-center text-xs text-slate-400">
            <span>Developed by </span>
            <span className="font-bold text-red-500">Carol</span>
            <span className="font-bold text-blue-500">Solutions</span>
            <span> @2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Login as LoginPage, Login as default };
