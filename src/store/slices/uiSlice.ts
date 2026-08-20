import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ToastItem {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

export interface UiState {
  period: string;
  searchQuery: string;
  isSidebarCollapsed: boolean;
  toasts: ToastItem[];
}

const STORAGE_KEY_PERIOD = 'gstautopilot.period';
const initialPeriod = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_PERIOD) || '' : '';

const initialState: UiState = {
  period: initialPeriod,
  searchQuery: '',
  isSidebarCollapsed: false,
  toasts: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setGlobalPeriod(state, action: PayloadAction<string>) {
      state.period = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem(STORAGE_KEY_PERIOD, action.payload);
        } else {
          localStorage.removeItem(STORAGE_KEY_PERIOD);
        }
      }
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    toggleSidebar(state) {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },
    addToast(state, action: PayloadAction<Omit<ToastItem, 'id'>>) {
      const id = Date.now() + Math.random();
      state.toasts.push({ id, ...action.payload });
    },
    removeToast(state, action: PayloadAction<number>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts(state) {
      state.toasts = [];
    },
  },
});

export const {
  setGlobalPeriod,
  setSearchQuery,
  toggleSidebar,
  addToast,
  removeToast,
  clearToasts,
} = uiSlice.actions;

export default uiSlice.reducer;
