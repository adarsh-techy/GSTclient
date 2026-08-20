import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ThemeState {
  mode: 'light' | 'dark';
  themeColor: string;
  customColorHex: string;
  pageBgOption: string;
  customPageBgHex: string;
  navbarThemeBg: boolean;
  sidebarThemeBg: boolean;
}

const getStoredTheme = (): 'light' | 'dark' => {
  try {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

const initialState: ThemeState = {
  mode: getStoredTheme(),
  themeColor: localStorage.getItem('app-theme-color') || 'blue',
  customColorHex: localStorage.getItem('app-custom-color-hex') || '#4F46E5',
  pageBgOption: localStorage.getItem('app-page-bg') || 'default',
  customPageBgHex: localStorage.getItem('app-custom-page-bg-hex') || '#F8FAFC',
  navbarThemeBg: localStorage.getItem('app-navbar-theme-bg') === 'true',
  sidebarThemeBg: localStorage.getItem('app-sidebar-theme-bg') === 'true',
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<'light' | 'dark'>) {
      state.mode = action.payload;
      localStorage.setItem('app-theme', action.payload);
      document.documentElement.setAttribute('data-theme', action.payload);
    },
    toggleThemeMode(state) {
      const next = state.mode === 'light' ? 'dark' : 'light';
      state.mode = next;
      localStorage.setItem('app-theme', next);
      document.documentElement.setAttribute('data-theme', next);
    },
    setThemeColor(state, action: PayloadAction<string>) {
      state.themeColor = action.payload;
      localStorage.setItem('app-theme-color', action.payload);
    },
    setCustomColorHex(state, action: PayloadAction<string>) {
      state.customColorHex = action.payload;
      localStorage.setItem('app-custom-color-hex', action.payload);
    },
    setPageBgOption(state, action: PayloadAction<string>) {
      state.pageBgOption = action.payload;
      localStorage.setItem('app-page-bg', action.payload);
    },
    setCustomPageBgHex(state, action: PayloadAction<string>) {
      state.customPageBgHex = action.payload;
      localStorage.setItem('app-custom-page-bg-hex', action.payload);
    },
    setNavbarThemeBg(state, action: PayloadAction<boolean>) {
      state.navbarThemeBg = action.payload;
      localStorage.setItem('app-navbar-theme-bg', String(action.payload));
    },
    setSidebarThemeBg(state, action: PayloadAction<boolean>) {
      state.sidebarThemeBg = action.payload;
      localStorage.setItem('app-sidebar-theme-bg', String(action.payload));
    },
  },
});

export const {
  setThemeMode,
  toggleThemeMode,
  setThemeColor,
  setCustomColorHex,
  setPageBgOption,
  setCustomPageBgHex,
  setNavbarThemeBg,
  setSidebarThemeBg,
} = themeSlice.actions;

export default themeSlice.reducer;
