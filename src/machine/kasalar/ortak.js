// Kasa çizimlerinin ortak parçaları: renk paletleri, kutu/çerçeve/yarık/vida çizicileri.
// Her kasa (kasalar/*.js) kendi biçimini bu parçalarla kurar; canlı parçaların
// (ekranlar, LED çubuğu, körük, tuşlar, lambalar) yeri kasanın L düzeninden gelir.
import { rr, lg, rg, grain, seeded } from '../../scene/paint.js';

export const TAU = Math.PI * 2;

// Canlı katmanların en-boy oranları (tuvalleri sabit): bunlara uyan dikdörtgen üretir.
export const ASPECT = { crt: 768 / 440, mon: 512 / 390, bellows: 640 / 350 };
export const crtRect = (x, y, w) => ({ x, y, w, h: Math.round(w / ASPECT.crt) });
export const monRect = (x, y, w) => ({ x, y, w, h: Math.round(w / ASPECT.mon) });
export const bellowsRect = (x, y, w) => ({ x, y, w, h: Math.round(w / ASPECT.bellows) });
// körük emiş ağzı (körük dokusundaki konumun oranı)
export const intakeOf = (b) => ({ x: Math.round(b.x + b.w * 0.283), y: Math.round(b.y + b.h * 0.386) });

export const PAL = {
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
  bej: {
    hi: '#ece5d2', top: '#e0d8c2', face: '#d2c8ae', mid: '#c4b99d', low: '#a99e82',
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
  kum: {
    hi: '#cfc7b8', top: '#c0b8a9', face: '#ada595', mid: '#a1998a', low: '#8a8374',
    side: ['rgba(40,34,26,0.22)', 'rgba(30,26,20,0.36)'], edge: 'rgba(40,34,26,0.5)', glint: 'rgba(255,250,240,0.4)',
    slot: '#26231e', slotHi: 'rgba(255,250,240,0.3)', ink: 'rgba(48,42,34,0.62)', inkHi: 'rgba(255,250,240,0.25)',
    bezel: ['#1c1b19', '#121110'], bezelShade: '0,0,0', recess: '#0b0b0a', socket: '#141311',
    screw: ['#c9c1b2', '#a69e8f', '#7c7568'], dirt: ['80,68,50', '40,36,30'], key: '#d8d1c3',
  },
  gece: {
    hi: '#363a3e', top: '#282b2e', face: '#1a1c1f', mid: '#141618', low: '#0c0d0e',
    side: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)'], edge: 'rgba(0,0,0,0.9)', glint: 'rgba(255,240,170,0.18)',
    slot: '#040505', slotHi: 'rgba(255,240,150,0.1)', ink: 'rgba(236,214,48,0.85)', inkHi: 'rgba(0,0,0,0.8)',
    bezel: ['#22252a', '#0f1012'], bezelShade: '0,0,0', recess: '#08090a', socket: '#060707',
    screw: ['#8e9296', '#4a4e52', '#1c1e20'], dirt: ['80,80,70', '0,0,0'], key: '#d6d3c4',
  },
  zeytin: {
    hi: '#6e7552', top: '#5e6445', face: '#4c5238', mid: '#434830', low: '#323624',
    side: ['rgba(0,0,0,0.26)', 'rgba(0,0,0,0.44)'], edge: 'rgba(10,12,6,0.8)', glint: 'rgba(235,240,205,0.26)',
    slot: '#14160e', slotHi: 'rgba(235,240,205,0.14)', ink: 'rgba(232,228,206,0.74)', inkHi: 'rgba(0,0,0,0.5)',
    bezel: ['#2b2f20', '#1c1f15'], bezelShade: '0,0,0', recess: '#0e0f0a', socket: '#0b0c08',
    screw: ['#b9bca8', '#6f725f', '#2c2e24'], dirt: ['110,90,50', '20,22,14'], key: '#cfccb4',
  },
};

