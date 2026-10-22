// 2017: yekpare monolit. Kum/beton renginde tek bir alçak blok; bütün ekranlar
// tek bir siyah cam şeridin içinde, asimetrik: solda geniş CRT, sağda iki küçük
// okuma ekranı. Blok gömme bir kaidenin üstünde süzülür gibi durur; körük bloğun
// sağ üstünden yükselir. Neredeyse hiç vida, yazı ya da süs yok.
import { lg, rr, seeded } from '../../scene/paint.js';
import { t } from '../../core/strings.js';
import { PAL, TAU, label, box, sockets, weather, crtRect, monRect, bellowsRect, intakeOf } from './ortak.js';

const bellows = bellowsRect(1330, 116, 560);
export const L = {
  crt: crtRect(196, 546, 720),
  left: monRect(1012, 566, 380),
  right: monRect(1452, 566, 380),
  led: { x: 196, y: 1046, w: 720, h: 24 },
  bellows,
  intake: intakeOf(bellows),
  keys: [{ x: 1700, y: 1036 }, { x: 1764, y: 1036 }, { x: 1828, y: 1036 }],
  keySize: { w: 50, h: 46 },
  alarm: { x: 1040, y: 1046, w: 300, h: 26 },
  stressLamp: { x: 1430, y: 1059 },
  calLamp: { x: 1530, y: 1059 },
  recLamp: { x: 1882, y: 526 },
};

export default {
  name: '2017 · monolit',
  tint: '#fbf5ec',
  L,
  key: PAL.kum.key,
  paint(x, W, H) {
    const K = PAL.kum, G = PAL.siyah;

    // gömme kaide (koyu, içeride)
    x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(150, 1176, 1748, 104);
    x.fillStyle = lg(x, 0, 1170, 0, 1280, [[0, '#0d0d0c'], [1, '#1a1918']]); x.fillRect(170, 1170, 1708, 110);

    // blok: keskin kenarlı, üstte ince açık kapak bandı
    box(x, K, 70, 430, 1908, 740, { top: 34, radius: 4, glint: false });
    x.fillStyle = 'rgba(255,250,240,0.16)'; x.fillRect(70, 430, 1908, 16);
    x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(70, 446, 1908, 2);
    // beton lekelenmesi
    const R = seeded(2017);
    x.save(); x.beginPath(); x.rect(70, 430, 1908, 740); x.clip();
    for (let i = 0; i < 520; i++) {
      const px = 70 + R() * 1908, py = 430 + R() * 740, r = 2 + R() * 30;
      x.fillStyle = `rgba(${R() < 0.55 ? '60,52,40' : '255,250,240'},${0.02 + R() * 0.04})`;
      x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
    }
    // kalıp derzleri
    x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(980, 1010, 2, 160); x.fillRect(70, 1010, 1908, 2);
    x.restore();

    // siyah cam şerit
    x.fillStyle = 'rgba(0,0,0,0.5)'; rr(x, 126, 500, 1798, 500, 8); x.fill();
    x.fillStyle = lg(x, 0, 500, 0, 1000, [[0, '#0d0e0e'], [1, '#050606']]); rr(x, 130, 504, 1790, 492, 6); x.fill();
    // camdaki yansıma çizgisi
    x.fillStyle = lg(x, 130, 504, 1920, 996, [[0, 'rgba(255,240,220,0)'], [0.48, 'rgba(255,240,220,0.05)'], [0.52, 'rgba(255,240,220,0.01)'], [1, 'rgba(255,240,220,0)']]);
    rr(x, 130, 504, 1790, 492, 6); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(136, 506, 1778, 1.5);
    for (const r of [L.crt, L.left, L.right]) { x.fillStyle = '#020303'; rr(x, r.x - 6, r.y - 6, r.w + 12, r.h + 12, 3); x.fill(); }
    label(x, { ink: 'rgba(214,150,64,0.55)', inkHi: 'rgba(0,0,0,0)' }, t('machine.panelLeft'), L.left.x, 974, { size: 13, weight: 400, spacing: 0.3 });
    label(x, { ink: 'rgba(214,150,64,0.55)', inkHi: 'rgba(0,0,0,0)' }, t('machine.panelRight'), L.right.x, 974, { size: 13, weight: 400, spacing: 0.3 });

    // tek ince amber çizgi
    x.fillStyle = 'rgba(214,150,64,0.8)'; x.fillRect(130, 1006, 1790, 3);
    // canlı parçaların yuvaları (alt bant)
    sockets(x, G, L, { t, labels: false });
    label(x, K, t('machine.anomaly'), L.alarm.x - 4, 1096, { size: 12, weight: 400, spacing: 0.3 });
    label(x, K, 'N° 6-1104-0417', 1918, 1140, { size: 12, align: 'right', spacing: 0.3, weight: 400 });
    label(x, K, `${t('brand.machine')}  ${t('brand.model')}`, 196, 1120, { size: 14, weight: 400, spacing: 0.4 });

    weather(x, W, H, K, { from: 400, amount: 0.5 });
  },
};
