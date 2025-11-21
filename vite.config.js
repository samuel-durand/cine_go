import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Permet de traiter les fichiers .js comme du JSX
      include: '**/*.{jsx,js}',
    }),
  ],
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: '0.0.0.0',
    allowedHosts: [
      'cinego-front.up.railway.app',
      '.railway.app',
      'localhost'
    ],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: process.env.PORT ? parseInt(process.env.PORT) : undefined,
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: [
      'cinego-front.up.railway.app',
      '.railway.app',
      'localhost'
    ],
  },
  build: {
    outDir: 'build',
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});