export function label(x, p, text, px, py, { size = 18, align = 'left', spacing = 0.22, weight = 600, font = 'Plex Mono' } = {}) {
  x.save();
  x.font = `${weight} ${size}px "${font}", ui-monospace, monospace`;
  x.textAlign = align; x.textBaseline = 'middle';
  if ('letterSpacing' in x) x.letterSpacing = `${spacing * size}px`;
  x.fillStyle = p.inkHi; x.fillText(text, px, py + 1.2);
  x.fillStyle = p.ink; x.fillText(text, px, py);
  x.restore();
}

export function screw(x, p, px, py, r = 7) {
  x.fillStyle = rg(x, px - 2, py - 2, 0, px, py, r, [[0, p.screw[0]], [0.6, p.screw[1]], [1, p.screw[2]]]);
  x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(0,0,0,0.6)'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(px - r * 0.6, py - r * 0.3); x.lineTo(px + r * 0.6, py + r * 0.3); x.stroke();
}

// Kalıplanmış yarıklar (koyu, alt kenarı ışıklı).
export function slots(x, p, px, py, w, h, n, vertical = true) {
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

// Pahlı dikdörtgen yolu (k: köşe çarpanları sol üst, sağ üst, sağ alt, sol alt).
export function chamferPath(x, px, py, w, h, c, k = [1, 1, 1, 1]) {
  const [a, b, d, e] = k.map((m) => c * m);
  x.beginPath();
  x.moveTo(px + a, py); x.lineTo(px + w - b, py); x.lineTo(px + w, py + b);
  x.lineTo(px + w, py + h - d); x.lineTo(px + w - d, py + h); x.lineTo(px + e, py + h);
  x.lineTo(px, py + h - e); x.lineTo(px, py + a); x.closePath();
}

export function polyPath(x, pts) {
  x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]);
  x.closePath();
}

// Kutu: düşen gölge, üst eğimli yüz, ön yüz, yanlarda kararma, kenar parlaması.
// path(x, px, py, w, h) ön yüzün biçimini çizer (yoksa yuvarlak köşeli dikdörtgen).
export function box(x, p, px, py, w, h, { top = 26, radius = 18, path = null, glint = true, shadow = true } = {}) {
  const shape = path ?? ((qx, qy, qw, qh) => rr(x, qx, qy, qw, qh, radius));
  if (shadow) { x.fillStyle = 'rgba(0,0,0,0.38)'; shape(px + 6, py + 10, w, h); x.fill(); }
  if (top > 0) {
    const ins = Math.min(radius, 24);
    x.fillStyle = lg(x, 0, py - top, 0, py + 4, [[0, p.hi], [1, p.top]]);
    polyPath(x, [[px + ins, py - top], [px + w - ins, py - top], [px + w, py + 4], [px, py + 4]]); x.fill();
  }
  x.fillStyle = lg(x, 0, py, 0, py + h, [[0, p.face], [0.6, p.mid], [1, p.low]]);
  shape(px, py, w, h); x.fill();
  x.fillStyle = lg(x, px, 0, px + w, 0, [[0, p.side[0]], [0.1, 'rgba(0,0,0,0)'], [0.9, 'rgba(0,0,0,0)'], [1, p.side[1]]]);
  shape(px, py, w, h); x.fill();
  if (glint) { x.fillStyle = p.glint; x.fillRect(px + radius * 0.8, py + 2, w - radius * 1.6, 2.5); }
  x.strokeStyle = p.edge; x.lineWidth = 2;
  shape(px, py, w, h); x.stroke();
}

