// Makine gövdesi (prosedürel yer tutucu): 90'lar krem rengi plastik kasalar.
// Üç modül, kalın çerçeveli tüp ekranlar, havalandırma yarıkları, kalıp çizgileri,
// hafif sararmış plastik, metal sensör kolu. Dinamik parçalar (ekranlar, LED'ler,
// körük) ayrı katmanlar olarak bunun üstüne oturur.
import { mk, rr, lg, rg, grain, seeded } from '../scene/paint.js';
import { BODY, L } from './layout.js';
import { t } from '../core/strings.js';

// krem plastik paleti
const P = {
  hi: '#efe7d2', top: '#e4dbc2', face: '#d6cbaf', mid: '#c7bb9c', low: '#a99d7f', shade: '#857a5f',
  seam: 'rgba(90,78,52,0.55)', dark: '#1a1c1a', recess: '#2b2b26',
};

function label(x, text, px, py, { size = 18, align = 'left', spacing = 0.22, weight = 600, color = 'rgba(70,62,44,0.78)' } = {}) {
  x.save();
  x.font = `${weight} ${size}px "Plex Mono", ui-monospace, monospace`;
  x.textAlign = align; x.textBaseline = 'middle';
  if ('letterSpacing' in x) x.letterSpacing = `${spacing * size}px`;
  x.fillStyle = 'rgba(255,250,235,0.45)'; x.fillText(text, px, py + 1.2);
  x.fillStyle = color; x.fillText(text, px, py);
  x.restore();
}

function screw(x, px, py, r = 7) {
  x.fillStyle = rg(x, px - 2, py - 2, 0, px, py, r, [[0, '#f2ead6'], [0.6, '#b7ab8d'], [1, '#6f6550']]);
  x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(60,52,36,0.7)'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(px - r * 0.6, py - r * 0.3); x.lineTo(px + r * 0.6, py + r * 0.3); x.stroke();
}

// Kalıplanmış yarıklar (krem yüzeyde koyu, alt kenarı ışıklı).
function slots(x, px, py, w, h, n, vertical = true) {
  for (let i = 0; i < n; i++) {
    if (vertical) {
      const sx = px + (i * w) / n, sw = (w / n) * 0.42;
      x.fillStyle = '#3a352a'; rr(x, sx, py, sw, h, sw / 2); x.fill();
      x.fillStyle = 'rgba(255,250,235,0.5)'; x.fillRect(sx + 1, py + h, sw - 2, 2);
    } else {
      const sy = py + (i * h) / n, sh = (h / n) * 0.42;
      x.fillStyle = '#3a352a'; rr(x, px, sy, w, sh, sh / 2); x.fill();
      x.fillStyle = 'rgba(255,250,235,0.5)'; x.fillRect(px, sy + sh, w, 2);
    }
  }
}

// Krem kasa: üst eğimli yüz, ön yüz, yuvarlak köşeler, kenar parlaması ve gölge.
function casing(x, px, py, w, h, { top = 30, radius = 22 } = {}) {
  // alt gölge
  x.fillStyle = 'rgba(0,0,0,0.35)';
  rr(x, px + 6, py + 10, w, h, radius); x.fill();
  // üst yüz
  x.fillStyle = lg(x, 0, py - top, 0, py + 4, [[0, P.hi], [1, P.top]]);
  x.beginPath();
  x.moveTo(px + 18, py - top); x.lineTo(px + w - 18, py - top); x.lineTo(px + w, py + 4); x.lineTo(px, py + 4);
  x.closePath(); x.fill();
  // ön yüz
  x.fillStyle = lg(x, 0, py, 0, py + h, [[0, P.face], [0.6, P.mid], [1, P.low]]);
  rr(x, px, py, w, h, radius); x.fill();
  // yanlardan hafif kararma (hacim)
  x.fillStyle = lg(x, px, 0, px + w, 0, [[0, 'rgba(80,70,48,0.28)'], [0.12, 'rgba(80,70,48,0)'], [0.88, 'rgba(80,70,48,0)'], [1, 'rgba(60,52,36,0.4)']]);
  rr(x, px, py, w, h, radius); x.fill();
  // üst kenar parlaması
  x.fillStyle = 'rgba(255,252,240,0.7)';
  x.fillRect(px + radius * 0.6, py + 2, w - radius * 1.2, 2.5);
  x.strokeStyle = 'rgba(70,60,40,0.6)'; x.lineWidth = 2;
  rr(x, px, py, w, h, radius); x.stroke();
}

