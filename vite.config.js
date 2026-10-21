import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// Yalnızca geliştirme sunucusunda: tarayıcıda çizilen dokuları tasarim/ klasörüne yazar.
// (src/dev/export.js, adres: /?disa-aktar)
function assetExport() {
  return {
    name: 'sapma-asset-export',
    apply: 'serve',
    configureServer(server) {
      const root = path.resolve(server.config.root, 'tasarim');
      server.middlewares.use('/__disa-aktar', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        const rel = new URL(req.url, 'http://x').searchParams.get('yol') || '';
        if (!/^[a-z0-9_\-/]+\.png$/i.test(rel) || rel.includes('..')) { res.statusCode = 400; res.end('gecersiz yol'); return; }
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          const out = path.join(root, rel);
          // Var olan dosyanın (düzenlenmiş olabilir) üzerine yalnızca açıkça istenirse yaz.
          const overwrite = new URL(req.url, 'http://x').searchParams.get('uzerine') === '1';
          if (fs.existsSync(out) && !overwrite) { res.statusCode = 409; res.end('var'); return; }
          try {
            fs.mkdirSync(path.dirname(out), { recursive: true });
            fs.writeFileSync(out, Buffer.concat(chunks));
            res.end('ok');
          } catch (e) {
            // ör. dosya Photoshop'ta açık ve kilitli
            res.statusCode = 423; res.end(String(e.code || e.message));
          }
        });
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [assetExport()],
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 1200 },
  // Varsayılan: yalnızca bu bilgisayar. Telefondan açmak için: npm run dev:telefon
  server: { port: 5173, watch: { ignored: ['**/tasarim/**'] } },
});