// Ekran çerçevesi. tube: kalın, içe eğimli; flat: ince; hood: üst siperlikli.
export function bezel(x, p, r, { pad = 34, radius = 30, kind = 'tube', colors = p.bezel } = {}) {
  const ox = r.x - pad, oy = r.y - pad, ow = r.w + pad * 2, oh = r.h + pad * 2;
  if (kind === 'hood') {
    const hp = pad * 0.6;
    x.fillStyle = 'rgba(0,0,0,0.45)'; rr(x, ox - hp + 4, oy - hp + 8, ow + hp * 2, oh * 0.72, radius + hp); x.fill();
    x.fillStyle = lg(x, 0, oy - hp, 0, oy + oh * 0.7, [[0, p.hi], [1, p.mid]]);
    rr(x, ox - hp, oy - hp, ow + hp * 2, oh * 0.72, radius + hp); x.fill();
    x.fillStyle = p.glint; x.fillRect(ox - hp + radius, oy - hp + 2, ow + hp * 2 - radius * 2, 2.5);
  }
  x.fillStyle = lg(x, 0, oy, 0, oy + oh, [[0, colors[0]], [1, colors[1]]]);
  rr(x, ox, oy, ow, oh, radius); x.fill();
  if (kind !== 'flat') {
    for (let i = 0; i < 14; i++) {
      const k = i / 14, inset = pad * 0.35 + k * pad * 0.62;
      x.strokeStyle = `rgba(${p.bezelShade},${0.04 + k * 0.08})`; x.lineWidth = 3;
      rr(x, ox + inset, oy + inset, ow - inset * 2, oh - inset * 2, radius * (1 - k * 0.5)); x.stroke();
    }
  }
  x.fillStyle = p.recess; rr(x, r.x - 10, r.y - 10, r.w + 20, r.h + 20, kind === 'flat' ? 4 : 16); x.fill();
  x.fillStyle = '#060706'; rr(x, r.x - 4, r.y - 4, r.w + 8, r.h + 8, kind === 'flat' ? 3 : 12); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.14)'; x.lineWidth = 1.5;
  x.beginPath(); x.moveTo(ox + radius, oy + 2); x.lineTo(ox + ow - radius, oy + 2); x.stroke();
}

// Canlı katmanların yuvaları (LED çubuğu, tuşlar, lambalar) — her kasada aynı çağrı.
export function sockets(x, p, L, { labels = true, t } = {}) {
  x.fillStyle = p.socket;
  rr(x, L.led.x - 12, L.led.y - 10, L.led.w + 24, L.led.h + 20, 7); x.fill();
  for (const k of L.keys) { rr(x, k.x - 6, k.y - 6, L.keySize.w + 12, L.keySize.h + 12, 7); x.fill(); }
  rr(x, L.alarm.x - 12, L.alarm.y - 9, L.alarm.w + 24, L.alarm.h + 18, 8); x.fill();
  x.beginPath(); x.arc(L.stressLamp.x, L.stressLamp.y, 20, 0, TAU); x.fill();
  x.beginPath(); x.arc(L.calLamp.x, L.calLamp.y, 16, 0, TAU); x.fill();
  x.beginPath(); x.arc(L.recLamp.x, L.recLamp.y, 14, 0, TAU); x.fill();
  if (labels && t) {
    label(x, p, t('machine.anomaly'), L.alarm.x - 4, L.alarm.y - 24, { size: 14 });
    label(x, p, t('machine.stress'), L.stressLamp.x, L.stressLamp.y - 36, { size: 14, align: 'center' });
    label(x, p, t('machine.calib'), L.calLamp.x + 28, L.calLamp.y, { size: 14 });
  }
}

export function knob(x, kx, ky, r = 28, cap = ['#5a5c5a', '#2a2c2b', '#121312']) {
  x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.arc(kx + 3, ky + 5, r, 0, TAU); x.fill();
  x.fillStyle = rg(x, kx - r * 0.3, ky - r * 0.3, 2, kx, ky, r, [[0, cap[0]], [0.7, cap[1]], [1, cap[2]]]);
  x.beginPath(); x.arc(kx, ky, r, 0, TAU); x.fill();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    x.strokeStyle = 'rgba(255,255,255,0.1)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(kx + Math.cos(a) * r * 0.82, ky + Math.sin(a) * r * 0.82); x.lineTo(kx + Math.cos(a) * r, ky + Math.sin(a) * r); x.stroke();
  }
  x.strokeStyle = '#e6e8e4'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(kx, ky); x.lineTo(kx + r * 0.45, ky - r * 0.7); x.stroke();
}

