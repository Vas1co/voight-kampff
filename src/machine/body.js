// Makine gövdesi (prosedürel yer tutucu). Üç modül, çerçeveli tüp ekranlar,
// havalandırma yarıkları, kalıp çizgileri, metal sensör kolu. Dinamik parçalar
// (ekranlar, LED'ler, körük, tuşlar) ayrı katmanlar olarak bunun üstüne oturur;
// her kasa aynı düzeni (layout.js) kullanır, yalnızca dış görünüş değişir.
//
// Kasa tek yerden seçilir: KASA = '<ad>' (geliştirirken adres çubuğunda ?kasa=<ad>)
//   mevcut    orta modül orta gri, yan monitörler ve taban siyah
//   y1982     koyu bakalit ve dökme metal, pirinç vida ve şeritler, etiket bantları, yıpranmış
//   y2017     yekpare kum rengi gövde, keskin kenarlar, neredeyse hiç ayrıntı yok, ince amber çizgi
//   siber     mat siyah, pahlı köşeler, sarı uyarı şeritleri, şablon numaralar
//   terminal  80'ler bej terminal: ekran siperlikleri, antrasit taban bandı, disket yuvası
//   saha      zeytin yeşili saha cihazı: raf kulakları, tutamaklar, mandallar, kauçuk köşeler
//   krem      90'lar krem plastik (eski şema)
import { mk, rr, lg, rg, grain, seeded } from '../scene/paint.js';
import { BODY, L } from './layout.js';
import { t } from '../core/strings.js';

const TAU = Math.PI * 2;

