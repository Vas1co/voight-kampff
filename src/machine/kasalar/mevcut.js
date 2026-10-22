// Mevcut kasa: üç modül yan yana (sol monitör, ortada CRT, sağ monitör), körük
// orta modülün üstünde, sağda metal kolun ucunda kayıt kamerası. Modüller düz
// önlü alçak bir kaidenin üstüne oturur.
// Renk şeması tek yerden seçilir: VARSAYILAN_RENK (geliştirirken adres çubuğunda ?renk=<ad>).
// "terminal" şemalarında 80'ler ayrıntıları var: ortada ekran siperliği, yan modüllerin
// altında koyu bant, rozet; her modülün üst şeridinde üretici logosu ve ünite adı,
// LED çubuğu orta modülün altındaki yuvada. "wear" yıpranmış metal görünümü verir.
import { lg, rg, rr, seeded } from '../../scene/paint.js';
import { t } from '../../core/strings.js';
import { PAL, TAU, label, screw, slots, box, bezel, knob, weather } from './ortak.js';

export const L = {
  left: { x: 104, y: 612, w: 488, h: 372 },
  right: { x: 1456, y: 612, w: 488, h: 372 },
  crt: { x: 700, y: 572, w: 580, h: 332 },
  led: { x: 750, y: 1103, w: 320, h: 20 },   // orta modülün alt yuvası
  bellows: { x: 700, y: 100, w: 640, h: 350 },
  intake: { x: 881, y: 235 },
  keys: [{ x: 1344, y: 742 }, { x: 1344, y: 806 }, { x: 1344, y: 870 }],
  keySize: { w: 52, h: 50 },
  alarm: { x: 128, y: 1046, w: 300, h: 34 },
  stressLamp: { x: 540, y: 1064 },
  recLamp: { x: 1846, y: 214 },
  calLamp: { x: 1510, y: 1064 },
};

export const RENKLER = {
  kirmizi80: { name: 'Hepsi kırmızı', center: 'kirmizi', sides: 'kirmizi', arm: 'kirmizi', terminal: true },
  kirmiziGri: { name: 'Orta kırmızı · yanlar gri', center: 'kirmizi', sides: 'gri', arm: 'kirmizi', terminal: true },
  griKirmizi: { name: 'Orta gri · yanlar kırmızı', center: 'gri', sides: 'kirmizi', arm: 'gri', terminal: true },
  sari: { name: 'Hepsi sarı', center: 'sari', sides: 'sari', arm: 'sari', terminal: true },
  sariGri: { name: 'Orta sarı · yanlar gri', center: 'sari', sides: 'gri', arm: 'sari', terminal: true },
  griSari: { name: 'Orta gri · yanlar sarı', center: 'gri', sides: 'sari', arm: 'gri', terminal: true },
  siyah80: { name: 'Hepsi siyah', center: 'siyah', sides: 'siyah', arm: 'siyah', terminal: true },
  beyaz80: { name: 'Hepsi beyaz', center: 'beyaz', sides: 'beyaz', arm: 'beyaz', terminal: true, wear: 1 },
  beyazTemiz: { name: 'Hepsi beyaz · temiz', center: 'beyaz', sides: 'beyaz', arm: 'beyaz', terminal: true, clean: true },
  // gövde grafit, orta soluk metal gri, yanlar eskimiş bordo; fosforlu olmayan CRT yeşili, az amber
  grafitBordo: { name: 'Grafit · metal gri · bordo', center: 'metal', sides: 'bordo', base: 'grafit', arm: 'metal', terminal: true, ink: '#54b99a', amber: '#d5ad63' },
  kirmizisiyah: { name: 'Orta kırmızı · yanlar siyah', center: 'kirmizi', sides: 'siyah', arm: 'kirmizi' },
  grisiyah: { name: 'Orta gri · yanlar siyah', center: 'gri', sides: 'siyah', arm: 'gri' },
};
const VARSAYILAN_RENK = 'beyaz80';
const fromUrl = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('renk') : null;
export const RENK_NAME = RENKLER[fromUrl] ? fromUrl : VARSAYILAN_RENK;
export const RENK = RENKLER[RENK_NAME];

// Yan modülün alt kısmındaki koyu bant (80'ler terminal); lambalar ve düğmeler üstünde.
const TRIM_Y = 1030;
function trim(x, px) {
  x.save();
  rr(x, px, 540, 620, 610, 22); x.clip();
  x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(px, TRIM_Y - 4, 620, 4);
  x.fillStyle = lg(x, 0, TRIM_Y, 0, 1150, [[0, '#2e3033'], [1, '#141516']]);
  x.fillRect(px, TRIM_Y, 620, 1150 - TRIM_Y);
  x.fillStyle = 'rgba(255,255,255,0.13)'; x.fillRect(px, TRIM_Y, 620, 2);
  x.restore();
}