export function toggle(x, px, py, up = true) {
  x.fillStyle = '#0b0b0a'; rr(x, px - 12, py - 16, 24, 32, 4); x.fill();
  x.fillStyle = rg(x, px - 2, py - 2, 0, px, py, 9, [[0, '#d7d9d6'], [1, '#55585a']]);
  x.beginPath(); x.arc(px, py, 8, 0, TAU); x.fill();
  x.strokeStyle = '#c4c7c4'; x.lineWidth = 5; x.lineCap = 'round';
  x.beginPath(); x.moveTo(px, py); x.lineTo(px, py + (up ? -22 : 22)); x.stroke();
  x.lineCap = 'butt';
}

export function hazard(x, px, py, w, h, color, step = 26) {
  x.save();
  x.beginPath(); x.rect(px, py, w, h); x.clip();
  x.fillStyle = color; x.fillRect(px, py, w, h);
  x.fillStyle = '#0b0b0b';
  for (let i = -h; i < w + h; i += step * 2) polyPath(x, [[px + i, py + h], [px + i + step, py + h], [px + i + step + h, py], [px + i + h, py]]), x.fill();
  x.restore();
}

// Tuş takımı: satır satır tuş başlıkları (perspektifsiz, hafif gölgeli).
// rows: her satırdaki tuş genişlikleri (birim), u: birim tuş genişliği (px).
export function keycaps(x, px, py, rows, u, { gap = 6, h = u, colors = ['#e2dccb', '#bdb6a3'], dark = ['#4a4c4f', '#2c2d30'], darkKeys = new Set(), shear = 0 } = {}) {
  rows.forEach((row, ri) => {
    let cx = px + ri * shear;
    const cy = py + ri * (h + gap);
    row.forEach((wu, ki) => {
      const w = wu * u + (wu - 1) * gap;
      const c = darkKeys.has(`${ri}:${ki}`) ? dark : colors;
      x.fillStyle = 'rgba(0,0,0,0.45)'; rr(x, cx + 2, cy + 4, w, h, 6); x.fill();
      x.fillStyle = lg(x, 0, cy, 0, cy + h, [[0, c[0]], [1, c[1]]]); rr(x, cx, cy, w, h, 6); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.22)'; rr(x, cx + 4, cy + 3, w - 8, h * 0.62, 4); x.fill();
      x.fillStyle = lg(x, 0, cy, 0, cy + h, [[0, c[0]], [1, c[0]]]); rr(x, cx + 5, cy + 4, w - 10, h * 0.6, 4); x.fill();
      cx += w + gap;
    });
  });
}

// Kir, yıpranma ve gren (gövde çiziminin son adımı).
export function weather(x, W, H, p, { amount = 1, seed = 77, from = 0 } = {}) {
  const R = seeded(seed);
  x.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 70 * amount; i++) {
    const px = R() * W, py = from + R() * (H - from), r = 30 + R() * 200;
    const d = p.dirt[R() < 0.5 ? 0 : 1];
    x.fillStyle = rg(x, px, py, 0, px, py, r, [[0, `rgba(${d},${0.04 + R() * 0.07})`], [1, 'rgba(0,0,0,0)']]);
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  x.globalCompositeOperation = 'source-over';
  grain(x, W, H, 8, 41);
}

export function scratches(x, W, y0, y1, n, color, seed = 9) {
  const R = seeded(seed);
  x.strokeStyle = color; x.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const px = 40 + R() * (W - 80), py = y0 + R() * (y1 - y0), l = 6 + R() * 40, a = (R() - 0.5) * 0.8;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
}
