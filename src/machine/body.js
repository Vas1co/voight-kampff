// Makine gövdesi (prosedürel yer tutucu). Üç modül, kalın çerçeveli tüp ekranlar,
// havalandırma yarıkları, kalıp çizgileri, metal sensör kolu. Dinamik parçalar
// (ekranlar, LED'ler, körük) ayrı katmanlar olarak bunun üstüne oturur.
//
// Renk şeması tek yerden seçilir: SCHEME = SCHEMES.<ad>
//   grisiyah: orta modül orta gri, yan monitörler ve taban siyah
//   krem:     90'lar krem plastik (önceki görünüm)
import { mk, rr, lg, rg, grain, seeded } from '../scene/paint.js';
import { BODY, L } from './layout.js';
import { t } from '../core/strings.js';

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
};

export const SCHEMES = {
  grisiyah: { center: 'gri', sides: 'siyah', base: 'siyah', arm: 'gri', tint: '#f2f4f3' },
  krem: { center: 'krem', sides: 'krem', base: 'krem', arm: 'krem', tint: '#fff0d6' },
};
export const SCHEME_NAME = 'grisiyah';
export const SCHEME = SCHEMES[SCHEME_NAME];
let active = SCHEME; // çizim sırasında kullanılan şema (dışa aktarımda değişebilir)
const pal = (part) => PALETTES[active[part]];

function label(x, p, text, px, py, { size = 18, align = 'left', spacing = 0.22, weight = 600 } = {}) {
  x.save();
  x.font = `${weight} ${size}px "Plex Mono", ui-monospace, monospace`;
  x.textAlign = align; x.textBaseline = 'middle';
  if ('letterSpacing' in x) x.letterSpacing = `${spacing * size}px`;
  x.fillStyle = p.inkHi; x.fillText(text, px, py + 1.2);
  x.fillStyle = p.ink; x.fillText(text, px, py);
  x.restore();
}