// Üretici logosu: eğik kalın yazı ve yanında üç eğik şerit. Genişliğini döndürür.
function logo(x, px, py, size, ink) {
  const name = t('kasa.maker');
  x.save();
  x.font = `italic 600 ${size}px "Source Sans 3", sans-serif`;
  x.textBaseline = 'middle';
  if ('letterSpacing' in x) x.letterSpacing = `${size * 0.02}px`;
  x.fillStyle = ink; x.strokeStyle = ink; x.lineWidth = size * 0.06;
  x.fillText(name, px, py); x.strokeText(name, px, py);
  const w = x.measureText(name).width;
  const h = size * 0.56, sw = size * 0.2, sk = h * 0.42;
  let sx = px + w + size * 0.22;
  for (const c of ['#c43a2f', '#c43a2f', '#3b5ba8']) {
    x.fillStyle = c;
    x.beginPath(); x.moveTo(sx + sk, py - h / 2); x.lineTo(sx + sk + sw, py - h / 2); x.lineTo(sx + sw, py + h / 2); x.lineTo(sx, py + h / 2); x.closePath(); x.fill();
    sx += sw + size * 0.07;
  }
  x.restore();
  return sx - px;
}

// Logonun genişliği (yazı + şeritler), ortalamak için.
function logoWidth(x, size) {
  x.save();
  x.font = `italic 600 ${size}px "Source Sans 3", sans-serif`;
  if ('letterSpacing' in x) x.letterSpacing = `${size * 0.02}px`;
  const w = x.measureText(t('kasa.maker')).width;
  x.restore();
  return w + size * 0.22 + 3 * size * 0.27;
}

// Modülün üst şeridi: solda logo, sağda ünite adı.
function header(x, p, x0, x1, y, unit, size = 30) {
  logo(x, x0, y, size, p.ink);
  label(x, p, unit, x1, y, { size: 16, align: 'right', spacing: 0.3 });
}

// Yıpranmış metal: kenar sıyrıkları, çizikler, yukarıdan akan kir izleri.
function wear(x, rects, k = 1, seed = 31) {
  const R = seeded(seed);
  x.save();
  x.globalCompositeOperation = 'source-atop';
  for (const [px, py, w, h] of rects) {
    // kir izleri
    for (let i = 0; i < 10 * k; i++) {
      const sx = px + R() * w, sw = 6 + R() * 26, sh = 40 + R() * h * 0.6, sy = py + R() * h * 0.3;
      x.fillStyle = lg(x, 0, sy, 0, sy + sh, [[0, `rgba(60,52,40,${0.05 + R() * 0.07})`], [1, 'rgba(60,52,40,0)']]);
      x.fillRect(sx, sy, sw, sh);
    }
    // kenar sıyrıkları (boya kalkmış koyu metal)
    for (let i = 0; i < 60 * k; i++) {
      const side = Math.floor(R() * 4);
      const ex = side === 0 ? px + R() * 10 : side === 1 ? px + w - R() * 10 : px + R() * w;
      const ey = side === 2 ? py + R() * 10 : side === 3 ? py + h - R() * 10 : py + R() * h;
      x.fillStyle = `rgba(${R() < 0.6 ? '58,56,52' : '120,112,98'},${0.25 + R() * 0.45})`;
      x.beginPath(); x.ellipse(ex, ey, 1 + R() * 5, 1 + R() * 3, R() * 3, 0, TAU); x.fill();
    }
    // çizikler
    for (let i = 0; i < 40 * k; i++) {
      const sx = px + R() * w, sy = py + R() * h, l = 6 + R() * 50, a = (R() - 0.5) * 1.2;
      x.strokeStyle = R() < 0.5 ? 'rgba(255,255,250,0.22)' : 'rgba(40,38,34,0.16)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l); x.stroke();
    }
  }
  x.restore();
}

