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
    <div className="customizer-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="customizer-modal-card w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col" ref={modalRef}>
        
        <div className="customizer-modal-header flex items-center justify-between p-4 border-b border-border bg-surface-2">
          <div className="customizer-title-wrap flex items-center gap-2.5">
            <span className="customizer-icon" style={{ color: activeAccentHex }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
              </svg>
            </span>
            <span className="customizer-title font-bold text-sm text-[var(--text)]">Theme & Color Options</span>
          </div>
          <button
            type="button"
            className="customizer-close-btn p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
            onClick={onClose}
            aria-label="Close customizer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="customizer-modal-body">
          
          <div className="customizer-section">
            <div className="customizer-section-title-row">
              <span className="customizer-section-label">Accent Color</span>
              <span className="customizer-section-sub">
                {themeColor === 'custom' ? 'Custom' : activeThemeObj?.name || 'Modern Indigo'}
              </span>
            </div>
            <div className="customizer-grid">
              {ACCENT_THEME_COLORS.map((c) => {
                const isSelected = themeColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setThemeColor(c.id)}
                    className={`customizer-swatch-card ${isSelected ? 'selected' : ''}`}
                  >
                    <span
                      className="customizer-dot"
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected ? <span className="check-mark">✓</span> : null}
                    </span>
                    <span className="swatch-label">{c.name}</span>
                  </button>
                );
              })}

              <div
                className={`customizer-swatch-card custom-input-swatch ${
                  themeColor === 'custom' ? 'selected' : ''
                }`}
              >
                <input
                  type="color"
                  value={customColorHex}
                  onChange={(e) => {
                    setCustomColorHex(e.target.value);
                    setThemeColor('custom');
                  }}
                  className="customizer-color-input"
                  title="Pick a custom accent color"
                />
                <span
                  className="customizer-dot"
                  style={{ backgroundColor: customColorHex }}
                >
                  {themeColor === 'custom' ? <span className="check-mark">✓</span> : null}
                </span>
                <span className="swatch-label">Custom</span>
              </div>
            </div>
          </div>

          {!isDark && (
            <div className="customizer-section">
              <div className="customizer-section-title-row">
                <span className="customizer-section-label">Page Background Color</span>
                <span className="customizer-section-sub">
                  {pageBgOption === 'custom'
                    ? 'Custom'
                    : PAGE_BG_COLORS.find((p) => p.id === pageBgOption)?.name || 'Default'}
                </span>
              </div>
              <div className="customizer-grid">
                {PAGE_BG_COLORS.map((p) => {
                  const isSelected = pageBgOption === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPageBgOption(p.id)}
                      className={`customizer-swatch-card ${isSelected ? 'selected' : ''}`}
                    >
                      <span
                        className="customizer-dot page-dot"
                        style={{ backgroundColor: p.swatch }}
                      >
                        {isSelected ? <span className="check-mark dark-check">✓</span> : null}
                      </span>
                      <span className="swatch-label">{p.name}</span>
                    </button>
                  );
                })}

                <div
                  className={`customizer-swatch-card custom-input-swatch ${
                    pageBgOption === 'custom' ? 'selected' : ''
                  }`}
                >
                  <input
                    type="color"
                    value={customPageBgHex}
                    onChange={(e) => {
                      setCustomPageBgHex(e.target.value);
                      setPageBgOption('custom');
                    }}
                    className="customizer-color-input"
                    title="Pick a custom page background color"
                  />
                  <span
                    className="customizer-dot page-dot"
                    style={{ backgroundColor: customPageBgHex }}
                  >
                    {pageBgOption === 'custom' ? (
                      <span className="check-mark dark-check">✓</span>
                    ) : null}
                  </span>
                  <span className="swatch-label">Custom</span>
                </div>
              </div>
            </div>
          )}

          {!isDark && (
            <div className="customizer-section apply-toggles-section">
              <div className="customizer-section-header-uppercase">
                APPLY BACKGROUND COLOR TO
              </div>
              <div className="customizer-toggles-list">
                
                <div
                  className="customizer-toggle-row"
                  onClick={() => setNavbarThemeBg(!navbarThemeBg)}
                >
                  <div
                    className={`customizer-checkbox ${navbarThemeBg ? 'active' : ''}`}
                    style={navbarThemeBg ? { backgroundColor: extraDarkBg, borderColor: 'transparent' } : {}}
                  >
                    {navbarThemeBg ? <span className="check-mark">✓</span> : null}
                  </div>
                  <div className="toggle-label-wrap">
                    <span className="toggle-label">Header Section</span>
                    {navbarThemeBg ? (
                      <span
                        className="toggle-on-badge"
                        style={{ backgroundColor: extraDarkBg }}
                      >
                        ON
                      </span>
                    ) : null}
                  </div>
                </div>

                <div
                  className="customizer-toggle-row"
                  onClick={() => setSidebarThemeBg(!sidebarThemeBg)}
                >
                  <div
                    className={`customizer-checkbox ${sidebarThemeBg ? 'active' : ''}`}
                    style={sidebarThemeBg ? { backgroundColor: extraDarkBg, borderColor: 'transparent' } : {}}
                  >
                    {sidebarThemeBg ? <span className="check-mark">✓</span> : null}
                  </div>
                  <div className="toggle-label-wrap">
                    <span className="toggle-label">Side Menu</span>
                    {sidebarThemeBg ? (
                      <span
                        className="toggle-on-badge"
                        style={{ backgroundColor: extraDarkBg }}
                      >
                        ON
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