const PALETTES = {
  krem: {
    hi: '#efe7d2', top: '#e4dbc2', face: '#d6cbaf', mid: '#c7bb9c', low: '#a99d7f',
    side: ['rgba(80,70,48,0.28)', 'rgba(60,52,36,0.4)'], edge: 'rgba(70,60,40,0.6)', glint: 'rgba(255,252,240,0.7)',
    slot: '#3a352a', slotHi: 'rgba(255,250,235,0.5)', ink: 'rgba(70,62,44,0.78)', inkHi: 'rgba(255,250,235,0.45)',
    bezel: ['#ded4ba', '#bfb393'], bezelShade: '40,36,26', recess: '#2b2b26', socket: '#211f1a',
    screw: ['#f2ead6', '#b7ab8d', '#6f6550'], dirt: ['120,95,40', '60,55,40'], key: '#e3dac2',
  },
  gri: {
    hi: '#d3d5d3', top: '#c4c6c4', face: '#aeb1af', mid: '#9ea19f', low: '#848886',
    side: ['rgba(30,34,34,0.28)', 'rgba(20,24,24,0.42)'], edge: 'rgba(30,34,34,0.65)', glint: 'rgba(255,255,255,0.65)',
    slot: '#262929', slotHi: 'rgba(255,255,255,0.4)', ink: 'rgba(28,32,32,0.82)', inkHi: 'rgba(255,255,255,0.35)',
    bezel: ['#b9bcba', '#949896'], bezelShade: '20,24,24', recess: '#222525', socket: '#1b1d1d',
    screw: ['#eef0ee', '#a7aba9', '#5e6260'], dirt: ['60,62,58', '40,44,44'], key: '#d9dcd8',
  },
  siyah: {
    hi: '#46494a', top: '#35383a', face: '#232627', mid: '#1c1e1f', low: '#141516',
    side: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.45)'], edge: 'rgba(0,0,0,0.85)', glint: 'rgba(255,255,255,0.2)',
    slot: '#050606', slotHi: 'rgba(255,255,255,0.1)', ink: 'rgba(205,210,206,0.6)', inkHi: 'rgba(0,0,0,0.7)',
    bezel: ['#2c2f30', '#17191a'], bezelShade: '0,0,0', recess: '#0c0d0d', socket: '#080909',
    screw: ['#8a8e8c', '#4a4e4d', '#202222'], dirt: ['70,72,70', '0,0,0'], key: '#c9ccc8',
  },
  // 1982: sıcak koyu bakalit ve dökme metal, pirinç vidalar
  bakalit: {
    hi: '#5c544a', top: '#4b443c', face: '#3b352f', mid: '#312c27', low: '#221e1b',
    side: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)'], edge: 'rgba(0,0,0,0.85)', glint: 'rgba(255,225,180,0.24)',
    slot: '#0c0a08', slotHi: 'rgba(255,220,170,0.12)', ink: 'rgba(226,204,164,0.62)', inkHi: 'rgba(0,0,0,0.65)',
    bezel: ['#2f2a25', '#181512'], bezelShade: '0,0,0', recess: '#0d0b09', socket: '#090807',
    screw: ['#e3c487', '#93733f', '#3b2b14'], dirt: ['130,95,40', '0,0,0'], key: '#cfc09f',
  },
  demir: {
    hi: '#5d6466', top: '#4b5154', face: '#373c3f', mid: '#2e3235', low: '#1f2325',
    side: ['rgba(0,0,0,0.28)', 'rgba(0,0,0,0.48)'], edge: 'rgba(0,0,0,0.85)', glint: 'rgba(220,235,240,0.26)',
    slot: '#0b0d0e', slotHi: 'rgba(220,235,240,0.12)', ink: 'rgba(216,222,214,0.55)', inkHi: 'rgba(0,0,0,0.65)',
    bezel: ['#33383b', '#1a1d1f'], bezelShade: '0,0,0', recess: '#0c0e0f', socket: '#08090a',
    screw: ['#e3c487', '#93733f', '#3b2b14'], dirt: ['110,90,50', '0,0,0'], key: '#cfc09f',
  },
  // 2017: kum / beton rengi yekpare gövde ve grafit
  kum: {
    hi: '#d2cbbe', top: '#c4bcae', face: '#b3ab9c', mid: '#a79f90', low: '#90897a',
    side: ['rgba(40,34,26,0.22)', 'rgba(30,26,20,0.36)'], edge: 'rgba(40,34,26,0.5)', glint: 'rgba(255,250,240,0.42)',
    slot: '#26231e', slotHi: 'rgba(255,250,240,0.3)', ink: 'rgba(48,42,34,0.62)', inkHi: 'rgba(255,250,240,0.25)',
    bezel: ['#aba395', '#999183'], bezelShade: '30,26,20', recess: '#1a1916', socket: '#191815',
    screw: ['#c9c1b2', '#a69e8f', '#7c7568'], dirt: ['80,68,50', '40,36,30'], key: '#dcd5c7',
  },
  grafit: {
    hi: '#3c3b38', top: '#302f2c', face: '#252422', mid: '#1f1e1c', low: '#171615',
    side: ['rgba(0,0,0,0.26)', 'rgba(0,0,0,0.42)'], edge: 'rgba(0,0,0,0.8)', glint: 'rgba(255,240,220,0.14)',
    slot: '#080807', slotHi: 'rgba(255,240,220,0.08)', ink: 'rgba(214,204,188,0.48)', inkHi: 'rgba(0,0,0,0.6)',
    bezel: ['#2a2927', '#1a1918'], bezelShade: '0,0,0', recess: '#0c0c0b', socket: '#0a0a09',
    screw: ['#3c3b38', '#2a2927', '#151514'], dirt: ['60,52,40', '0,0,0'], key: '#d8d1c3',
  },
  // siber: mat siyah, sarı vurgular
  gece: {
    hi: '#33363a', top: '#26292c', face: '#17191b', mid: '#121416', low: '#0b0c0d',
    side: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)'], edge: 'rgba(0,0,0,0.9)', glint: 'rgba(255,235,120,0.16)',
    slot: '#040505', slotHi: 'rgba(255,240,150,0.1)', ink: 'rgba(236,214,48,0.85)', inkHi: 'rgba(0,0,0,0.8)',
    bezel: ['#202326', '#0e0f11'], bezelShade: '0,0,0', recess: '#08090a', socket: '#060707',
    screw: ['#8e9296', '#4a4e52', '#1c1e20'], dirt: ['80,80,70', '0,0,0'], key: '#e2d24a',
  },
  // 80'ler terminal: bej plastik, antrasit
  bej: {
    hi: '#ede5d0', top: '#e1d7be', face: '#d3c7a9', mid: '#c6b999', low: '#ab9d7e',
    side: ['rgba(80,70,48,0.26)', 'rgba(60,52,36,0.42)'], edge: 'rgba(70,60,40,0.6)', glint: 'rgba(255,252,240,0.72)',
    slot: '#2f2c26', slotHi: 'rgba(255,250,235,0.5)', ink: 'rgba(60,54,40,0.8)', inkHi: 'rgba(255,250,235,0.45)',
    bezel: ['#3e4042', '#25272a'], bezelShade: '0,0,0', recess: '#151617', socket: '#232220',
    screw: ['#f2ead6', '#b7ab8d', '#6f6550'], dirt: ['120,95,40', '60,55,40'], key: '#e6ddc6',
  },
  antrasit: {
    hi: '#4a4c4e', top: '#3b3d3f', face: '#2e3032', mid: '#26282a', low: '#1b1c1e',
    side: ['rgba(0,0,0,0.26)', 'rgba(0,0,0,0.44)'], edge: 'rgba(0,0,0,0.8)', glint: 'rgba(255,255,255,0.2)',
    slot: '#0b0c0c', slotHi: 'rgba(255,255,255,0.1)', ink: 'rgba(225,220,205,0.6)', inkHi: 'rgba(0,0,0,0.6)',
    bezel: ['#2c2e30', '#18191a'], bezelShade: '0,0,0', recess: '#0c0d0d', socket: '#0a0a0a',
    screw: ['#c9cbcc', '#7c7f80', '#353738'], dirt: ['70,70,64', '0,0,0'], key: '#e6ddc6',
  },
  // saha: zeytin yeşili boyalı sac
  zeytin: {
    hi: '#6e7552', top: '#5e6445', face: '#4c5238', mid: '#434830', low: '#323624',
    side: ['rgba(0,0,0,0.26)', 'rgba(0,0,0,0.44)'], edge: 'rgba(10,12,6,0.8)', glint: 'rgba(235,240,205,0.26)',
    slot: '#14160e', slotHi: 'rgba(235,240,205,0.14)', ink: 'rgba(232,228,206,0.74)', inkHi: 'rgba(0,0,0,0.5)',
    bezel: ['#3b402b', '#262a1b'], bezelShade: '0,0,0', recess: '#0e0f0a', socket: '#0b0c08',
    screw: ['#b9bca8', '#6f725f', '#2c2e24'], dirt: ['110,90,50', '20,22,14'], key: '#cfccb4',
  },
};

