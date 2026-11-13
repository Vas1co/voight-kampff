import { defineConfig } from 'vite';
import { tasarimPlugin } from './scripts/tasarim-plugin.js';

export default defineConfig({
  base: '/',
  plugins: [tasarimPlugin()],
  // iki giriş: / (tarayıcı diline göre) ve /en/ (her zaman İngilizce, İngilizce arama sonuçları için)
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 1200,
    rollupOptions: { input: { main: 'index.html', en: 'en/index.html' } } },
  // Varsayılan: yalnızca bu bilgisayar. Telefondan açmak için: npm run dev:telefon
  server: { port: 5173, watch: { ignored: ['**/tasarim/**'] } },
});