function screw(x, p, px, py, r = 7) {
  x.fillStyle = rg(x, px - 2, py - 2, 0, px, py, r, [[0, p.screw[0]], [0.6, p.screw[1]], [1, p.screw[2]]]);
  x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
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

// Kasa: üst eğimli yüz, ön yüz, yuvarlak köşeler, kenar parlaması ve gölge.
function casing(x, p, px, py, w, h, { top = 30, radius = 22 } = {}) {
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
function screenBezel(x, p, r, { pad = 34, radius = 30 } = {}) {
  const ox = r.x - pad, oy = r.y - pad, ow = r.w + pad * 2, oh = r.h + pad * 2;
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

function knob(x, kx, ky, r = 28) {
  x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.arc(kx + 3, ky + 5, r, 0, Math.PI * 2); x.fill();
  x.fillStyle = rg(x, kx - r * 0.3, ky - r * 0.3, 2, kx, ky, r, [[0, '#5a5c5a'], [0.7, '#2a2c2b'], [1, '#121312']]);
  x.beginPath(); x.arc(kx, ky, r, 0, Math.PI * 2); x.fill();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    x.strokeStyle = 'rgba(255,255,255,0.1)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(kx + Math.cos(a) * r * 0.82, ky + Math.sin(a) * r * 0.82); x.lineTo(kx + Math.cos(a) * r, ky + Math.sin(a) * r); x.stroke();
  }
  x.strokeStyle = '#e6e8e4'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(kx, ky); x.lineTo(kx + r * 0.45, ky - r * 0.7); x.stroke();
}

function casingSmall(x, p, px, py, w, h) {
  x.fillStyle = 'rgba(0,0,0,0.3)'; rr(x, px + 4, py + 6, w, h, 16); x.fill();
  x.fillStyle = lg(x, 0, py, 0, py + h, [[0, p.hi], [1, p.low]]);
  rr(x, px, py, w, h, 16); x.fill();
  x.strokeStyle = p.edge; x.lineWidth = 2; rr(x, px, py, w, h, 16); x.stroke();
}

export function paintBody(name = SCHEME_NAME) {
  active = SCHEMES[name];
  const { W, H } = BODY;
  const c = mk(W, H), x = c.getContext('2d');
  const PB = pal('base'), PS = pal('sides'), PC = pal('center'), PA = pal('arm');

  // taban
  x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillRect(30, 1176, W - 60, 100);
  x.fillStyle = lg(x, 0, 1150, 0, 1176, [[0, PB.top], [1, PB.mid]]);
  x.beginPath(); x.moveTo(40, 1150); x.lineTo(W - 40, 1150); x.lineTo(W - 22, 1176); x.lineTo(22, 1176); x.closePath(); x.fill();
  x.fillStyle = lg(x, 0, 1176, 0, H, [[0, PB.mid], [1, PB.low]]);
  x.fillRect(22, 1176, W - 44, H - 1180);
  slots(x, PB, 90, 1196, 340, 46, 16);
  slots(x, PB, W - 430, 1196, 340, 46, 16);
  label(x, PB, `${t('brand.machine')}  ${t('brand.model')}`, W / 2, 1222, { size: 22, align: 'center', spacing: 0.32 });

  // sol modül
  casing(x, PS, 40, 540, 620, 610);
  screenBezel(x, PS, L.left);
  label(x, PS, t('machine.panelLeft'), 300, 567, { size: 18 });
  slots(x, PS, 80, 556, 200, 20, 10, false);
  screw(x, PS, 66, 566); screw(x, PS, 634, 566); screw(x, PS, 66, 1124); screw(x, PS, 634, 1124);
  x.fillStyle = PS.socket; rr(x, L.alarm.x - 12, L.alarm.y - 9, L.alarm.w + 24, L.alarm.h + 18, 8); x.fill();
  label(x, PS, t('machine.anomaly'), L.alarm.x - 4, L.alarm.y - 26, { size: 15 });
  x.fillStyle = PS.socket; x.beginPath(); x.arc(L.stressLamp.x, L.stressLamp.y, 22, 0, Math.PI * 2); x.fill();
  label(x, PS, t('machine.stress'), L.stressLamp.x, L.stressLamp.y - 42, { size: 15, align: 'center' });

  // sağ modül
  casing(x, PS, 1388, 540, 620, 610);
  screenBezel(x, PS, L.right);
  label(x, PS, t('machine.panelRight'), 1436, 567, { size: 18 });
  slots(x, PS, 1760, 556, 200, 20, 10, false);
  screw(x, PS, 1414, 566); screw(x, PS, 1982, 566); screw(x, PS, 1414, 1124); screw(x, PS, 1982, 1124);
  x.fillStyle = PS.socket; x.beginPath(); x.arc(L.calLamp.x, L.calLamp.y, 17, 0, Math.PI * 2); x.fill();
  label(x, PS, t('machine.calib'), L.calLamp.x + 32, L.calLamp.y, { size: 15 });
  knob(x, 1770, 1066); knob(x, 1890, 1066);

  // sensör kolu
  x.lineCap = 'round';
  x.strokeStyle = lg(x, 1880, 0, 1960, 0, [[0, '#1b1d1b'], [0.5, '#5d605b'], [1, '#1b1d1b']]);
  x.lineWidth = 24;
  x.beginPath(); x.moveTo(1900, 548); x.lineTo(1940, 382); x.lineTo(1880, 252); x.stroke();
  for (const [jx, jy] of [[1940, 382], [1900, 548]]) {
    x.fillStyle = rg(x, jx - 5, jy - 5, 2, jx, jy, 20, [[0, PA.hi], [1, PA.low]]);
    x.beginPath(); x.arc(jx, jy, 20, 0, Math.PI * 2); x.fill();
  }
  casingSmall(x, PA, 1774, 156, 182, 116);
  x.fillStyle = '#0b0c0b'; x.beginPath(); x.arc(1832, 214, 32, 0, Math.PI * 2); x.fill();
  x.strokeStyle = PA.glint; x.lineWidth = 3; x.stroke();
  x.fillStyle = rg(x, 1824, 204, 0, 1832, 214, 26, [[0, 'rgba(160,200,200,0.5)'], [0.4, 'rgba(40,60,60,0.4)'], [1, 'rgba(0,0,0,0)']]);
  x.beginPath(); x.arc(1832, 214, 26, 0, Math.PI * 2); x.fill();
  x.lineCap = 'butt';

  // orta modül (CRT): yan modüllerden biraz yüksek ve geniş, kenarları onların önüne biner
  casing(x, PC, 628, 452, 792, 698, { top: 28, radius: 26 });
  // körük kaidesi (körük üstte ayrı katman)
  x.fillStyle = lg(x, 0, 418, 0, 452, [[0, '#3a3d3e'], [1, '#151617']]);
  rr(x, 690, 418, 668, 34, 8); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(704, 420, 640, 2);
  // LED çubuğu yuvası
  x.fillStyle = PC.socket; rr(x, L.led.x - 14, L.led.y - 11, L.led.w + 28, L.led.h + 22, 8); x.fill();
  // CRT çerçevesi
  screenBezel(x, PC, L.crt, { pad: 44, radius: 40 });
  for (let r = 0; r < 7; r++) for (let q = 0; q < 3; q++) {
    x.fillStyle = PC.slot; x.beginPath(); x.arc(1354 + q * 16, 584 + r * 20, 4.2, 0, Math.PI * 2); x.fill();
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

  // kir ve yıpranma
  const R = seeded(77);
  x.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 70; i++) {
    const px = R() * W, py = 320 + R() * 960, r = 30 + R() * 200;
    const d = PC.dirt[R() < 0.5 ? 0 : 1];
    x.fillStyle = rg(x, px, py, 0, px, py, r, [[0, `rgba(${d},${0.04 + R() * 0.07})`], [1, 'rgba(0,0,0,0)']]);
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  x.globalCompositeOperation = 'source-over';
  grain(x, W, H, 8, 41);
  active = SCHEME;
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