export default {
  name: 'Mevcut',
  tint: '#f4f3f1',
  L,
  key: RENK.terminal ? '#e6e2da' : PAL[RENK.center].key,
  paint(x, W, H, renk = RENK) {
    const PB = PAL[renk.base ?? 'siyah'], PS = PAL[renk.sides], PC = PAL[renk.center], PA = PAL[renk.arm];
    const T = !!renk.terminal;
    // koyu bant üstündeki yazılar her zaman açık renk
    const DARK = { ink: 'rgba(235,232,226,0.72)', inkHi: 'rgba(0,0,0,0.6)' };
    const lampInk = T ? DARK : PS;

    // kaide: düz önlü alçak kutu, üst yüzü modüllerin altında, altında kauçuk ayaklar
    x.fillStyle = 'rgba(0,0,0,0.5)'; rr(x, 36, 1172, W - 66, 104, 12); x.fill();
    x.fillStyle = lg(x, 0, 1140, 0, 1160, [[0, PB.hi], [1, PB.top]]);
    x.beginPath(); x.moveTo(46, 1140); x.lineTo(W - 46, 1140); x.lineTo(W - 28, 1160); x.lineTo(28, 1160); x.closePath(); x.fill();
    x.fillStyle = lg(x, 0, 1158, 0, 1258, [[0, PB.face], [0.55, PB.mid], [1, PB.low]]);
    rr(x, 28, 1158, W - 56, 100, 10); x.fill();
    x.fillStyle = PB.glint; x.fillRect(40, 1160, W - 80, 2);
    x.strokeStyle = PB.edge; x.lineWidth = 2; rr(x, 28, 1158, W - 56, 100, 10); x.stroke();
    for (const fx of [110, 640, W - 780, W - 250]) {
      x.fillStyle = '#070808'; rr(x, fx, 1254, 140, 24, 6); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(fx + 6, 1256, 128, 2);
    }
    slots(x, PB, 90, 1184, 340, 46, 16);
    slots(x, PB, W - 430, 1184, 340, 46, 16);
    if (T) {
      // logo + makine adı, birlikte ortalı
      const text = `${t('kasa.machine')}  ${t('kasa.model')}`;
      x.save(); x.font = '600 22px "Plex Mono", monospace'; if ('letterSpacing' in x) x.letterSpacing = `${22 * 0.32}px`;
      const tw = x.measureText(text).width; x.restore();
      const lw = logoWidth(x, 34), x0 = W / 2 - (lw + 36 + tw) / 2;
      logo(x, x0, 1208, 34, 'rgba(150,150,146,0.75)');
      label(x, PB, text, x0 + lw + 36, 1208, { size: 22, spacing: 0.32 });
    } else {
      label(x, PB, `${t('kasa.machine')}  ${t('kasa.model')}`, W / 2, 1208, { size: 22, align: 'center', spacing: 0.32 });
    }

    // sol modül
    box(x, PS, 40, 540, 620, 610, { top: 30, radius: 22 });
    bezel(x, PS, L.left);
    if (T) trim(x, 40);
    if (T) header(x, PS, 96, 606, 562, t('kasa.unitLeft'), 26);
    else { label(x, PS, t('kasa.panelLeft'), 300, 567, { size: 18 }); slots(x, PS, 80, 556, 200, 20, 10, false); }
    screw(x, PS, 66, 566); screw(x, PS, 634, 566); screw(x, PS, 66, 1124); screw(x, PS, 634, 1124);
    x.fillStyle = PS.socket; rr(x, L.alarm.x - 12, L.alarm.y - 9, L.alarm.w + 24, L.alarm.h + 18, 8); x.fill();
    x.fillStyle = PS.socket; x.beginPath(); x.arc(L.stressLamp.x, L.stressLamp.y, 22, 0, TAU); x.fill();
    if (T) {
      label(x, lampInk, t('kasa.anomaly'), L.alarm.x - 4, 1112, { size: 15 });
      label(x, lampInk, t('kasa.stress'), L.stressLamp.x, 1112, { size: 15, align: 'center' });
    } else {
      label(x, PS, t('kasa.anomaly'), L.alarm.x - 4, L.alarm.y - 26, { size: 15 });
      label(x, PS, t('kasa.stress'), L.stressLamp.x, L.stressLamp.y - 42, { size: 15, align: 'center' });
    }

    // sağ modül
    box(x, PS, 1388, 540, 620, 610, { top: 30, radius: 22 });
    bezel(x, PS, L.right);
    if (T) trim(x, 1388);
    if (T) header(x, PS, 1444, 1862, 562, t('kasa.unitRight'), 26);
    else { label(x, PS, t('kasa.panelRight'), 1436, 567, { size: 18 }); slots(x, PS, 1760, 556, 200, 20, 10, false); }
    screw(x, PS, 1414, 566); screw(x, PS, 1982, 566); screw(x, PS, 1414, 1124); screw(x, PS, 1982, 1124);
    x.fillStyle = PS.socket; x.beginPath(); x.arc(L.calLamp.x, L.calLamp.y, 17, 0, TAU); x.fill();
    label(x, lampInk, t('kasa.calib'), L.calLamp.x + 32, L.calLamp.y, { size: 15 });
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
    x.fillStyle = 'rgba(0,0,0,0.3)'; rr(x, 1778, 162, 182, 116, 16); x.fill();
    x.fillStyle = lg(x, 0, 156, 0, 272, [[0, PA.hi], [1, PA.low]]); rr(x, 1774, 156, 182, 116, 16); x.fill();
    x.strokeStyle = PA.edge; x.lineWidth = 2; rr(x, 1774, 156, 182, 116, 16); x.stroke();
    x.fillStyle = '#0b0c0b'; x.beginPath(); x.arc(1832, 214, 32, 0, TAU); x.fill();
    x.strokeStyle = PA.glint; x.lineWidth = 3; x.stroke();
    x.fillStyle = rg(x, 1824, 204, 0, 1832, 214, 26, [[0, 'rgba(160,200,200,0.5)'], [0.4, 'rgba(40,60,60,0.4)'], [1, 'rgba(0,0,0,0)']]);
    x.beginPath(); x.arc(1832, 214, 26, 0, TAU); x.fill();
    x.lineCap = 'butt';

    // orta modül (CRT)
    box(x, PC, 628, 452, 792, 698, { top: 28, radius: 26 });
    x.fillStyle = lg(x, 0, 418, 0, 452, [[0, '#3a3d3e'], [1, '#151617']]);
    rr(x, 690, 418, 668, 34, 8); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(704, 420, 640, 2);
    bezel(x, PC, L.crt, { pad: 44, radius: 40, hood: T });
    if (T) header(x, PC, 684, 1380, 484, t('kasa.unitCenter'));
    x.fillStyle = '#0a0b0b'; rr(x, L.led.x - 10, L.led.y - 7, L.led.w + 20, L.led.h + 14, 5); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(L.led.x - 8, L.led.y + L.led.h + 7, L.led.w + 16, 1.5);
    for (let r = 0; r < 7; r++) for (let q = 0; q < 3; q++) {
      x.fillStyle = PC.slot; x.beginPath(); x.arc(1354 + q * 16, 584 + r * 20, 4.2, 0, TAU); x.fill();
    }
    for (const k of L.keys) { x.fillStyle = PC.slot; rr(x, k.x - 6, k.y - 6, L.keySize.w + 12, L.keySize.h + 12, 7); x.fill(); }
    label(x, PC, `${t('kasa.channel')} 06`, L.crt.x - 6, 972, { size: 17 });
    label(x, PC, t('kasa.focus'), L.crt.x + L.crt.w + 6, 972, { size: 17, align: 'right' });
    slots(x, PC, 760, 1006, 520, 72, 24);
    x.fillStyle = PC.socket; rr(x, 660, 1100, 60, 28, 6); x.fill();
    if (T) {
      // çıkarma düğmesi
      x.fillStyle = lg(x, 0, 1102, 0, 1124, [[0, '#d9d6cf'], [1, '#8f8c86']]); rr(x, 1100, 1104, 50, 18, 4); x.fill();
      // renk şeritli rozet
      x.fillStyle = '#1b1c1d'; rr(x, 1196, 1098, 150, 30, 3); x.fill();
      ['#e0a43a', '#d9cf5a', '#6bb07c', '#5a8fbf'].forEach((c, i) => { x.fillStyle = c; x.fillRect(1206 + i * 16, 1106, 12, 14); });
      label(x, DARK, t('kasa.model'), 1336, 1113, { size: 13, align: 'right', spacing: 0.12 });
    }
    screw(x, PC, 652, 474); screw(x, PC, 1396, 474); screw(x, PC, 652, 1124); screw(x, PC, 1396, 1124);

    // kablo
    x.strokeStyle = '#141412'; x.lineWidth = 16;
    x.beginPath(); x.moveTo(40, 1236); x.bezierCurveTo(16, 1250, 4, 1268, -10, 1280); x.stroke();

    if (renk.wear) wear(x, [[40, 540, 620, 490], [1388, 540, 620, 490], [628, 452, 792, 698], [1774, 156, 182, 116], [28, 1158, W - 56, 100]], renk.wear);
    weather(x, W, H, PC, { from: 320, dirt: !renk.clean });
  },
};
