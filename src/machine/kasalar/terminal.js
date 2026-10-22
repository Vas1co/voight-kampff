// 80'ler terminal: geniş bir üst ünite ve önde eğimli klavye tablası. Ana ekran
// solda kalın siyah çerçevenin içinde; sağda üst üste iki küçük okuma ekranı ve
// fonksiyon tuşu bloğu (üç canlı tuş bu bloğun içinde). Bej plastik, antrasit tuşlar.
import { lg, rr } from '../../scene/paint.js';
import { t } from '../../core/strings.js';
import { PAL, TAU, label, screw, slots, box, bezel, keycaps, sockets, weather, polyPath, crtRect, monRect, bellowsRect, intakeOf } from './ortak.js';

const bellows = bellowsRect(1380, 14, 480);
const KS = { w: 92, h: 58 };
const grid = (c, r) => ({ x: 1520 + c * 112, y: 372 + r * 80 });
export const L = {
  crt: crtRect(262, 378, 700),
  left: monRect(1094, 352, 300),
  right: monRect(1094, 640, 300),
  led: { x: 300, y: 846, w: 528, h: 26 },
  bellows,
  intake: intakeOf(bellows),
  keys: [grid(2, 0), grid(2, 1), grid(2, 2)],
  keySize: KS,
  alarm: { x: 170, y: 952, w: 300, h: 28 },
  stressLamp: { x: 220, y: 1060 },
  calLamp: { x: 360, y: 1060 },
  recLamp: { x: 1030, y: 846 },
};

export default {
  name: "80'ler terminal",
  tint: '#fff3dc',
  L,
  key: '#3c3e41',
  paint(x, W, H) {
    const B = PAL.bej, D = PAL.antrasit;

    // klavye tablası
    x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(46, 1246, 1956, 34);
    x.fillStyle = lg(x, 0, 1238, 0, 1276, [[0, B.mid], [1, B.low]]); x.fillRect(48, 1238, 1952, 36);
    x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(48, 1252, 1952, 3);
    x.fillStyle = lg(x, 0, 916, 0, 1238, [[0, B.top], [0.4, B.face], [1, B.mid]]);
    polyPath(x, [[110, 916], [1938, 916], [2000, 1238], [48, 1238]]); x.fill();
    x.strokeStyle = B.edge; x.lineWidth = 2; x.stroke();
    x.fillStyle = B.glint; x.fillRect(112, 918, 1824, 2.5);
    // klavye yuvası
    x.fillStyle = 'rgba(0,0,0,0.25)'; polyPath(x, [[540, 966], [1820, 966], [1852, 1216], [520, 1216]]); x.fill();
    x.fillStyle = lg(x, 0, 966, 0, 1216, [[0, '#bdb196'], [1, '#a99d80']]); polyPath(x, [[548, 972], [1814, 972], [1844, 1210], [528, 1210]]); x.fill();
    const rows = [
      [1.5, ...Array(12).fill(1), 1.5, 1.4],
      [1.8, ...Array(11).fill(1), 2.3, 1.4],
      [2.3, ...Array(10).fill(1), 1.5, 1, 1.4],
      [1.5, 1.2, 7, 1.2, 1, 1, 1, 1.4],
    ];
    const dark = new Set(['0:0', '0:13', '0:14', '1:0', '1:12', '1:13', '2:0', '2:11', '2:12', '2:13', '3:0', '3:1', '3:3', '3:4', '3:5', '3:6', '3:7']);
    keycaps(x, 560, 984, rows, 66, { gap: 8, h: 50, shear: -6, darkKeys: dark, colors: ['#ece6d6', '#c9c1ad'] });
    // tabladaki gösterge alanı
    sockets(x, D, { ...L, led: { x: -99, y: -99, w: 0, h: 0 }, keys: [], recLamp: { x: -99, y: -99 } }, { t });

    // üst ünite
    box(x, B, 140, 300, 1768, 600, { top: 26, radius: 30 });
    // ana ekranın kalın siyah çerçevesi
    x.fillStyle = 'rgba(0,0,0,0.35)'; rr(x, 206, 330, 812, 500, 44); x.fill();
    bezel(x, D, L.crt, { pad: 48, radius: 44, colors: ['#3a3c3f', '#202224'] });
    x.fillStyle = D.socket; rr(x, L.led.x - 12, L.led.y - 9, L.led.w + 24, L.led.h + 18, 6); x.fill();
    x.fillStyle = D.socket; x.beginPath(); x.arc(L.recLamp.x, L.recLamp.y, 12, 0, TAU); x.fill();
    x.fillStyle = '#0d0e0e'; x.beginPath(); x.arc(1030, 360, 10, 0, TAU); x.fill();
    // küçük ekranlar
    bezel(x, D, L.left, { pad: 18, radius: 12 });
    bezel(x, D, L.right, { pad: 18, radius: 12 });
    label(x, B, t('machine.panelLeft'), L.left.x, L.left.y + L.left.h + 28, { size: 12 });
    label(x, B, t('machine.panelRight'), L.right.x, L.right.y + L.right.h + 28, { size: 12 });
    // fonksiyon tuşu bloğu (çukur panel)
    x.fillStyle = lg(x, 0, 340, 0, 870, [[0, B.mid], [1, B.face]]); rr(x, 1484, 340, 386, 520, 22); x.fill();
    x.strokeStyle = 'rgba(70,60,40,0.4)'; x.lineWidth = 3; rr(x, 1484, 340, 386, 520, 22); x.stroke();
    x.fillStyle = 'rgba(0,0,0,0.12)'; rr(x, 1490, 346, 374, 16, 8); x.fill();
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) {
      const g = grid(c, r);
      if (c === 2 && r < 3) continue; // canlı tuşlar
      x.fillStyle = 'rgba(0,0,0,0.45)'; rr(x, g.x + 2, g.y + 4, KS.w, KS.h, 6); x.fill();
      x.fillStyle = lg(x, 0, g.y, 0, g.y + KS.h, [[0, '#4a4c4f'], [1, '#2c2d30']]); rr(x, g.x, g.y, KS.w, KS.h, 6); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.08)'; rr(x, g.x + 6, g.y + 4, KS.w - 12, 30, 4); x.fill();
      label(x, { ink: 'rgba(225,220,205,0.7)', inkHi: 'rgba(0,0,0,0)' }, `F${r * 3 + c + 1}`, g.x + KS.w / 2, g.y + 22, { size: 14, align: 'center', spacing: 0.05 });
    }
    for (const k of L.keys) { x.fillStyle = D.socket; rr(x, k.x - 5, k.y - 5, KS.w + 10, KS.h + 10, 8); x.fill(); }
    // yan havalandırma, vidalar, yazı
    slots(x, B, 1062, 350, 16, 520, 18, false);
    label(x, B, `${t('brand.machine')}  ${t('brand.model')}`, 262, 884, { size: 14, spacing: 0.3 });
    for (const [sx, sy] of [[166, 326], [1882, 326], [166, 874], [1882, 874]]) screw(x, B, sx, sy, 6);
    // ünite ile tabla arasındaki derz
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(150, 900, 1748, 6);

    weather(x, W, H, B, { from: 280, amount: 1.1 });
  },
};