// Tüp ekran çerçevesi: kalın krem bezel, içe doğru eğimli koyu yuva.
function screenBezel(x, r, { pad = 34, radius = 30 } = {}) {
  const ox = r.x - pad, oy = r.y - pad, ow = r.w + pad * 2, oh = r.h + pad * 2;
  x.fillStyle = lg(x, 0, oy, 0, oy + oh, [[0, '#ded4ba'], [1, '#bfb393']]);
  rr(x, ox, oy, ow, oh, radius); x.fill();
  // içe eğim (iç kenara doğru koyulaşan halka)
  for (let i = 0; i < 14; i++) {
    const k = i / 14, inset = pad * 0.35 + k * pad * 0.62;
    x.strokeStyle = `rgba(40,36,26,${0.04 + k * 0.08})`;
    x.lineWidth = 3;
    rr(x, ox + inset, oy + inset, ow - inset * 2, oh - inset * 2, radius * (1 - k * 0.5)); x.stroke();
  }
  x.fillStyle = P.recess;
  rr(x, r.x - 10, r.y - 10, r.w + 20, r.h + 20, 18); x.fill();
  x.fillStyle = '#060706';
  rr(x, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 14); x.fill();
  // çerçevenin üst iç kenarında ışık
  x.strokeStyle = 'rgba(255,250,235,0.55)'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(ox + radius, oy + 2); x.lineTo(ox + ow - radius, oy + 2); x.stroke();
}

function knob(x, kx, ky, r = 28) {
  x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.arc(kx + 3, ky + 5, r, 0, Math.PI * 2); x.fill();
  x.fillStyle = rg(x, kx - r * 0.3, ky - r * 0.3, 2, kx, ky, r, [[0, '#4b4a44'], [0.7, '#262622'], [1, '#121210']]);
  x.beginPath(); x.arc(kx, ky, r, 0, Math.PI * 2); x.fill();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(kx + Math.cos(a) * r * 0.82, ky + Math.sin(a) * r * 0.82); x.lineTo(kx + Math.cos(a) * r, ky + Math.sin(a) * r); x.stroke();
  }
  x.strokeStyle = '#e9e1cb'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(kx, ky); x.lineTo(kx + r * 0.45, ky - r * 0.7); x.stroke();
}

