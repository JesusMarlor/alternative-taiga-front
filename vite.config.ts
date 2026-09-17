import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.TAIGA_URL || env.VITE_TAIGA_BACKEND_URL || 'http://localhost:8000';

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'TAIGA_'],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
})