// casing: round | sharp | chamfer   bezel: tube | hood | flat | chamfer
export const KASALAR = {
  mevcut: { name: 'Mevcut', pal: { center: 'gri', sides: 'siyah', base: 'siyah', arm: 'gri' }, tint: '#f2f4f3', casing: 'round', radius: 22, bezel: 'tube' },
  y1982: { name: '1982', pal: { center: 'bakalit', sides: 'demir', base: 'bakalit', arm: 'demir' }, tint: '#fff2e0', casing: 'round', radius: 12, bezel: 'hood', grime: 1.8, decor: decor1982 },
  y2017: { name: '2017', pal: { center: 'kum', sides: 'grafit', base: 'grafit', arm: 'grafit' }, tint: '#fbf5ec', casing: 'sharp', radius: 3, bezel: 'flat', screws: false, grime: 0.5, decor: decor2017 },
  siber: { name: 'Siber', pal: { center: 'gece', sides: 'gece', base: 'gece', arm: 'gece' }, tint: '#f4f4f0', casing: 'chamfer', radius: 34, bezel: 'chamfer', accent: '#e8cf1c', decor: decorSiber },
  terminal: { name: "80'ler terminal", pal: { center: 'bej', sides: 'bej', base: 'antrasit', arm: 'antrasit' }, tint: '#fff3dc', casing: 'round', radius: 30, bezel: 'hood', decor: decorTerminal },
  saha: { name: 'Saha', pal: { center: 'zeytin', sides: 'zeytin', base: 'siyah', arm: 'zeytin' }, tint: '#f6f6ee', casing: 'round', radius: 10, bezel: 'tube', grime: 1.4, decor: decorSaha },
  krem: { name: 'Krem', pal: { center: 'krem', sides: 'krem', base: 'krem', arm: 'krem' }, tint: '#fff0d6', casing: 'round', radius: 22, bezel: 'tube' },
};

// Oyunda kullanılan kasa.
const fromUrl = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('kasa') : null;
export const KASA_NAME = KASALAR[fromUrl] ? fromUrl : 'mevcut';
export const KASA = KASALAR[KASA_NAME];
// eski adlar (dışa aktarma ve malzeme rengi için)
export const SCHEMES = KASALAR;
export const SCHEME_NAME = KASA_NAME;
export const SCHEME = KASA;

let active = KASA; // çizim sırasında kullanılan kasa (dışa aktarımda değişebilir)
const pal = (part) => PALETTES[active.pal[part]];

function label(x, p, text, px, py, { size = 18, align = 'left', spacing = 0.22, weight = 600, font = 'Plex Mono' } = {}) {
  x.save();
  x.font = `${weight} ${size}px "${font}", ui-monospace, monospace`;
  x.textAlign = align; x.textBaseline = 'middle';
  if ('letterSpacing' in x) x.letterSpacing = `${spacing * size}px`;
  x.fillStyle = p.inkHi; x.fillText(text, px, py + 1.2);
  x.fillStyle = p.ink; x.fillText(text, px, py);
  x.restore();
}

function screw(x, p, px, py, r = 7) {
  if (active.screws === false) return;
  x.fillStyle = rg(x, px - 2, py - 2, 0, px, py, r, [[0, p.screw[0]], [0.6, p.screw[1]], [1, p.screw[2]]]);
  x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(0,0,0,0.6)'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(px - r * 0.6, py - r * 0.3); x.lineTo(px + r * 0.6, py + r * 0.3); x.stroke();
}

// Kalıplanmış yarıklar (koyu, alt kenarı ışıklı).
function slots(x, p, px, py, w, h, n, vertical = true) {
  for (let i = 0; i < n; i++) {
    if (vertical) {
      const sx = px + (i * w) / n, sw = (w / n) * 0.42;
      x.fillStyle = p.slot; rr(x, sx, py, sw, h, sw / 2); x.fill();
      x.fillStyle = p.slotHi; x.fillRect(sx + 1, py + h, sw - 2, 2);
    } else {
      const sy = py + (i * h) / n, sh = (h / n) * 0.42;
      x.fillStyle = p.slot; rr(x, px, sy, w, sh, sh / 2); x.fill();
      x.fillStyle = p.slotHi; x.fillRect(px, sy + sh, w, 2);
    }
  }
}

// Pahlı dikdörtgen yolu (c: pah boyu; k: köşe çarpanları sol üst, sağ üst, sağ alt, sol alt).
function chamferPath(x, px, py, w, h, c, k = [1.6, 0.6, 1.6, 0.6]) {
  const [a, b, d, e] = k.map((m) => c * m);
  x.beginPath();
  x.moveTo(px + a, py); x.lineTo(px + w - b, py); x.lineTo(px + w, py + b);
  x.lineTo(px + w, py + h - d); x.lineTo(px + w - d, py + h); x.lineTo(px + e, py + h);
  x.lineTo(px, py + h - e); x.lineTo(px, py + a); x.closePath();
}

