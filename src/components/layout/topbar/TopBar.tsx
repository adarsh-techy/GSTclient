import { useEffect, useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../auth/AuthContext';
import { ColorPicker, NotificationCenter } from '../../ui';

export function Topbar() {
  const {
    theme,
    toggleTheme,
    activeAccentHex,
    navbarThemeBg,
    sidebarThemeBg,
    isMobileSidebarOpen,
    isSidebarCollapsed,
    toggleSidebar,
  } = useTheme();

  const { user, logout } = useAuth();
  const [now, setNow] = useState(() => new Date());

  const isCustomBg = (navbarThemeBg || sidebarThemeBg) && theme === 'light';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDateTime =
    now.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ' · ' +
    now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

  return (
    <header
      className={`h-16 px-3 sm:px-5 md:px-7 flex items-center justify-between sticky top-0 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all border-b border-slate-200/60 dark:border-slate-800/90 ${
        isCustomBg
          ? 'text-white'
          : 'dark:bg-[#0f172a] text-slate-900 dark:text-slate-100'
      }`}
      style={{
        backgroundColor: theme === 'dark' ? '#0f172a' : 'var(--custom-topbar-bg)',
        color: isCustomBg ? 'var(--custom-sidebar-text)' : undefined,
      }}
    >
      {/* Left Section: Sidebar Toggle Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className={`${
            isSidebarCollapsed ? 'flex' : 'flex lg:hidden'
          } ${
            isMobileSidebarOpen ? 'hidden' : ''
          } items-center justify-center w-9 h-9 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer border border-slate-200/50 dark:border-slate-700/50`}
          onClick={toggleSidebar}
          title="Show navigation sidebar"
          aria-label="Show navigation sidebar"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Right Section: System Time, Notifications, Theme, Color, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Date & Time Widget */}
        <div
          className={`hidden xl:flex items-center gap-2 text-xs font-semibold mr-1 px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 ${
            isCustomBg ? 'text-white/90' : 'text-slate-600 dark:text-slate-300'
          }`}
          title="Current System Date & Time"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: activeAccentHex }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-[11.5px]">{formattedDateTime}</span>
        </div>

        {/* Notifications Popover */}
        <NotificationCenter />

        {/* Dark/Light Mode Toggle */}
        <button
          type="button"
          className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        {/* Palette & Theme Customizer */}
        <ColorPicker />

        {/* User Pill / Quick Logout */}
        {user ? (
          <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-700/80">
            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[110px]">
                {user.displayName || user.emplCode}
              </span>
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 leading-tight">
                {user.role}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
              title="Sign Out of Workspace"
              aria-label="Sign Out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export { Topbar as TopBar, Topbar as default };
