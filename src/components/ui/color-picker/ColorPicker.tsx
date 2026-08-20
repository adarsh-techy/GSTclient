import { useEffect, useRef, useState } from 'react';
import {
  ACCENT_THEME_COLORS,
  PAGE_BG_COLORS,
  useTheme,
} from '../../../theme/ThemeContext';

export function ColorPicker() {
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

  const [showColorPicker, setShowColorPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';
  const activeThemeObj = ACCENT_THEME_COLORS.find((c) => c.id === themeColor);

  useEffect(() => {
    if (!showColorPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowColorPicker(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showColorPicker]);

  return (
    <div className="color-picker-wrapper relative inline-flex" ref={containerRef}>
      
      <button
        type="button"
        onClick={() => setShowColorPicker(!showColorPicker)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        title="Choose Accent Theme & Background Colors"
        aria-label="Choose Accent Theme & Background Colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: activeAccentHex }}
        >
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.75 1.7-1.67 0-.42-.16-.82-.44-1.12-.27-.3-.42-.7-.42-1.13 0-.92.75-1.67 1.67-1.67H16c3.3 0 6-2.7 6-6 0-4.97-4.48-9-10-9z" />
        </svg>
        <span
          className="absolute bottom-1 right-1 w-2 h-2 rounded-full ring-1 ring-white dark:ring-slate-900 shadow-xs"
          style={{ backgroundColor: activeAccentHex }}
        />
      </button>

      {showColorPicker && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] max-w-xs sm:w-80 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col gap-4 animate-in fade-in zoom-in-95">
          
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10.5px]">Accent Color</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {themeColor === 'custom' ? 'Custom' : activeThemeObj?.name || 'Modern Indigo'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ACCENT_THEME_COLORS.map((c) => {
                const isSelected = themeColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setThemeColor(c.id)}
                    className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-xs'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                    title={c.name}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900"
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && <span className="text-white text-xs font-black drop-shadow-xs">✓</span>}
                    </span>
                    <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight truncate w-full">{c.name}</span>
                  </button>
                );
              })}

              <label
                className={`relative flex flex-col items-center gap-1.5 p-1.5 rounded-xl border transition-all cursor-pointer ${
                  themeColor === 'custom'
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-xs'
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
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
                  {themeColor === 'custom' && <span className="text-white text-xs font-black drop-shadow-xs">✓</span>}
                </span>
                <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">Custom</span>
              </label>
            </div>
          </div>

          {!isDark && (
            <div className="flex flex-col gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10.5px]">Page Background Color</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pageBgOption === 'custom'
                    ? 'Custom'
                    : PAGE_BG_COLORS.find((p) => p.id === pageBgOption)?.name || 'Default'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {PAGE_BG_COLORS.map((p) => {
                  const isSelected = pageBgOption === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPageBgOption(p.id)}
                      className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-xs'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                      title={p.name}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 border border-slate-300 dark:border-slate-600"
                        style={{ backgroundColor: p.swatch }}
                      >
                        {isSelected && <span className="text-slate-800 text-xs font-black">✓</span>}
                      </span>
                      <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight truncate w-full">{p.name}</span>
                    </button>
                  );
                })}

                <label
                  className={`relative flex flex-col items-center gap-1.5 p-1.5 rounded-xl border transition-all cursor-pointer ${
                    pageBgOption === 'custom'
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-xs'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
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
                    {pageBgOption === 'custom' && (
                      <span className="text-slate-800 text-xs font-black">✓</span>
                    )}
                  </span>
                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">Custom</span>
                </label>
              </div>
            </div>
          )}

          {!isDark && (
            <div className="flex flex-col gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-3">
              <p className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">APPLY BACKGROUND COLOR TO</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setNavbarThemeBg(!navbarThemeBg)}
                  className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
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
                  className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
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
      )}
    </div>
  );
}
