import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const getExtraDarkColor = (hex: string, factor = 0.25): string => {
  if (!hex) return '#050714';
  const cleanHex = hex.replace('#', '').slice(0, 6);
  const shorthandRegex = /^([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = cleanHex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return '#050714';
  const r = Math.floor(parseInt(result[1], 16) * factor);
  const g = Math.floor(parseInt(result[2], 16) * factor);
  const b = Math.floor(parseInt(result[3], 16) * factor);
  return `rgb(${r}, ${g}, ${b})`;
};

export const getVeryLightTint = (hex: string, mixRatio = 0.015): string => {
  if (!hex) return '#FCFCFE';
  const cleanHex = hex.replace('#', '').slice(0, 6);
  const shorthandRegex = /^([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = cleanHex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return '#FCFCFE';
  const r = Math.round(parseInt(result[1], 16) * mixRatio + 255 * (1 - mixRatio));
  const g = Math.round(parseInt(result[2], 16) * mixRatio + 255 * (1 - mixRatio));
  const b = Math.round(parseInt(result[3], 16) * mixRatio + 255 * (1 - mixRatio));
  return `rgb(${r}, ${g}, ${b})`;
};

function hexToRgbValues(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (isNaN(num)) return '79, 70, 229';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export interface AccentThemeColor {
  id: string;
  name: string;
  hex: string;
}

export const ACCENT_THEME_COLORS: AccentThemeColor[] = [
  { id: 'blue', name: 'Modern Indigo', hex: '#4F46E5' },
  { id: 'green', name: 'Emerald Green', hex: '#10b981' },
  { id: 'pink', name: 'Hot Pink', hex: '#EC4899' },
  { id: 'purple', name: 'Royal Purple', hex: '#8b5cf6' },
  { id: 'amber', name: 'Warm Amber', hex: '#f59e0b' },
  { id: 'red', name: 'Crimson Red', hex: '#ef4444' },
  { id: 'cyan', name: 'Ocean Cyan', hex: '#06b6d4' },
];

export interface PageBgColor {
  id: string;
  name: string;
  lightHex: string;
  swatch: string;
}

export const PAGE_BG_COLORS: PageBgColor[] = [
  { id: 'default', name: 'Default Pure White', lightHex: '#FFFFFF', swatch: '#FFFFFF' },
  { id: 'soft-snow', name: 'Soft Snow', lightHex: '#FAFCFE', swatch: '#FAFCFE' },
  { id: 'soft-blue', name: 'Soft Blue', lightHex: '#F0F9FF', swatch: '#E0F2FE' },
  { id: 'soft-mint', name: 'Soft Mint', lightHex: '#F0FDF4', swatch: '#DCFCE7' },
  { id: 'lavender', name: 'Lavender', lightHex: '#F5F3FF', swatch: '#EDE9FE' },
  { id: 'soft-rose', name: 'Soft Rose', lightHex: '#FFF1F2', swatch: '#FFE4E6' },
  { id: 'warm-sand', name: 'Warm Sand', lightHex: '#FAF7F2', swatch: '#FAF7F2' },
];

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  customColorHex: string;
  setCustomColorHex: (hex: string) => void;
  pageBgOption: string;
  setPageBgOption: (option: string) => void;
  customPageBgHex: string;
  setCustomPageBgHex: (hex: string) => void;
  navbarThemeBg: boolean;
  setNavbarThemeBg: (bg: boolean) => void;
  sidebarThemeBg: boolean;
  setSidebarThemeBg: (bg: boolean) => void;
  activeAccentHex: string;
  extraDarkBg: string;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem('app-sidebar-collapsed') === 'true';
  });

  const setIsSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    localStorage.setItem('app-sidebar-collapsed', String(collapsed));
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsedState((prev) => {
        const next = !prev;
        localStorage.setItem('app-sidebar-collapsed', String(next));
        return next;
      });
    }
  };

  const [themeColor, setThemeColorState] = useState<string>(() => {
    return localStorage.getItem('app-theme-color-id') || 'blue';
  });

  const [customColorHex, setCustomColorHexState] = useState<string>(() => {
    return localStorage.getItem('app-custom-color-hex') || '#4F46E5';
  });

  const [pageBgOption, setPageBgOptionState] = useState<string>(() => {
    return localStorage.getItem('app-page-bg-option') || 'default';
  });

  const [customPageBgHex, setCustomPageBgHexState] = useState<string>(() => {
    return localStorage.getItem('app-custom-page-bg-hex') || '#FFFFFF';
  });

  const [navbarThemeBg, setNavbarThemeBgState] = useState<boolean>(() => {
    return localStorage.getItem('app-navbar-theme-bg') === 'true';
  });

  const [sidebarThemeBg, setSidebarThemeBgState] = useState<boolean>(() => {
    return localStorage.getItem('app-sidebar-theme-bg') === 'true';
  });

  const activeThemeObj = ACCENT_THEME_COLORS.find((c) => c.id === themeColor);
  const activeAccentHex = themeColor === 'custom' ? customColorHex : activeThemeObj?.hex || '#4F46E5';
  const extraDarkBg = getExtraDarkColor(activeAccentHex);

  const activePageObj = PAGE_BG_COLORS.find((p) => p.id === pageBgOption);
  const activePageBgHex = pageBgOption === 'custom' ? customPageBgHex : activePageObj?.lightHex || '#FFFFFF';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev);

  useEffect(() => {
    const root = document.documentElement;
    const activeRgb = hexToRgbValues(activeAccentHex);

    root.style.setProperty('--primary', activeAccentHex);
    root.style.setProperty('--custom-theme', activeAccentHex);
    root.style.setProperty('--custom-theme-hover', `${activeAccentHex}ee`);
    root.style.setProperty('--custom-theme-dark', `${activeAccentHex}dd`);
    root.style.setProperty('--custom-theme-05', `rgba(${activeRgb}, 0.05)`);
    root.style.setProperty('--custom-theme-10', `rgba(${activeRgb}, 0.1)`);
    root.style.setProperty('--custom-theme-15', `rgba(${activeRgb}, 0.15)`);
    root.style.setProperty('--custom-theme-20', `rgba(${activeRgb}, 0.2)`);
    root.style.setProperty('--custom-theme-30', `rgba(${activeRgb}, 0.3)`);

    if (theme === 'dark') {
      root.style.setProperty('--bg', '#0b0f19');
      root.style.setProperty('--surface', '#151d2a');
      root.style.setProperty('--surface-2', '#1e293b');
      root.style.setProperty('--border', '#263347');
      root.style.setProperty('--text', '#f8fafc');
      root.style.setProperty('--text-muted', '#94a3b8');

      root.style.setProperty('--custom-page-bg', '#0b0f19');
      root.style.setProperty('--custom-topbar-bg', '#151d2a');
      root.style.setProperty('--custom-topbar-text', '#f8fafc');
      root.style.setProperty('--custom-topbar-border', '#263347');

      root.style.setProperty('--custom-sidebar-bg', '#0f172a');
      root.style.setProperty('--custom-sidebar-text', '#f8fafc');
      root.style.setProperty('--custom-sidebar-muted', '#94a3b8');
      root.style.setProperty('--custom-sidebar-border', '#263347');
    } else {
      const veryLightTint = getVeryLightTint(activeAccentHex, 0.015);

      root.style.setProperty('--bg', activePageBgHex);
      root.style.setProperty('--surface', '#ffffff');
      root.style.setProperty('--surface-2', '#f8fafc');
      root.style.setProperty('--border', '#e2e8f0');
      root.style.setProperty('--text', '#0f172a');
      root.style.setProperty('--text-muted', '#475569');

      root.style.setProperty('--custom-page-bg', activePageBgHex);

      const topbarBgColor = navbarThemeBg ? extraDarkBg : veryLightTint;
      root.style.setProperty('--custom-topbar-bg', topbarBgColor);
      root.style.setProperty('--custom-topbar-text', navbarThemeBg ? '#ffffff' : '#0f172a');
      root.style.setProperty('--custom-topbar-border', navbarThemeBg ? 'rgba(255, 255, 255, 0.15)' : '#e2e8f0');

      const sidebarBgColor = sidebarThemeBg ? extraDarkBg : veryLightTint;
      root.style.setProperty('--custom-sidebar-bg', sidebarBgColor);
      root.style.setProperty('--custom-sidebar-text', sidebarThemeBg ? '#ffffff' : '#1e293b');
      root.style.setProperty('--custom-sidebar-muted', sidebarThemeBg ? '#94a3b8' : '#64748b');
      root.style.setProperty('--custom-sidebar-border', sidebarThemeBg ? 'rgba(255, 255, 255, 0.15)' : '#e2e8f0');
    }

    localStorage.setItem('app-theme-color-id', themeColor);
    localStorage.setItem('app-custom-color-hex', customColorHex);
    localStorage.setItem('app-page-bg-option', pageBgOption);
    localStorage.setItem('app-custom-page-bg-hex', customPageBgHex);
    localStorage.setItem('app-navbar-theme-bg', String(navbarThemeBg));
    localStorage.setItem('app-sidebar-theme-bg', String(sidebarThemeBg));
  }, [theme, activeAccentHex, activePageBgHex, extraDarkBg, navbarThemeBg, sidebarThemeBg, themeColor, customColorHex, pageBgOption, customPageBgHex]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        themeColor,
        setThemeColor: setThemeColorState,
        customColorHex,
        setCustomColorHex: setCustomColorHexState,
        pageBgOption,
        setPageBgOption: setPageBgOptionState,
        customPageBgHex,
        setCustomPageBgHex: setCustomPageBgHexState,
        navbarThemeBg,
        setNavbarThemeBg: setNavbarThemeBgState,
        sidebarThemeBg,
        setSidebarThemeBg: setSidebarThemeBgState,
        activeAccentHex,
        extraDarkBg,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toggleMobileSidebar,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
