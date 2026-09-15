import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyBrandTheme } from '../utils/colors';
import { getEnv } from '../utils/env';

export interface ColorPreset {
  id: string;
  name: string;
  primary: string;
}

export const PRESET_PALETTES: ColorPreset[] = [
  { id: 'alternative-violet', name: 'Alternative Violet', primary: '#7c3aed' },
  { id: 'taiga-teal', name: 'Taiga Teal', primary: '#008a90' },
  { id: 'emerald', name: 'Emerald Peak', primary: '#059669' },
  { id: 'ocean-blue', name: 'Oceanic Blue', primary: '#2563eb' },
  { id: 'cyber-rose', name: 'Cyber Rose', primary: '#e11d48' },
  { id: 'amber-sunset', name: 'Amber Sunset', primary: '#ea580c' },
  { id: 'slate-pro', name: 'Slate Executive', primary: '#475569' },
];

interface ThemeState {
  mode: 'dark' | 'light' | 'system';
  primaryColor: string;
  activePreset: string;
  companyName: string;
  companyLogo: string | null;
  appTitle: string;
  setMode: (mode: 'dark' | 'light' | 'system') => void;
  setPrimaryColor: (color: string, presetId?: string) => void;
  setWhiteLabel: (config: { companyName?: string; companyLogo?: string | null; appTitle?: string }) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      primaryColor: '#059669',
      activePreset: 'emerald',
      companyName: getEnv('VITE_DEFAULT_COMPANY_NAME', ''),
      companyLogo: null,
      appTitle: getEnv('VITE_DEFAULT_APP_TITLE', 'planning'),

      setMode: (mode) => {
        set({ mode });
        const root = document.documentElement;
        if (mode === 'dark') {
          root.classList.add('dark');
        } else if (mode === 'light') {
          root.classList.remove('dark');
        } else {
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (systemDark) root.classList.add('dark');
          else root.classList.remove('dark');
        }
      },

      setPrimaryColor: (color, presetId = 'custom') => {
        set({ primaryColor: color, activePreset: presetId });
        applyBrandTheme(color);
      },

      setWhiteLabel: (config) => {
        set((state) => ({
          ...state,
          companyName: config.companyName !== undefined ? config.companyName : state.companyName,
          companyLogo: config.companyLogo !== undefined ? config.companyLogo : state.companyLogo,
          appTitle: config.appTitle !== undefined ? config.appTitle : state.appTitle,
        }));
        if (config.appTitle) {
          document.title = config.appTitle;
        }
      },

      initTheme: () => {
        const { mode, primaryColor, appTitle } = get();
        // Set mode
        const root = document.documentElement;
        if (mode === 'dark') {
          root.classList.add('dark');
        } else if (mode === 'light') {
          root.classList.remove('dark');
        } else {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
        // Set color palette
        applyBrandTheme(primaryColor);
        if (appTitle) {
          document.title = appTitle;
        }
      },
    }),
    {
      name: 'taiga-planning-theme-v2',
    }
  )
);
