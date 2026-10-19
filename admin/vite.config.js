import { defineConfig } from 'vite';
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  server: { proxy: { '/api': { target: 'http://127.0.0.1:4000', changeOrigin: true } } },
  build: { outDir: 'dist', emptyOutDir: true },
});
