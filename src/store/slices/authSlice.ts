import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { setAuthToken, login as apiLogin } from '../../api';
import type { AuthUser, LoginRequest } from '../../types/api';

const USER_STORAGE_KEY = 'gstautopilot.user';

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.emplCode) return null;
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialUser = readStoredUser();

const initialState: AuthState = {
  user: initialUser,
  isAuthenticated: !!initialUser,
  status: 'idle',
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await apiLogin(credentials);
      setAuthToken(response.accessToken);
      const user: AuthUser = {
        emplCode: response.emplCode,
        displayName: response.displayName,
        role: response.role,
        tenantId: response.tenantId,
        expiresAt: response.expiresAt,
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return user;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Login failed');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(action.payload));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
        setAuthToken(null);
      }
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem(USER_STORAGE_KEY);
      setAuthToken(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
