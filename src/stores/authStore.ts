import { create } from 'zustand';
import { User, AuthResponse } from '../types/taiga';
import { loginApi, getMeApi, loginWithInvitationApi, registerWithInvitationApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<AuthResponse>;
  loginWithInvitation: (username: string, password: string, invitationToken: string) => Promise<AuthResponse>;
  registerWithInvitation: (data: {
    token: string;
    fullName: string;
    username: string;
    email: string;
    password: string;
  }) => Promise<AuthResponse>;
  setAuthSession: (res: AuthResponse) => void;
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

  setAuthSession: (res: AuthResponse) => {
    localStorage.setItem('taiga_token', res.auth_token);
    if (res.refresh) localStorage.setItem('taiga_refresh', res.refresh);
    localStorage.setItem('taiga_user', JSON.stringify(res));

    set({
      user: res,
      token: res.auth_token,
      refreshToken: res.refresh || null,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await loginApi(username, password);
      get().setAuthSession(res);
      return res;
    } catch (err: any) {
      const msg = err?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      set({ error: msg, isLoading: false, isAuthenticated: false });
      throw err;
    }
  },

  loginWithInvitation: async (username, password, invitationToken) => {
    set({ isLoading: true, error: null });
    try {
      const res = await loginWithInvitationApi(username, password, invitationToken);
      get().setAuthSession(res);
      return res;
    } catch (err: any) {
      const msg = err?.message || 'Error al aceptar invitación con usuario existente.';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  registerWithInvitation: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await registerWithInvitationApi(data);
      get().setAuthSession(res);
      return res;
    } catch (err: any) {
      const msg = err?.message || 'Error al registrar nuevo usuario con la invitación.';
      set({ error: msg, isLoading: false });
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
