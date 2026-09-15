import { create } from 'zustand';
import { User, AuthResponse } from '../types/taiga';
import { loginApi, getMeApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try {
      const saved = localStorage.getItem('taiga_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('taiga_token'),
  refreshToken: localStorage.getItem('taiga_refresh'),
  isAuthenticated: !!localStorage.getItem('taiga_token'),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await loginApi(username, password);
      localStorage.setItem('taiga_token', res.auth_token);
      localStorage.setItem('taiga_refresh', res.refresh);
      localStorage.setItem('taiga_user', JSON.stringify(res));

      set({
        user: res,
        token: res.auth_token,
        refreshToken: res.refresh,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return res;
    } catch (err: any) {
      const msg = err?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      set({ error: msg, isLoading: false, isAuthenticated: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('taiga_token');
    localStorage.removeItem('taiga_refresh');
    localStorage.removeItem('taiga_user');
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('taiga_token');
    if (!token) {
      get().logout();
      return;
    }
    try {
      const me = await getMeApi();
      localStorage.setItem('taiga_user', JSON.stringify(me));
      set({ user: me, isAuthenticated: true });
    } catch (err) {
      console.warn('Session expired or invalid token');
      get().logout();
    }
  },

  clearError: () => set({ error: null }),
}));
