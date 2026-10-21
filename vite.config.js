import { defineConfig } from 'vite';
import { tasarimPlugin } from './scripts/tasarim-plugin.js';

export default defineConfig({
  base: './',
  plugins: [tasarimPlugin()],
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 1200 },
  // Varsayılan: yalnızca bu bilgisayar. Telefondan açmak için: npm run dev:telefon
  server: { port: 5173, watch: { ignored: ['**/tasarim/**'] } },
});
