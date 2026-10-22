// Makine gövdesi: kasa kaydı. Her kasa (kasalar/*.js) kendi biçimini, rengini ve
// canlı parçaların yerleşimini (L) taşır; ekranlar, LED çubuğu, körük, tuşlar ve
// lambalar bu yerleşime göre gövdenin üstüne oturur.
//
// Oyundaki kasa tek yerden seçilir: VARSAYILAN. Geliştirirken adres çubuğunda ?kasa=<ad>.
//   mevcut    üç modül yan yana, körük ortada, kayıt kamerası kolda
//   y1982     üst üste masaüstü istasyon: siperlikli monitör, gövde, klavye tablası
//   y2017     yekpare monolit: tek siyah cam şeritte asimetrik ekranlar
//   siber     tek parça pahlı çerçeve, tutamak rayları, düğme sırası, açılı ayaklar
//   terminal  80'ler terminal: solda ana ekran, sağda küçük ekranlar ve tuş bloğu, önde klavye
//   saha      açık sert çanta: ekranlar kapakta, kontroller ve körük tepside
import { mk, rr } from '../scene/paint.js';
import { BODY } from './layout.js';
import mevcut from './kasalar/mevcut.js';
import y1982 from './kasalar/y1982.js';
import y2017 from './kasalar/y2017.js';
import siber from './kasalar/siber.js';
import terminal from './kasalar/terminal.js';
import saha from './kasalar/saha.js';

export const KASALAR = { mevcut, y1982, y2017, siber, terminal, saha };
const VARSAYILAN = 'mevcut';

const fromUrl = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('kasa') : null;
export const KASA_NAME = KASALAR[fromUrl] ? fromUrl : VARSAYILAN;
export const KASA = KASALAR[KASA_NAME];

export function paintBody(name = KASA_NAME) {
  const k = KASALAR[name] ?? KASA;
  const c = mk(BODY.W, BODY.H), x = c.getContext('2d');
  k.paint(x, BODY.W, BODY.H);
  return c;
}

// Ön paneldeki tuşlar (biri amber yanar).
export function paintKey(lit, name = KASA_NAME) {
  const c = mk(64, 64), x = c.getContext('2d');
  x.fillStyle = lit ? '#ffd08e' : (KASALAR[name] ?? KASA).key;
  rr(x, 2, 2, 60, 60, 8); x.fill();
  x.fillStyle = 'rgba(40,40,36,0.35)';
  x.fillRect(2, 48, 60, 14);
  x.fillStyle = 'rgba(255,255,255,0.5)';
  x.fillRect(5, 5, 54, 4);
  return c;
}