function shape(x, px, py, w, h, r = active.radius) {
  if (active.casing === 'chamfer') chamferPath(x, px, py, w, h, r);
  else rr(x, px, py, w, h, active.casing === 'sharp' ? Math.min(r, 4) : r);
}

// Kasa: üst eğimli yüz, ön yüz, köşeler, kenar parlaması ve gölge.
function casing(x, p, px, py, w, h, { top = 30, radius = active.radius } = {}) {
  x.fillStyle = 'rgba(0,0,0,0.35)';
  shape(x, px + 6, py + 10, w, h, radius); x.fill();
  const inset = active.casing === 'sharp' ? 6 : active.casing === 'chamfer' ? radius * 1.6 : 18;
  x.fillStyle = lg(x, 0, py - top, 0, py + 4, [[0, p.hi], [1, p.top]]);
  x.beginPath();
  x.moveTo(px + inset, py - top); x.lineTo(px + w - inset * (active.casing === 'chamfer' ? 0.4 : 1), py - top); x.lineTo(px + w, py + 4); x.lineTo(px, py + 4);
  x.closePath(); x.fill();
  x.fillStyle = lg(x, 0, py, 0, py + h, [[0, p.face], [0.6, p.mid], [1, p.low]]);
  shape(x, px, py, w, h, radius); x.fill();
  x.fillStyle = lg(x, px, 0, px + w, 0, [[0, p.side[0]], [0.12, 'rgba(0,0,0,0)'], [0.88, 'rgba(0,0,0,0)'], [1, p.side[1]]]);
  shape(x, px, py, w, h, radius); x.fill();
  x.fillStyle = p.glint;
  const gi = active.casing === 'chamfer' ? radius * 1.7 : radius * 0.6;
  x.fillRect(px + gi, py + 2, w - gi - radius * 0.7, 2.5);
  x.strokeStyle = p.edge; x.lineWidth = 2;
  shape(x, px, py, w, h, radius); x.stroke();
}

// Ekran çerçevesi. tube: kalın, içe eğimli; hood: üstte ve yanlarda siperlik;
// flat: ince ve düz; chamfer: pahlı, vurgu çizgili.
function screenBezel(x, p, r, { pad = 34, radius = 30 } = {}) {
  const kind = active.bezel;
  if (kind === 'flat') { pad = Math.round(pad * 0.45); radius = 4; }
  const ox = r.x - pad, oy = r.y - pad, ow = r.w + pad * 2, oh = r.h + pad * 2;
  const outline = (px, py, w, h, rad) => (kind === 'chamfer' ? chamferPath(x, px, py, w, h, rad * 0.7) : rr(x, px, py, w, h, rad));
  if (kind === 'hood') {
    // siperlik: çerçevenin üstüne ve yanlarına taşan, gölge düşüren kalın dudak
    const hp = pad * 0.55;
    x.fillStyle = 'rgba(0,0,0,0.45)'; rr(x, ox - hp + 4, oy - hp + 8, ow + hp * 2, oh * 0.7, radius + hp); x.fill();
    x.fillStyle = lg(x, 0, oy - hp, 0, oy + oh * 0.7, [[0, p.hi], [1, p.mid]]);
    rr(x, ox - hp, oy - hp, ow + hp * 2, oh * 0.72, radius + hp); x.fill();
    x.fillStyle = p.glint; x.fillRect(ox - hp + radius, oy - hp + 2, ow + hp * 2 - radius * 2, 2.5);
  }
  x.fillStyle = lg(x, 0, oy, 0, oy + oh, [[0, p.bezel[0]], [1, p.bezel[1]]]);
  outline(ox, oy, ow, oh, radius); x.fill();
  if (kind !== 'flat') {
    for (let i = 0; i < 14; i++) {
      const k = i / 14, inset = pad * 0.35 + k * pad * 0.62;
      x.strokeStyle = `rgba(${p.bezelShade},${0.04 + k * 0.08})`;
      x.lineWidth = 3;
      outline(ox + inset, oy + inset, ow - inset * 2, oh - inset * 2, radius * (1 - k * 0.5)); x.stroke();
    }
  }
  x.fillStyle = p.recess;
  outline(r.x - 10, r.y - 10, r.w + 20, r.h + 20, kind === 'flat' ? 3 : 18); x.fill();
  x.fillStyle = '#060706';
  outline(r.x - 4, r.y - 4, r.w + 8, r.h + 8, kind === 'flat' ? 2 : 14); x.fill();
  x.strokeStyle = p.glint; x.lineWidth = kind === 'flat' ? 1.5 : 2;
  x.beginPath(); x.moveTo(ox + radius, oy + 2); x.lineTo(ox + ow - radius, oy + 2); x.stroke();
  if (kind === 'chamfer' && active.accent) {
    // pahlı köşelerde vurgu
    x.strokeStyle = active.accent; x.lineWidth = 4;
    const c = radius * 0.7 * 1.6;
    x.beginPath(); x.moveTo(ox, oy + c + 40); x.lineTo(ox, oy + c); x.lineTo(ox + c, oy); x.lineTo(ox + c + 60, oy); x.stroke();
    const d = radius * 0.7 * 1.6;
    x.beginPath(); x.moveTo(ox + ow, oy + oh - d - 40); x.lineTo(ox + ow, oy + oh - d); x.lineTo(ox + ow - d, oy + oh); x.lineTo(ox + ow - d - 60, oy + oh); x.stroke();
  }
}

