import { useEffect, useRef } from 'react';
import {
  ACCENT_THEME_COLORS,
  PAGE_BG_COLORS,
  useTheme,
} from '../../../theme/ThemeContext';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeCustomizerModal({ isOpen, onClose }: ThemeCustomizerModalProps) {
  const {
    theme,
    themeColor,
    setThemeColor,
    customColorHex,
    setCustomColorHex,
    pageBgOption,
    setPageBgOption,
    customPageBgHex,
    setCustomPageBgHex,
    navbarThemeBg,
    setNavbarThemeBg,
    sidebarThemeBg,
    setSidebarThemeBg,
    activeAccentHex,
    extraDarkBg,
  } = useTheme();

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const activeThemeObj = ACCENT_THEME_COLORS.find((c) => c.id === themeColor);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-[95vw] sm:max-w-md bg-white dark:bg-[#151d2a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-white animate-in zoom-in-95 duration-200"
        ref={modalRef}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60" style={{ color: activeAccentHex }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
              </svg>
            </span>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Theme & Color Options</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Personalize your workspace aesthetic</p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
            onClick={onClose}
            aria-label="Close customizer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-5 text-xs">
          {/* Accent Color Section */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">Accent Theme Color</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {themeColor === 'custom' ? 'Custom' : activeThemeObj?.name || 'Modern Indigo'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ACCENT_THEME_COLORS.map((c) => {
                const isSelected = themeColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setThemeColor(c.id)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-xs'
                        : 'border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900"
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected ? <span className="text-white text-xs font-black drop-shadow-xs">✓</span> : null}
                    </span>
                    <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight truncate w-full">{c.name}</span>
                  </button>
                );
              })}

              <label
                className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                  themeColor === 'custom'
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-xs'
                    : 'border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
                title="Pick custom color"
              >
                <input
                  type="color"
                  value={customColorHex}
                  onChange={(e) => {
                    setCustomColorHex(e.target.value);
                    setThemeColor('custom');
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 border border-slate-300 dark:border-slate-600"
                  style={{ backgroundColor: customColorHex }}
                >
                  {themeColor === 'custom' ? <span className="text-white text-xs font-black drop-shadow-xs">✓</span> : null}
                </span>
                <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">Custom</span>
              </label>
            </div>
          </div>

          {/* Page Background Section (Light Mode) */}
          {!isDark && (
            <div className="flex flex-col gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">Page Background Color</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pageBgOption === 'custom'
                    ? 'Custom'
                    : PAGE_BG_COLORS.find((p) => p.id === pageBgOption)?.name || 'Default'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAGE_BG_COLORS.map((p) => {
                  const isSelected = pageBgOption === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPageBgOption(p.id)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-xs'
                          : 'border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 border border-slate-300 dark:border-slate-600"
                        style={{ backgroundColor: p.swatch }}
                      >
                        {isSelected ? <span className="text-slate-800 text-xs font-black">✓</span> : null}
                      </span>
                      <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight truncate w-full">{p.name}</span>
                    </button>
                  );
                })}

                <label
                  className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                    pageBgOption === 'custom'
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-xs'
                      : 'border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                  title="Pick custom page background"
                >
                  <input
                    type="color"
                    value={customPageBgHex}
                    onChange={(e) => {
                      setCustomPageBgHex(e.target.value);
                      setPageBgOption('custom');
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 border border-slate-300 dark:border-slate-600"
                    style={{ backgroundColor: customPageBgHex }}
                  >
                    {pageBgOption === 'custom' ? (
                      <span className="text-slate-800 text-xs font-black">✓</span>
                    ) : null}
                  </span>
                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">Custom</span>
                </label>
              </div>
            </div>
          )}

          {/* Background Apply Toggles */}
          {!isDark && (
            <div className="flex flex-col gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">APPLY BACKGROUND COLOR TO</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setNavbarThemeBg(!navbarThemeBg)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Header Section</span>
                  <div className="flex items-center gap-2">
                    {navbarThemeBg && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: extraDarkBg }}
                      >
                        ON
                      </span>
                    )}
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        navbarThemeBg ? 'border-transparent text-white' : 'border-slate-300 dark:border-slate-600 bg-transparent'
                      }`}
                      style={
                        navbarThemeBg
                          ? { backgroundColor: extraDarkBg, borderColor: 'transparent' }
                          : {}
                      }
                    >
                      {navbarThemeBg && <span className="text-[11px] font-bold">✓</span>}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarThemeBg(!sidebarThemeBg)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Side Menu</span>
                  <div className="flex items-center gap-2">
                    {sidebarThemeBg && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: extraDarkBg }}
                      >
                        ON
                      </span>
                    )}
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        sidebarThemeBg ? 'border-transparent text-white' : 'border-slate-300 dark:border-slate-600 bg-transparent'
                      }`}
                      style={
                        sidebarThemeBg
                          ? { backgroundColor: extraDarkBg, borderColor: 'transparent' }
                          : {}
                      }
                    >
                      {sidebarThemeBg && <span className="text-[11px] font-bold">✓</span>}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
