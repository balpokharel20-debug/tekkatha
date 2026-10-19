import { defineConfig } from 'vite';
const backend = { target: 'http://127.0.0.1:4000', changeOrigin: true };
export default defineConfig({
  server: { proxy: {
    '/api': backend,
    '/robots.txt': backend,
    '/sitemap.xsl': backend,
    '/sitemap.xml': backend,
    '/sitemap_index.xml': backend,
    '/page-sitemap.xml': backend,
    '/post-sitemap.xml': backend,
    '/product-sitemap.xml': backend,
  } },
  build: { outDir: 'dist', emptyOutDir: true },
});
