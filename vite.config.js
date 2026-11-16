import { defineConfig } from 'vite';
import { tasarimPlugin } from './scripts/tasarim-plugin.js';

export default defineConfig({
  base: '/',
  plugins: [tasarimPlugin()],
  // iki giriş: / (İngilizce, varsayılan) ve /tr/ (Türkçe). Eski /en/ adresi public/en'den köke yönlenir.
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 1200,
    rollupOptions: { input: { main: 'index.html', tr: 'tr/index.html' } } },
  // Varsayılan: yalnızca bu bilgisayar. Telefondan açmak için: npm run dev:telefon
  server: { port: 5173, watch: { ignored: ['**/tasarim/**'] } },
});
