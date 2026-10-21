// Vite geliştirme eklentisi: tasarim/ klasörü ile oyunun assets/ klasörü arasındaki köprü.
//
// 1) Dışa aktarma: tarayıcıda çizilen dokular POST /__disa-aktar ile tasarim/ altına yazılır
//    (src/dev/export.js, adres: /?disa-aktar). Var olan dosyaların üzerine yalnızca
//    &uzerine ile yazılır.
// 2) Canlı uygulama: tasarim/ içinde düzenlenip kaydedilen PNG, oyunun okuduğu klasöre
//    otomatik kopyalanır (oda/ → assets/images/room/, goz/ → assets/images/eye/).
//    Dışa aktarmanın yazdığı, hiç dokunulmamış dosyalar kopyalanmaz; böylece yalnızca
//    senin değiştirdiğin dosyalar oyundaki çizimin yerine geçer.
import fs from 'node:fs';
import path from 'node:path';

const MAP = { oda: 'assets/images/room', goz: 'assets/images/eye' };
// Karşılaştırma sürümleri oyuna kopyalanmaz (oyun yalnızca machine.png'yi okur).
const SKIP = /^oda\/machine-(?!key)/;

export function tasarimPlugin() {
  let root, dir, stampFile, stamp = {};
  const timers = new Map();

  const loadStamp = () => { try { stamp = JSON.parse(fs.readFileSync(stampFile, 'utf8')); } catch { stamp = {}; } };
  const saveStamp = () => { try { fs.writeFileSync(stampFile, JSON.stringify(stamp, null, 1)); } catch { /* yoksay */ } };
  const rel = (abs) => path.relative(dir, abs).split(path.sep).join('/');

  // Düzenlenmiş bir dosyayı oyunun klasörüne kopyala.
  function apply(relPath, log) {
    if (!/\.png$/i.test(relPath) || SKIP.test(relPath)) return;
    loadStamp(); // her seferinde diskten oku (başka bir sunucu da yazmış olabilir)
    const [sub, ...rest] = relPath.split('/');
    if (!MAP[sub] || rest.length !== 1) return;
    const src = path.join(dir, relPath);
    let st;
    try { st = fs.statSync(src); } catch { return; }
    // dışa aktarmanın yazdığı haliyle duruyorsa (dokunulmamış) atla
    if (stamp[relPath] && Math.abs(stamp[relPath] - st.mtimeMs) < 2) return;
    const dst = path.join(root, MAP[sub], rest[0]);
    try {
      const dstSt = fs.existsSync(dst) ? fs.statSync(dst) : null;
      if (dstSt && dstSt.mtimeMs >= st.mtimeMs && dstSt.size === st.size) return;
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      log?.(`[tasarim] ${relPath} → ${MAP[sub]}/${rest[0]}`);
    } catch (e) {
      log?.(`[tasarim] ${relPath} kopyalanamadı (${e.code || e.message}); dosya açık olabilir, kaydedince tekrar denenir.`);
    }
  }

  return {
    name: 'sapma-tasarim',
    apply: 'serve',
    configureServer(server) {
      root = server.config.root;
      dir = path.resolve(root, 'tasarim');
      stampFile = path.join(dir, '.aktarim.json');
      fs.mkdirSync(dir, { recursive: true });
      loadStamp();
      const log = (m) => server.config.logger.info(m, { timestamp: true });

      // açılışta: sunucu kapalıyken düzenlenmiş dosyaları uygula
      for (const sub of Object.keys(MAP)) {
        const d = path.join(dir, sub);
        if (!fs.existsSync(d)) continue;
        for (const f of fs.readdirSync(d)) apply(`${sub}/${f}`, log);
      }

      // kaydedildikçe uygula (Photoshop önce geçici dosya yazar; kısa bekleme ile birleştirilir)
      try {
        const w = fs.watch(dir, { recursive: true }, (_e, name) => {
          if (!name) return;
          const r = String(name).split(path.sep).join('/');
          clearTimeout(timers.get(r));
          timers.set(r, setTimeout(() => { timers.delete(r); apply(r, log); }, 700));
        });
        server.httpServer?.on('close', () => w.close());
      } catch (e) {
        log(`[tasarim] klasör izlenemiyor: ${e.message}`);
      }

      // dışa aktarma ucu
      server.middlewares.use('/__disa-aktar', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        const q = new URL(req.url, 'http://x').searchParams;
        const r = q.get('yol') || '';
        if (!/^[a-z0-9_\-/]+\.png$/i.test(r) || r.includes('..')) { res.statusCode = 400; res.end('gecersiz yol'); return; }
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          const out = path.join(dir, r);
          if (fs.existsSync(out) && q.get('uzerine') !== '1') { res.statusCode = 409; res.end('var'); return; }
          try {
            fs.mkdirSync(path.dirname(out), { recursive: true });
            fs.writeFileSync(out, Buffer.concat(chunks));
            stamp[r] = fs.statSync(out).mtimeMs;
            saveStamp();
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