function knob(x, kx, ky, r = 28) {
  x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.arc(kx + 3, ky + 5, r, 0, TAU); x.fill();
  x.fillStyle = rg(x, kx - r * 0.3, ky - r * 0.3, 2, kx, ky, r, [[0, '#5a5c5a'], [0.7, '#2a2c2b'], [1, '#121312']]);
  x.beginPath(); x.arc(kx, ky, r, 0, TAU); x.fill();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    x.strokeStyle = 'rgba(255,255,255,0.1)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(kx + Math.cos(a) * r * 0.82, ky + Math.sin(a) * r * 0.82); x.lineTo(kx + Math.cos(a) * r, ky + Math.sin(a) * r); x.stroke();
  }
  x.strokeStyle = '#e6e8e4'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(kx, ky); x.lineTo(kx + r * 0.45, ky - r * 0.7); x.stroke();
}

function casingSmall(x, p, px, py, w, h) {
  x.fillStyle = 'rgba(0,0,0,0.3)'; shape(x, px + 4, py + 6, w, h, 16); x.fill();
  x.fillStyle = lg(x, 0, py, 0, py + h, [[0, p.hi], [1, p.low]]);
  shape(x, px, py, w, h, 16); x.fill();
  x.strokeStyle = p.edge; x.lineWidth = 2; shape(x, px, py, w, h, 16); x.stroke();
}

// Küçük mandallı anahtar (yukarı/aşağı).
function toggle(x, px, py, up = true) {
  x.fillStyle = '#0b0b0a'; rr(x, px - 12, py - 16, 24, 32, 4); x.fill();
  x.fillStyle = rg(x, px - 2, py - 2, 0, px, py, 9, [[0, '#d7d9d6'], [1, '#55585a']]);
  x.beginPath(); x.arc(px, py, 8, 0, TAU); x.fill();
  x.strokeStyle = '#c4c7c4'; x.lineWidth = 5; x.lineCap = 'round';
  x.beginPath(); x.moveTo(px, py); x.lineTo(px, py + (up ? -22 : 22)); x.stroke();
  x.lineCap = 'butt';
}

// Kabartma etiket bandı (80'ler etiketleme makinesi).
function tape(x, text, px, py, { size = 15, bg = '#111', fg = 'rgba(240,240,232,0.9)' } = {}) {
  x.save();
  x.font = `600 ${size}px "Plex Mono", monospace`;
  if ('letterSpacing' in x) x.letterSpacing = `${size * 0.18}px`;
  const w = x.measureText(text).width + size * 1.2;
  x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillRect(px + 2, py - size * 0.75 + 3, w, size * 1.5);
  x.fillStyle = bg; x.fillRect(px, py - size * 0.75, w, size * 1.5);
  x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(px, py - size * 0.75, w, 2);
  x.textBaseline = 'middle'; x.fillStyle = fg; x.fillText(text, px + size * 0.6, py + 1);
  x.restore();
}

function hazard(x, px, py, w, h, color, step = 26) {
  x.save();
  x.beginPath(); x.rect(px, py, w, h); x.clip();
  x.fillStyle = color; x.fillRect(px, py, w, h);
  x.fillStyle = '#0b0b0b';
  for (let i = -h; i < w + h; i += step * 2) {
    x.beginPath(); x.moveTo(px + i, py + h); x.lineTo(px + i + step, py + h); x.lineTo(px + i + step + h, py); x.lineTo(px + i + h, py); x.closePath(); x.fill();
  }
  x.restore();
}

// ---------------------------------------------------------------- kasa ayrıntıları
// Her biri gövde çizildikten sonra, kir katmanından önce çalışır.

