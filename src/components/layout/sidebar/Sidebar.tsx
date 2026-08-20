import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../auth/AuthContext';
import { useTheme } from '../../../theme/ThemeContext';
import { fetchCompany } from '../../../api';
import { CompanySelector } from '../../common';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  requiredRole: string | null;
}

interface NavGroup {
  sectionTitle: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    sectionTitle: 'MAIN MENU',
    items: [
      {
        to: '/',
        label: 'Dashboard',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
        ),
        requiredRole: null,
      },
      {
        to: '/invoices',
        label: 'Invoices',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        ),
        requiredRole: null,
      },
      {
        to: '/einvoice-history',
        label: 'e-Invoice History',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
        requiredRole: null,
      },
      {
        to: '/ewaybills',
        label: 'e-Way Bills',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        ),
        requiredRole: null,
      },
    ],
  },
  {
    sectionTitle: 'GST RETURNS',
    items: [
      {
        to: '/gstr1',
        label: 'GSTR-1',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        ),
        requiredRole: null,
      },
      {
        to: '/gstr2b',
        label: 'GSTR-2B',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        ),
        requiredRole: null,
      },
      {
        to: '/gstr3b',
        label: 'GSTR-3B',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <polyline points="9 14 11 16 15 12" />
          </svg>
        ),
        requiredRole: null,
      },
      {
        to: '/bill-of-entry',
        label: 'Bill of Entry',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
        requiredRole: null,
      },
    ],
  },
  {
    sectionTitle: 'AUDIT & RECONCILIATION',
    items: [
      {
        to: '/recon',
        label: 'Reconciliation',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        ),
        requiredRole: null,
      },
      {
        to: '/filings',
        label: 'Filings',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        ),
        requiredRole: null,
      },
    ],
  },
  {
    sectionTitle: 'ADMINISTRATION',
    items: [
      {
        to: '/onboarding',
        label: 'Onboard Client',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        ),
        requiredRole: 'Admin',
      },
      {
        to: '/users',
        label: 'Users',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M9 21v-2a4 4 0 0 0-4-4H3a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <circle cx="19" cy="11" r="3" />
          </svg>
        ),
        requiredRole: 'Admin',
      },
      {
        to: '/settings',
        label: 'Settings',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
        requiredRole: 'Admin',
      },
    ],
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const {
    theme,
    activeAccentHex,
    sidebarThemeBg,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSidebarCollapsed,
    toggleSidebar,
  } = useTheme();
  const isCustomSidebarBg = sidebarThemeBg && theme === 'light';

  const companyQuery = useQuery({
    queryKey: ['company'],
    queryFn: fetchCompany,
    enabled: !!user,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const companyName = companyQuery.data?.companyName?.trim() || 'THE KERALA STATE COIR CORPORATION LTD';

  return (
    <>
      
      {isMobileSidebarOpen ? (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[140] lg:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-[260px] sm:w-[250px] h-screen flex flex-col px-3.5 py-4 z-[150] shadow-[10px_0_35px_rgba(0,0,0,0.08)] dark:shadow-[12px_0_40px_rgba(0,0,0,0.7)] transition-transform duration-300 overflow-hidden border-r ${isMobileSidebarOpen
            ? 'translate-x-0'
            : isSidebarCollapsed
              ? '-translate-x-full'
              : '-translate-x-full lg:translate-x-0'
          } ${isCustomSidebarBg
            ? 'text-white border-white/10'
            : 'dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border-slate-200/60 dark:border-slate-800/90'
          }`}
        style={{
          backgroundColor: theme === 'dark' ? '#0f172a' : 'var(--custom-sidebar-bg)',
          color: isCustomSidebarBg ? 'var(--custom-sidebar-text)' : undefined,
        }}
      >
        
        <div className={`flex flex-col pb-3 mb-3 border-b ${isCustomSidebarBg ? 'border-white/15' : 'border-slate-200/70 dark:border-slate-800/80'}`}>
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm flex-none text-white transition-transform duration-200 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${activeAccentHex} 0%, #0284c7 100%)`,
                  boxShadow: `0 3px 12px ${activeAccentHex}40`,
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L19 21L12 17L5 21L12 2Z" fill="currentColor" fillOpacity="0.25" />
                  <path d="M12 2L19 21L12 17L5 21L12 2Z" />
                  <path d="M12 17V9" strokeWidth="2.4" />
                </svg>
              </div>

              <span
                className="font-black text-[18px] tracking-tight leading-none text-slate-900 dark:text-white"
                style={{ color: isCustomSidebarBg ? '#ffffff' : undefined }}
              >
                GSTAutoPilot
              </span>
            </div>

            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              onClick={toggleSidebar}
              title="Hide sidebar"
              aria-label="Hide sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div
            className="text-[8px] sm:text-[8.5px] font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis uppercase tracking-tight mt-1.5"
            style={{ color: isCustomSidebarBg ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}
            title={companyName}
          >
            {companyName}
          </div>
        </div>

        <div className={`pb-3 mb-2 border-b ${isCustomSidebarBg ? 'border-white/15' : 'border-slate-100 dark:border-slate-800/80'}`}>
          <CompanySelector />
        </div>

        <nav className="flex-1 min-h-0 flex flex-col gap-3.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.requiredRole || user?.role === item.requiredRole
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.sectionTitle} className="flex flex-col gap-0.5">
                <div className={`text-[9.5px] font-bold uppercase tracking-wider px-2.5 py-1 ${isCustomSidebarBg ? 'text-white/50' : 'text-slate-400 dark:text-slate-500'}`}>
                  {group.sectionTitle}
                </div>
                <div className="flex flex-col gap-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        isActive
                          ? 'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors shadow-2xs'
                          : `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${isCustomSidebarBg
                            ? 'text-white/75 hover:bg-white/10 hover:text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                          }`
                      }
                      style={({ isActive }) =>
                        isActive
                          ? isCustomSidebarBg
                            ? {
                              backgroundColor: 'rgba(255, 255, 255, 0.18)',
                              color: '#ffffff',
                            }
                            : {
                              backgroundColor: `${activeAccentHex}16`,
                              color: activeAccentHex,
                            }
                          : {}
                      }
                    >
                      <span className="flex items-center justify-center shrink-0">
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {user ? (
          <div className={`pt-2.5 mt-auto border-t ${isCustomSidebarBg ? 'border-white/15' : 'border-slate-100 dark:border-slate-800/80'}`}>
            <div className={`flex items-center justify-between p-2 rounded-xl border ${isCustomSidebarBg ? 'bg-white/10 border-white/15' : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/80 shadow-2xs'}`}>
              <div
                className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs"
                style={{ backgroundColor: activeAccentHex }}
              >
                {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col min-w-0 flex-1 px-2">
                <div className="text-[11.5px] font-bold truncate leading-tight" style={{ color: isCustomSidebarBg ? '#ffffff' : undefined }}>
                  {user.displayName || user.emplCode}
                </div>
                <div className="flex items-center gap-1.5 text-[9.5px]" style={{ color: isCustomSidebarBg ? 'rgba(255,255,255,0.7)' : undefined }}>
                  <span className="truncate text-slate-400">{user.emplCode}</span>
                  <span className="px-1 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[8.5px] border border-blue-200/50 dark:border-blue-900/50">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                onClick={logout}
                title="Sign out of GSTAutoPilot"
                aria-label="Sign out"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        ) : null}

      </aside>
    </>
  );
}
