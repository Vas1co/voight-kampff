// Kasa çiziminin parçaları: renk paletleri, kutu/çerçeve/yarık/vida/düğme çizicileri.
import { rr, lg, rg, grain, seeded } from '../../scene/paint.js';

export const TAU = Math.PI * 2;

export const PAL = {
  gri: {
    hi: '#d3d5d3', top: '#c4c6c4', face: '#aeb1af', mid: '#9ea19f', low: '#848886',
    side: ['rgba(30,34,34,0.28)', 'rgba(20,24,24,0.42)'], edge: 'rgba(30,34,34,0.65)', glint: 'rgba(255,255,255,0.65)',
    slot: '#262929', slotHi: 'rgba(255,255,255,0.4)', ink: 'rgba(28,32,32,0.82)', inkHi: 'rgba(255,255,255,0.35)',
    bezel: ['#b9bcba', '#949896'], bezelShade: '20,24,24', recess: '#222525', socket: '#1b1d1d',
    screw: ['#eef0ee', '#a7aba9', '#5e6260'], dirt: ['60,62,58', '40,44,44'], key: '#d9dcd8',
  },
  // kırmızı boyalı metal (beyaz yazılı), içte siyah ekran çerçevesi
  kirmizi: {
    hi: '#d8473c', top: '#c2372e', face: '#a92920', mid: '#90201a', low: '#691712',
    side: ['rgba(40,4,2,0.3)', 'rgba(30,2,0,0.48)'], edge: 'rgba(30,4,2,0.75)', glint: 'rgba(255,205,195,0.45)',
    slot: '#1a0705', slotHi: 'rgba(255,190,180,0.22)', ink: 'rgba(255,238,232,0.82)', inkHi: 'rgba(60,0,0,0.5)',
    bezel: ['#2a2c2e', '#131415'], bezelShade: '0,0,0', recess: '#0b0c0c', socket: '#140605',
    screw: ['#b9bcbe', '#5e6264', '#202224'], dirt: ['40,10,8', '0,0,0'], key: '#d9dcd8',
  },
  beyaz: {
    hi: '#f3f3ef', top: '#e9e9e4', face: '#dddcd6', mid: '#d0cfc8', low: '#b3b2ab',
    side: ['rgba(40,40,36,0.2)', 'rgba(30,30,26,0.34)'], edge: 'rgba(50,50,46,0.5)', glint: 'rgba(255,255,255,0.8)',
    slot: '#2a2b2b', slotHi: 'rgba(255,255,255,0.5)', ink: 'rgba(40,42,44,0.8)', inkHi: 'rgba(255,255,255,0.5)',
    bezel: ['#2a2c2e', '#141516'], bezelShade: '0,0,0', recess: '#0c0d0d', socket: '#1c1d1d',
    screw: ['#f6f6f2', '#b4b4ae', '#6a6a64'], dirt: ['90,85,70', '50,50,46'], key: '#e6e6e0',
  },
  sari: {
    hi: '#f0c94a', top: '#e3b836', face: '#d1a327', mid: '#bb8f1f', low: '#8f6b14',
    side: ['rgba(50,36,0,0.26)', 'rgba(40,28,0,0.42)'], edge: 'rgba(60,44,6,0.6)', glint: 'rgba(255,246,205,0.62)',
    slot: '#2a210a', slotHi: 'rgba(255,240,190,0.35)', ink: 'rgba(30,26,14,0.86)', inkHi: 'rgba(255,240,190,0.4)',
    bezel: ['#2a2c2e', '#141516'], bezelShade: '0,0,0', recess: '#0c0d0d', socket: '#1e1808',
    screw: ['#f2ecd8', '#a8a088', '#5a5440'], dirt: ['90,70,20', '30,25,10'], key: '#ebe6da',
  },
  // grafit / soluk metal gri / eskimiş bordo
  grafit: {
    hi: '#4c5554', top: '#414948', face: '#343b3a', mid: '#2c3231', low: '#1f2423',
    side: ['rgba(0,0,0,0.26)', 'rgba(0,0,0,0.44)'], edge: 'rgba(0,0,0,0.8)', glint: 'rgba(220,235,230,0.22)',
    slot: '#0b0e0d', slotHi: 'rgba(220,235,230,0.1)', ink: 'rgba(214,222,216,0.6)', inkHi: 'rgba(0,0,0,0.6)',
    bezel: ['#2a2f2e', '#161a19'], bezelShade: '0,0,0', recess: '#0c0e0e', socket: '#0a0c0c',
    screw: ['#9aa29f', '#525a58', '#222827'], dirt: ['70,72,64', '0,0,0'], key: '#cfd3cc',
  },
  metal: {
    hi: '#a9b0a9', top: '#9aa19a', face: '#89918a', mid: '#7c847d', low: '#646b65',
    side: ['rgba(20,24,22,0.26)', 'rgba(14,18,16,0.4)'], edge: 'rgba(30,34,32,0.6)', glint: 'rgba(255,255,250,0.5)',
    slot: '#202523', slotHi: 'rgba(255,255,250,0.3)', ink: 'rgba(26,30,28,0.8)', inkHi: 'rgba(255,255,250,0.28)',
    bezel: ['#2a2e2d', '#151817'], bezelShade: '0,0,0', recess: '#0c0e0d', socket: '#1a1d1c',
    screw: ['#e2e6e0', '#9aa19a', '#545a55'], dirt: ['60,62,54', '40,44,40'], key: '#d6d9d2',
  },
  bordo: {
    hi: '#7a3a31', top: '#6a322a', face: '#572923', mid: '#4a221d', low: '#341815',
    side: ['rgba(20,2,0,0.3)', 'rgba(14,0,0,0.46)'], edge: 'rgba(20,4,2,0.75)', glint: 'rgba(255,210,195,0.3)',
    slot: '#160806', slotHi: 'rgba(255,200,185,0.16)', ink: 'rgba(240,226,218,0.78)', inkHi: 'rgba(30,0,0,0.5)',
    bezel: ['#2a2c2e', '#131415'], bezelShade: '0,0,0', recess: '#0b0c0c', socket: '#130605',
    screw: ['#b9b6b2', '#5e5a56', '#221f1d'], dirt: ['50,20,14', '0,0,0'], key: '#d9d4cc',
  },
  siyah: {
    hi: '#46494a', top: '#35383a', face: '#232627', mid: '#1c1e1f', low: '#141516',
    side: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.45)'], edge: 'rgba(0,0,0,0.85)', glint: 'rgba(255,255,255,0.2)',
    slot: '#050606', slotHi: 'rgba(255,255,255,0.1)', ink: 'rgba(205,210,206,0.6)', inkHi: 'rgba(0,0,0,0.7)',
    bezel: ['#2c2f30', '#17191a'], bezelShade: '0,0,0', recess: '#0c0d0d', socket: '#080909',
    screw: ['#8a8e8c', '#4a4e4d', '#202222'], dirt: ['70,72,70', '0,0,0'], key: '#c9ccc8',
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

// Kasa: üst eğimli yüz, ön yüz, yuvarlak köşeler, kenar parlaması ve gölge.
export function box(x, p, px, py, w, h, { top = 30, radius = 22 } = {}) {
  x.fillStyle = 'rgba(0,0,0,0.35)';
  rr(x, px + 6, py + 10, w, h, radius); x.fill();
  x.fillStyle = lg(x, 0, py - top, 0, py + 4, [[0, p.hi], [1, p.top]]);
  x.beginPath();
  x.moveTo(px + 18, py - top); x.lineTo(px + w - 18, py - top); x.lineTo(px + w, py + 4); x.lineTo(px, py + 4);
  x.closePath(); x.fill();
  x.fillStyle = lg(x, 0, py, 0, py + h, [[0, p.face], [0.6, p.mid], [1, p.low]]);
  rr(x, px, py, w, h, radius); x.fill();
  x.fillStyle = lg(x, px, 0, px + w, 0, [[0, p.side[0]], [0.12, 'rgba(0,0,0,0)'], [0.88, 'rgba(0,0,0,0)'], [1, p.side[1]]]);
  rr(x, px, py, w, h, radius); x.fill();
  x.fillStyle = p.glint;
  x.fillRect(px + radius * 0.6, py + 2, w - radius * 1.2, 2.5);
  x.strokeStyle = p.edge; x.lineWidth = 2;
  rr(x, px, py, w, h, radius); x.stroke();
}

// Tüp ekran çerçevesi: kalın bezel, içe doğru eğimli koyu yuva.
// hood: üstte ve yanlarda gövde renginde, gölge düşüren siperlik.
export function bezel(x, p, r, { pad = 34, radius = 30, hood = false } = {}) {
  const ox = r.x - pad, oy = r.y - pad, ow = r.w + pad * 2, oh = r.h + pad * 2;
  if (hood) {
    const hp = Math.round(pad * 0.4);
    x.fillStyle = 'rgba(0,0,0,0.45)'; rr(x, ox - hp + 4, oy - hp + 8, ow + hp * 2, oh * 0.74, radius + hp); x.fill();
    x.fillStyle = lg(x, 0, oy - hp, 0, oy + oh * 0.74, [[0, p.hi], [0.5, p.top], [1, p.mid]]);
    rr(x, ox - hp, oy - hp, ow + hp * 2, oh * 0.74, radius + hp); x.fill();
    x.fillStyle = p.glint; x.fillRect(ox - hp + radius, oy - hp + 2, ow + hp * 2 - radius * 2, 2.5);
    x.strokeStyle = p.edge; x.lineWidth = 2; rr(x, ox - hp, oy - hp, ow + hp * 2, oh * 0.74, radius + hp); x.stroke();
  }
  x.fillStyle = lg(x, 0, oy, 0, oy + oh, [[0, p.bezel[0]], [1, p.bezel[1]]]);
  rr(x, ox, oy, ow, oh, radius); x.fill();
  for (let i = 0; i < 14; i++) {
    const k = i / 14, inset = pad * 0.35 + k * pad * 0.62;
    x.strokeStyle = `rgba(${p.bezelShade},${0.04 + k * 0.08})`;
    x.lineWidth = 3;
    rr(x, ox + inset, oy + inset, ow - inset * 2, oh - inset * 2, radius * (1 - k * 0.5)); x.stroke();
  }
  x.fillStyle = p.recess;
  rr(x, r.x - 10, r.y - 10, r.w + 20, r.h + 20, 18); x.fill();
  x.fillStyle = '#060706';
  rr(x, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 14); x.fill();
  x.strokeStyle = p.glint; x.lineWidth = 2;
  x.beginPath(); x.moveTo(ox + radius, oy + 2); x.lineTo(ox + ow - radius, oy + 2); x.stroke();
}

export function knob(x, kx, ky, r = 28) {
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

// Kir, yıpranma ve gren (gövde çiziminin son adımı).
export function weather(x, W, H, p, { from = 0, dirt = true } = {}) {
  const R = seeded(77);
  x.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < (dirt ? 70 : 0); i++) {
    const px = R() * W, py = from + R() * (H - from), r = 30 + R() * 200;
    const d = p.dirt[R() < 0.5 ? 0 : 1];
    x.fillStyle = rg(x, px, py, 0, px, py, r, [[0, `rgba(${d},${0.04 + R() * 0.07})`], [1, 'rgba(0,0,0,0)']]);
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  x.globalCompositeOperation = 'source-over';
  grain(x, W, H, 8, 41);
}
