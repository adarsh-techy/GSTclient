
export const StorageKeys = {
  TOKEN: 'gstautopilot.jwt',
  COMPANY_ID: 'gstautopilot.companyId',
  TENANT_ID: 'gstautopilot.tenantId',
  USER: 'gstautopilot.user',
  THEME: 'theme',
  ACCENT_COLOR: 'accentColor',
  NAVBAR_BG: 'navbarThemeBg',
  SIDEBAR_BG: 'sidebarThemeBg',
  PAGE_BG: 'pageBgOption',
} as const;

export function getStorageItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    
  }
}