function decor1982(x, { PS }) {
  // pirinç şeritler: taban üst kenarı ve orta modülün altı
  const brass = (px, py, w, h) => {
    x.fillStyle = lg(x, 0, py, 0, py + h, [[0, '#e6c886'], [0.45, '#a07c42'], [1, '#4a3518']]);
    x.fillRect(px, py, w, h);
  };
  brass(40, 1146, BODY.W - 80, 7);
  brass(660, 1088, 728, 5);
  // etiket bantları
  tape(x, `${t('brand.testShort')}-${t('brand.model')}`, 740, 1114, { size: 14 });
  tape(x, 'CAL 0.82', 1110, 1114, { size: 14 });
  // anahtarlar
  toggle(x, 1310, 1116, true); toggle(x, 1356, 1116, false);
  // sağ modülde perçinli kapak plakası
  const [qx, qy] = [1572, 1036];
  x.fillStyle = lg(x, 0, qy, 0, qy + 60, [[0, '#4e5357'], [1, '#2a2e31']]);
  rr(x, qx, qy, 140, 60, 4); x.fill();
  for (const [sx, sy] of [[qx + 10, qy + 10], [qx + 130, qy + 10], [qx + 10, qy + 50], [qx + 130, qy + 50]]) screw(x, PS, sx, sy, 4);
  tape(x, '220V', qx + 28, qy + 30, { size: 13 });
  // taban altında kablo demeti
  x.lineCap = 'round';
  for (const [c, dy] of [['#1a1611', 0], ['#2a2016', 12], ['#14110d', 22]]) {
    x.strokeStyle = c; x.lineWidth = 10;
    x.beginPath(); x.moveTo(30, 1230 + dy); x.bezierCurveTo(0, 1240 + dy, -10, 1262, -20, 1280); x.stroke();
  }
  x.lineCap = 'butt';
  // çizikler
  const R = seeded(1982);
  x.strokeStyle = 'rgba(255,230,190,0.08)'; x.lineWidth = 1;
  for (let i = 0; i < 90; i++) {
    const px = 40 + R() * (BODY.W - 80), py = 460 + R() * 760, l = 6 + R() * 40, a = (R() - 0.5) * 0.8;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
}

function decor2017(x, { PC }) {
  // beton benzeri ince lekelenme (yalnızca orta gövdede)
  const R = seeded(2017);
  x.save();
  x.beginPath(); rr(x, 628, 452, 792, 698, 3); x.clip();
  for (let i = 0; i < 260; i++) {
    const px = 628 + R() * 792, py = 452 + R() * 698, r = 2 + R() * 26;
    x.fillStyle = `rgba(${R() < 0.5 ? '60,52,40' : '255,250,240'},${0.025 + R() * 0.04})`;
    x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
  }
  // tek ince amber çizgi (kalıp birleşimi)
  x.fillStyle = 'rgba(214,150,64,0.75)'; x.fillRect(628, 948, 792, 3);
  x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(628, 951, 792, 2);
  x.restore();
  // kazınmış seri numarası
  label(x, PC, 'N° 6-1104-0417', 1396, 1128, { size: 13, align: 'right', spacing: 0.3, weight: 400 });
  // yan monitörlerin önünde yekpare koyu plaka hissi: derin bir derz
  for (const px of [40, 1388]) {
    x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(px + 10, 1004, 600, 3);
    x.fillStyle = 'rgba(255,240,220,0.06)'; x.fillRect(px + 10, 1007, 600, 1);
  }
}

function decorSiber(x, { PB, PC }) {
  const Y = active.accent;
  // tabanda uyarı şeridi
  hazard(x, 520, 1188, 1008, 18, Y);
  // modül köşelerinde sarı pah vurguları
  x.fillStyle = Y;
  for (const [px, py, w] of [[40, 540, 620], [1388, 540, 620], [628, 452, 792]]) {
    const c = active.radius * 1.6;
    x.beginPath(); x.moveTo(px, py + c); x.lineTo(px + c, py); x.lineTo(px + c + 10, py); x.lineTo(px, py + c + 10); x.closePath(); x.fill();
    x.fillRect(px + w - 90, py + 8, 60, 5);
  }
  // büyük şablon numara
  x.save();
  x.font = '700 120px "Jost", sans-serif';
  x.fillStyle = 'rgba(236,214,48,0.12)'; x.textBaseline = 'alphabetic';
  x.fillText('06', 1220, 1088);
  x.restore();
  label(x, PC, `${t('machine.caution')} · ${t('machine.voltage')}`, 670, 1112, { size: 13, spacing: 0.24 });
  // barkod etiketi
  x.fillStyle = '#d9d6c8'; x.fillRect(1440, 1096, 150, 46);
  const R = seeded(77);
  x.fillStyle = '#111';
  for (let bx = 1448; bx < 1582;) { const w = 1 + Math.floor(R() * 4); if (R() > 0.4) x.fillRect(bx, 1100, w, 30); bx += w + 1; }
  x.font = '600 8px "Plex Mono", monospace'; x.fillText('MK-VI-0613-B', 1450, 1138);
  // açılı havalandırma
  x.save();
  for (const bx of [80, 1460]) {
    for (let i = 0; i < 7; i++) {
      x.fillStyle = PB.slot;
      x.beginPath(); x.moveTo(bx + i * 26, 1238); x.lineTo(bx + i * 26 + 12, 1238); x.lineTo(bx + i * 26 + 28, 1206); x.lineTo(bx + i * 26 + 16, 1206); x.closePath(); x.fill();
    }
  }
  x.restore();
}

function decorTerminal(x, { PS, PC }) {
  // antrasit trim bandı (yan modüllerin alt kısmı)
  for (const px of [40, 1388]) {
    x.save(); shape(x, px, 540, 620, 610); x.clip();
    x.fillStyle = lg(x, 0, 1000, 0, 1150, [[0, '#34363a'], [1, '#1d1e20']]);
    x.fillRect(px, 1004, 620, 150);
    x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(px, 1004, 620, 2);
    x.restore();
  }
  // disket yuvası (sol modül, trim üzerinde)
  x.fillStyle = '#0c0d0e'; rr(x, 190, 1092, 300, 16, 4); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(192, 1108, 296, 1.5);
  x.fillStyle = '#9a9c98'; rr(x, 440, 1060, 40, 14, 3); x.fill();
  // renkli şeritli rozet
  const bx = 1200, by = 1100;
  x.fillStyle = '#2a2b2c'; rr(x, bx, by, 150, 30, 3); x.fill();
  ['#e0a43a', '#d9cf5a', '#6bb07c', '#5a8fbf'].forEach((c, i) => { x.fillStyle = c; x.fillRect(bx + 10 + i * 16, by + 8, 12, 14); });
  label(x, { ink: 'rgba(230,226,214,0.85)', inkHi: 'rgba(0,0,0,0.4)' }, t('brand.model'), bx + 140, by + 15, { size: 13, align: 'right', spacing: 0.12 });
  // orta modülün alt köşesinde sıcaklık yarıkları (koyu, yatay)
  slots(x, PC, 660, 1000, 80, 60, 6, false);
  void PS;
}

function decorSaha(x, { PS }) {
  // raf kulakları ve tutamaklar (yan modüllerin dış kenarları)
  for (const [ex, dir] of [[22, -1], [2008, 1]]) {
    const ear = dir < 0 ? ex : ex - 4;
    x.fillStyle = lg(x, ear, 0, ear + 22, 0, [[0, '#2c3022'], [1, '#4a5038']]);
    rr(x, ear, 560, 22, 570, 4); x.fill();
    for (const sy of [600, 1090]) screw(x, PS, ear + 11, sy, 6);
    // U tutamak
    x.strokeStyle = '#191a14'; x.lineWidth = 18; x.lineCap = 'round';
    x.beginPath(); x.moveTo(ear + 11, 700); x.lineTo(ear + 11 + dir * 26, 720); x.lineTo(ear + 11 + dir * 26, 950); x.lineTo(ear + 11, 970); x.stroke();
    x.strokeStyle = 'rgba(220,225,200,0.18)'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(ear + 11 + dir * 26 - 5, 724); x.lineTo(ear + 11 + dir * 26 - 5, 946); x.stroke();
    x.lineCap = 'butt';
  }
  // mandallar (orta modül tabanında)
  for (const lx of [700, 1290]) {
    x.fillStyle = '#23251b'; rr(x, lx, 1104, 58, 34, 4); x.fill();
    x.fillStyle = lg(x, 0, 1108, 0, 1134, [[0, '#8d907c'], [1, '#43463a']]); rr(x, lx + 8, 1110, 42, 14, 3); x.fill();
  }
  // kauçuk köşe koruyucuları
  x.fillStyle = '#121310';
  for (const [cx, cy] of [[40, 540], [660, 540], [40, 1150], [660, 1150], [1388, 540], [2008, 540], [1388, 1150], [2008, 1150]]) {
    x.beginPath(); x.arc(cx, cy, 20, 0, TAU); x.fill();
  }
  // şablon yazılar
  x.save();
  x.font = '700 30px "Jost", sans-serif';
  if ('letterSpacing' in x) x.letterSpacing = '6px';
  x.fillStyle = 'rgba(232,228,206,0.5)';
  x.fillText(`${t('brand.testShort')} ${t('brand.model')}`, 110, 1244);
  x.font = '600 16px "Plex Mono", monospace';
  x.fillText(`${t('machine.power')} 220V ~ 50HZ`, 1440, 1132);
  x.restore();
}

export function paintBody(name = KASA_NAME) {
  active = KASALAR[name] ?? KASA;
  const { W, H } = BODY;
  const c = mk(W, H), x = c.getContext('2d');
  const PB = pal('base'), PS = pal('sides'), PC = pal('center'), PA = pal('arm');

  // taban
  x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillRect(30, 1176, W - 60, 100);
  x.fillStyle = lg(x, 0, 1150, 0, 1176, [[0, PB.top], [1, PB.mid]]);
  x.beginPath(); x.moveTo(40, 1150); x.lineTo(W - 40, 1150); x.lineTo(W - 22, 1176); x.lineTo(22, 1176); x.closePath(); x.fill();
  x.fillStyle = lg(x, 0, 1176, 0, H, [[0, PB.mid], [1, PB.low]]);
  x.fillRect(22, 1176, W - 44, H - 1180);
  if (active.decor !== decorSiber) { if (active.decor !== decorSaha) slots(x, PB, 90, 1196, 340, 46, 16); slots(x, PB, W - 430, 1196, 340, 46, 16); }
  label(x, PB, `${t('brand.machine')}  ${t('brand.model')}`, W / 2, active.decor === decorSiber ? 1252 : 1222, { size: 22, align: 'center', spacing: 0.32 });

  // sol modül
  casing(x, PS, 40, 540, 620, 610);
  screenBezel(x, PS, L.left);
  label(x, PS, t('machine.panelLeft'), 300, 567, { size: 18 });
  slots(x, PS, 80, 556, 200, 20, 10, false);
  screw(x, PS, 66, 566); screw(x, PS, 634, 566); screw(x, PS, 66, 1124); screw(x, PS, 634, 1124);
  x.fillStyle = PS.socket; rr(x, L.alarm.x - 12, L.alarm.y - 9, L.alarm.w + 24, L.alarm.h + 18, 8); x.fill();
  label(x, PS, t('machine.anomaly'), L.alarm.x - 4, L.alarm.y - 26, { size: 15 });
  x.fillStyle = PS.socket; x.beginPath(); x.arc(L.stressLamp.x, L.stressLamp.y, 22, 0, TAU); x.fill();
  label(x, PS, t('machine.stress'), L.stressLamp.x, L.stressLamp.y - 42, { size: 15, align: 'center' });

  // sağ modül
  casing(x, PS, 1388, 540, 620, 610);
  screenBezel(x, PS, L.right);
  label(x, PS, t('machine.panelRight'), 1436, 567, { size: 18 });
  slots(x, PS, 1760, 556, 200, 20, 10, false);
  screw(x, PS, 1414, 566); screw(x, PS, 1982, 566); screw(x, PS, 1414, 1124); screw(x, PS, 1982, 1124);
  x.fillStyle = PS.socket; x.beginPath(); x.arc(L.calLamp.x, L.calLamp.y, 17, 0, TAU); x.fill();
  label(x, PS, t('machine.calib'), L.calLamp.x + 32, L.calLamp.y, { size: 15 });
  knob(x, 1770, 1066); knob(x, 1890, 1066);

  // sensör kolu
  x.lineCap = 'round';
  x.strokeStyle = lg(x, 1880, 0, 1960, 0, [[0, '#1b1d1b'], [0.5, '#5d605b'], [1, '#1b1d1b']]);
  x.lineWidth = 24;
  x.beginPath(); x.moveTo(1900, 548); x.lineTo(1940, 382); x.lineTo(1880, 252); x.stroke();
  for (const [jx, jy] of [[1940, 382], [1900, 548]]) {
    x.fillStyle = rg(x, jx - 5, jy - 5, 2, jx, jy, 20, [[0, PA.hi], [1, PA.low]]);
    x.beginPath(); x.arc(jx, jy, 20, 0, TAU); x.fill();
  }
  casingSmall(x, PA, 1774, 156, 182, 116);
  x.fillStyle = '#0b0c0b'; x.beginPath(); x.arc(1832, 214, 32, 0, TAU); x.fill();
  x.strokeStyle = PA.glint; x.lineWidth = 3; x.stroke();
  x.fillStyle = rg(x, 1824, 204, 0, 1832, 214, 26, [[0, 'rgba(160,200,200,0.5)'], [0.4, 'rgba(40,60,60,0.4)'], [1, 'rgba(0,0,0,0)']]);
  x.beginPath(); x.arc(1832, 214, 26, 0, TAU); x.fill();
  x.lineCap = 'butt';

  // orta modül (CRT): yan modüllerden biraz yüksek ve geniş, kenarları onların önüne biner
  casing(x, PC, 628, 452, 792, 698, { top: 28, radius: active.casing === 'round' ? active.radius + 4 : active.radius });
  // körük kaidesi (körük üstte ayrı katman)
  x.fillStyle = lg(x, 0, 418, 0, 452, [[0, '#3a3d3e'], [1, '#151617']]);
  rr(x, 690, 418, 668, 34, 8); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(704, 420, 640, 2);
  // LED çubuğu yuvası
  x.fillStyle = PC.socket; rr(x, L.led.x - 14, L.led.y - 11, L.led.w + 28, L.led.h + 22, 8); x.fill();
  // CRT çerçevesi
  screenBezel(x, PC, L.crt, { pad: 44, radius: 40 });
  for (let r = 0; r < 7; r++) for (let q = 0; q < 3; q++) {
    x.fillStyle = PC.slot; x.beginPath(); x.arc(1354 + q * 16, 584 + r * 20, 4.2, 0, TAU); x.fill();
  }
  for (const k of L.keys) { x.fillStyle = PC.slot; rr(x, k.x - 6, k.y - 6, L.keySize.w + 12, L.keySize.h + 12, 7); x.fill(); }
  label(x, PC, `${t('machine.channel')} 06`, L.crt.x - 6, 972, { size: 17 });
  label(x, PC, t('machine.focus'), L.crt.x + L.crt.w + 6, 972, { size: 17, align: 'right' });
  slots(x, PC, 760, 1006, 520, 72, 24);
  x.fillStyle = PC.socket; rr(x, 660, 1100, 60, 28, 6); x.fill();
  screw(x, PC, 652, 474); screw(x, PC, 1396, 474); screw(x, PC, 652, 1124); screw(x, PC, 1396, 1124);

  // kablo
  x.strokeStyle = '#141412'; x.lineWidth = 16;
  x.beginPath(); x.moveTo(40, 1240); x.bezierCurveTo(16, 1252, 4, 1268, -10, 1280); x.stroke();

  active.decor?.(x, { PB, PS, PC, PA });

  // kir ve yıpranma
  const R = seeded(77), g = active.grime ?? 1;
  x.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 70 * g; i++) {
    const px = R() * W, py = 320 + R() * 960, r = 30 + R() * 200;
    const d = PC.dirt[R() < 0.5 ? 0 : 1];
    x.fillStyle = rg(x, px, py, 0, px, py, r, [[0, `rgba(${d},${0.04 + R() * 0.07})`], [1, 'rgba(0,0,0,0)']]);
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  x.globalCompositeOperation = 'source-over';
  grain(x, W, H, 8, 41);
  active = KASA;
  return c;
}

// Ön paneldeki üç tuş (biri amber yanar).
export function paintKey(lit) {
  const c = mk(64, 64), x = c.getContext('2d');
  x.fillStyle = lit ? '#ffd08e' : pal('center').key;
  rr(x, 2, 2, 60, 60, 8); x.fill();
  x.fillStyle = 'rgba(40,40,36,0.35)';
  x.fillRect(2, 48, 60, 14);
  x.fillStyle = 'rgba(255,255,255,0.5)';
  x.fillRect(5, 5, 54, 4);
  return c;
}
