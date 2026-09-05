import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: ['es2015', 'chrome70', 'edge79', 'firefox68', 'safari12'],
    rollupOptions: {
      input: 'dev.html',
    },
  },
  server: {
    port: 3000,
    host: true,
    open: '/dev.html',
  },
});
