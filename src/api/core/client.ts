import axios from 'axios';
import { store } from '../../store';
import { logout } from '../../store/slices/authSlice';

const DEFAULT_TENANT_ID = import.meta.env.VITE_DEFAULT_TENANT_ID as string;
const TOKEN_STORAGE_KEY = 'gstautopilot.jwt';

const COMPANY_STORAGE_KEY = 'gstautopilot.companyId';

const TENANT_STORAGE_KEY = 'gstautopilot.tenantId';

export function getActiveTenantId(): string {
  return localStorage.getItem(TENANT_STORAGE_KEY) || DEFAULT_TENANT_ID;
}

export function setActiveTenantId(tenantId: string | null) {
  if (tenantId === null || tenantId === DEFAULT_TENANT_ID) {
    localStorage.removeItem(TENANT_STORAGE_KEY);
  } else {
    localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
  }

  localStorage.removeItem(COMPANY_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('gstautopilot:tenant-changed'));
}

export function getActiveCompanyId(): number | null {
  const v = localStorage.getItem(COMPANY_STORAGE_KEY);
  if (!v || v === 'all') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function setActiveCompanyId(coId: number | null) {
  if (coId === null) {
    localStorage.removeItem(COMPANY_STORAGE_KEY);
  } else {
    localStorage.setItem(COMPANY_STORAGE_KEY, String(coId));
  }

  window.dispatchEvent(new CustomEvent('gstautopilot:company-changed'));
}

if (!DEFAULT_TENANT_ID) {
  console.warn('[GSTAutoPilot] VITE_DEFAULT_TENANT_ID is not set — backend will reject requests with 404.');
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

export const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : (API_BASE_URL ? `${API_BASE_URL.replace(/\/+$/, '')}/api` : '/api'),
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const tenantId = getActiveTenantId();
  if (tenantId) {
    config.headers.set('X-Tenant-Id', tenantId);
  }
  const jwt = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (jwt) {
    config.headers.set('Authorization', `Bearer ${jwt}`);
  }
  const coId = getActiveCompanyId();
  if (coId !== null) {
    config.headers.set('X-Company-Id', String(coId));
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = (error?.config?.url ?? '') as string;

    if ((status === 401 || status === 403) && !url.includes('/auth/login')) {
      store.dispatch(logout());
      window.dispatchEvent(new CustomEvent('gstautopilot:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}