export function paintBody() {
  const { W, H } = BODY;
  const c = mk(W, H), x = c.getContext('2d');

  // taban: daha koyu, gri-bej plastik ayaklık
  x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillRect(30, 1176, W - 60, 100);
  x.fillStyle = lg(x, 0, 1150, 0, 1176, [[0, '#cfc4a8'], [1, '#a59a7d']]);
  x.beginPath(); x.moveTo(40, 1150); x.lineTo(W - 40, 1150); x.lineTo(W - 22, 1176); x.lineTo(22, 1176); x.closePath(); x.fill();
  x.fillStyle = lg(x, 0, 1176, 0, H, [[0, '#9a8f73'], [1, '#5f5744']]);
  x.fillRect(22, 1176, W - 44, H - 1180);
  slots(x, 90, 1196, 340, 46, 16);
  slots(x, W - 430, 1196, 340, 46, 16);
  label(x, `${t('brand.machine')}  ${t('brand.model')}`, W / 2, 1222, { size: 22, align: 'center', spacing: 0.32, color: 'rgba(52,46,32,0.85)' });

  // sol modül
  casing(x, 40, 540, 620, 610);
  screenBezel(x, L.left);
  label(x, t('machine.panelLeft'), 300, 567, { size: 18 });
  slots(x, 80, 556, 200, 20, 10, false);
  screw(x, 66, 566); screw(x, 634, 566); screw(x, 66, 1124); screw(x, 634, 1124);
  // alarm LED yuvası
  x.fillStyle = '#211f1a'; rr(x, L.alarm.x - 12, L.alarm.y - 9, L.alarm.w + 24, L.alarm.h + 18, 8); x.fill();
  label(x, t('machine.anomaly'), L.alarm.x - 4, L.alarm.y - 26, { size: 15 });
  x.fillStyle = '#211f1a'; x.beginPath(); x.arc(L.stressLamp.x, L.stressLamp.y, 22, 0, Math.PI * 2); x.fill();
  label(x, t('machine.stress'), L.stressLamp.x, L.stressLamp.y - 42, { size: 15, align: 'center' });

  // sağ modül
  casing(x, 1388, 540, 620, 610);
  screenBezel(x, L.right);
  label(x, t('machine.panelRight'), 1436, 567, { size: 18 });
  slots(x, 1760, 556, 200, 20, 10, false);
  screw(x, 1414, 566); screw(x, 1982, 566); screw(x, 1414, 1124); screw(x, 1982, 1124);
  x.fillStyle = '#211f1a'; x.beginPath(); x.arc(L.calLamp.x, L.calLamp.y, 17, 0, Math.PI * 2); x.fill();
  label(x, t('machine.calib'), L.calLamp.x + 32, L.calLamp.y, { size: 15 });
  knob(x, 1770, 1066); knob(x, 1890, 1066);

  // sensör kolu (koyu metal, krem bağlantılar)
  x.lineCap = 'round';
  x.strokeStyle = lg(x, 1880, 0, 1960, 0, [[0, '#1b1d1b'], [0.5, '#5d605b'], [1, '#1b1d1b']]);
  x.lineWidth = 24;
  x.beginPath(); x.moveTo(1900, 548); x.lineTo(1940, 382); x.lineTo(1880, 252); x.stroke();
  for (const [jx, jy] of [[1940, 382], [1900, 548]]) {
    x.fillStyle = rg(x, jx - 5, jy - 5, 2, jx, jy, 20, [[0, P.hi], [1, P.low]]);
    x.beginPath(); x.arc(jx, jy, 20, 0, Math.PI * 2); x.fill();
  }
  casingSmall(x, 1774, 156, 182, 116);
  x.fillStyle = '#0b0c0b'; x.beginPath(); x.arc(1832, 214, 32, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(255,250,235,0.5)'; x.lineWidth = 3; x.stroke();
  x.fillStyle = rg(x, 1824, 204, 0, 1832, 214, 26, [[0, 'rgba(160,200,200,0.5)'], [0.4, 'rgba(40,60,60,0.4)'], [1, 'rgba(0,0,0,0)']]);
  x.beginPath(); x.arc(1832, 214, 26, 0, Math.PI * 2); x.fill();
  x.lineCap = 'butt';

  // orta modül (CRT)
  casing(x, 668, 352, 712, 798, { top: 28, radius: 26 });
  // körük yuvası
  x.fillStyle = lg(x, 0, 316, 0, 352, [[0, '#cfc4a8'], [1, '#9a8f73']]);
  rr(x, L.bellows.x - 34, 314, L.bellows.w + 68, 36, 8); x.fill();
  // LED çubuğu yuvası
  x.fillStyle = '#211f1a'; rr(x, L.led.x - 14, L.led.y - 11, L.led.w + 28, L.led.h + 22, 8); x.fill();
  // CRT çerçevesi
  screenBezel(x, L.crt, { pad: 48, radius: 46 });
  // hoparlör ızgarası (yuvarlak delikler)
  for (let r = 0; r < 12; r++) for (let q = 0; q < 3; q++) {
    x.fillStyle = '#3a352a'; x.beginPath(); x.arc(1338 + q * 16, 492 + r * 20, 4.2, 0, Math.PI * 2); x.fill();
  }
  for (const k of L.keys) { x.fillStyle = '#3a352a'; rr(x, k.x - 6, k.y - 6, L.keySize.w + 12, L.keySize.h + 12, 7); x.fill(); }
  label(x, `${t('machine.channel')} 06`, L.crt.x - 6, 968, { size: 17 });
  label(x, t('machine.focus'), L.crt.x + L.crt.w + 6, 968, { size: 17, align: 'right' });
  slots(x, 760, 1010, 520, 72, 24);
  // güç düğmesi ve yeşil güç lambası yuvası
  x.fillStyle = '#211f1a'; rr(x, 700, 1100, 60, 28, 6); x.fill();
  screw(x, 692, 374); screw(x, 1356, 374); screw(x, 692, 1124); screw(x, 1356, 1124);

  // kablolar
  x.strokeStyle = '#141412'; x.lineWidth = 16;
  x.beginPath(); x.moveTo(40, 1240); x.bezierCurveTo(16, 1252, 4, 1268, -10, 1280); x.stroke();

  // sararma ve kir
  const R = seeded(77);
  x.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 70; i++) {
    const px = R() * W, py = 320 + R() * 960, r = 30 + R() * 200;
    x.fillStyle = rg(x, px, py, 0, px, py, r, [[0, `rgba(${R() < 0.5 ? '120,95,40' : '60,55,40'},${0.05 + R() * 0.08})`], [1, 'rgba(0,0,0,0)']]);
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  x.globalCompositeOperation = 'source-over';
  grain(x, W, H, 8, 41);
  return c;
}

function casingSmall(x, px, py, w, h) {
  x.fillStyle = 'rgba(0,0,0,0.3)'; rr(x, px + 4, py + 6, w, h, 16); x.fill();
  x.fillStyle = lg(x, 0, py, 0, py + h, [[0, P.hi], [1, P.low]]);
  rr(x, px, py, w, h, 16); x.fill();
  x.strokeStyle = 'rgba(70,60,40,0.6)'; x.lineWidth = 2; rr(x, px, py, w, h, 16); x.stroke();
}

// Ön paneldeki üç tuş (biri amber yanar).
export function paintKey(lit) {
  const c = mk(64, 64), x = c.getContext('2d');
  x.fillStyle = lit ? '#ffd08e' : '#e3dac2';
  rr(x, 2, 2, 60, 60, 8); x.fill();
  x.fillStyle = 'rgba(90,78,52,0.35)';
  x.fillRect(2, 48, 60, 14);
  x.fillStyle = 'rgba(255,255,255,0.5)';
  x.fillRect(5, 5, 54, 4);
  return c;
}
