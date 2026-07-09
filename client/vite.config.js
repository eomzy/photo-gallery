import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves this as a project site under /photo-gallery/, so
  // production builds need that base path; local dev keeps serving at "/".
  base: command === 'build' ? '/photo-gallery/' : '/',
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
  },
}));
