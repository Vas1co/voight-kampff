// Makine gövdesi (prosedürel yer tutucu). Saydam zemin üzerinde üç modül,
// taban, sensör kolu ve körük yuvası. Dinamik parçalar (ekranlar, LED'ler,
// körük) ayrı katmanlar olarak bunun üstüne oturur.
import { mk, rr, lg, rg, grain, engrave, seeded } from '../scene/paint.js';
import { BODY, L } from './layout.js';
import { t } from '../core/strings.js';

function screw(x, px, py, r = 7) {
  x.fillStyle = rg(x, px - 2, py - 2, 0, px, py, r, [[0, '#7d8a8a'], [0.6, '#3a4446'], [1, '#121819']]);
  x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(0,0,0,0.6)';
  x.lineWidth = 2;
  x.beginPath(); x.moveTo(px - r * 0.6, py); x.lineTo(px + r * 0.6, py); x.stroke();
}

function vents(x, px, py, w, h, n) {
  for (let i = 0; i < n; i++) {
    const vx = px + (i * w) / n;
    x.fillStyle = '#030505';
    rr(x, vx, py, (w / n) * 0.45, h, 3); x.fill();
    x.fillStyle = 'rgba(200,230,225,0.06)';
    x.fillRect(vx, py + h, (w / n) * 0.45, 2);
  }
}

// Modül kutusu: üst eğimli yüz + ön yüz + kenar parlaması.
function module(x, px, py, w, h, { top = 26, radius = 14 } = {}) {
  x.fillStyle = lg(x, 0, py - top, 0, py, [[0, '#6c7c7d'], [1, '#3c494b']]);
  x.beginPath();
  x.moveTo(px + 10, py - top); x.lineTo(px + w - 10, py - top); x.lineTo(px + w, py); x.lineTo(px, py);
  x.closePath(); x.fill();
  x.fillStyle = lg(x, 0, py, 0, py + h, [[0, '#283335'], [0.55, '#182123'], [1, '#0c1213']]);
  rr(x, px, py, w, h, radius); x.fill();
  x.fillStyle = lg(x, px, 0, px + w, 0, [[0, 'rgba(255,255,255,0.05)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.3)']]);
  rr(x, px, py, w, h, radius); x.fill();
  x.fillStyle = 'rgba(210,235,230,0.22)';
  x.fillRect(px + 6, py + 1, w - 12, 2);
  x.strokeStyle = 'rgba(0,0,0,0.6)';
  x.lineWidth = 2;
  rr(x, px, py, w, h, radius); x.stroke();
}

function bezel(x, r, pad = 22, radius = 18) {
  x.fillStyle = '#05090a';
  rr(x, r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2, radius); x.fill();
  x.strokeStyle = 'rgba(180,215,210,0.16)';
  x.lineWidth = 2;
  rr(x, r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2, radius); x.stroke();
  x.fillStyle = '#010202';
  rr(x, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 10); x.fill();
}

export function paintBody() {
  const { W, H } = BODY;
  const c = mk(W, H), x = c.getContext('2d');

  // taban
  x.fillStyle = lg(x, 0, 1150, 0, 1172, [[0, '#5a6c6e'], [1, '#334042']]);
  x.beginPath(); x.moveTo(40, 1150); x.lineTo(W - 40, 1150); x.lineTo(W - 20, 1172); x.lineTo(20, 1172); x.closePath(); x.fill();
  x.fillStyle = lg(x, 0, 1172, 0, H, [[0, '#1b2426'], [1, '#070b0c']]);
  x.fillRect(20, 1172, W - 40, H - 1172);
  vents(x, 80, 1200, 360, 50, 14);
  vents(x, W - 440, 1200, 360, 50, 14);
  engrave(x, `${t('brand.machine')}  ${t('brand.model')}`, W / 2, 1226, { size: 22, align: 'center', spacing: 0.3 });

  // sol modül
  module(x, 40, 540, 620, 610);
  bezel(x, L.left);
  engrave(x, t('machine.panelLeft'), L.left.x, L.left.y + L.left.h + 44, { size: 20, spacing: 0.25 });
  vents(x, 70, 560, 220, 22, 10);
  screw(x, 62, 562); screw(x, 638, 562); screw(x, 62, 1128); screw(x, 638, 1128);
  // alarm LED yuvası
  x.fillStyle = '#030505';
  rr(x, L.alarm.x - 10, L.alarm.y - 8, L.alarm.w + 20, L.alarm.h + 16, 6); x.fill();
  engrave(x, t('machine.anomaly'), L.alarm.x, L.alarm.y - 26, { size: 16, spacing: 0.3 });
  // gerginlik lambası yuvası
  x.fillStyle = '#020303';
  x.beginPath(); x.arc(L.stressLamp.x, L.stressLamp.y, 24, 0, Math.PI * 2); x.fill();
  engrave(x, t('machine.stress'), L.stressLamp.x, L.stressLamp.y - 44, { size: 16, align: 'center', spacing: 0.3 });

  // sağ modül
  module(x, 1388, 540, 620, 610);
  bezel(x, L.right);
  engrave(x, t('machine.panelRight'), L.right.x, L.right.y + L.right.h + 44, { size: 20, spacing: 0.25 });
  vents(x, 1760, 560, 220, 22, 10);
  screw(x, 1410, 562); screw(x, 1986, 562); screw(x, 1410, 1128); screw(x, 1986, 1128);
  x.fillStyle = '#020303';
  x.beginPath(); x.arc(L.calLamp.x, L.calLamp.y, 18, 0, Math.PI * 2); x.fill();
  engrave(x, t('machine.calib'), L.calLamp.x + 34, L.calLamp.y, { size: 16, spacing: 0.3 });
  // döner düğmeler
  for (const [kx, ky] of [[1760, 1068], [1880, 1068]]) {
    x.fillStyle = rg(x, kx - 6, ky - 6, 2, kx, ky, 30, [[0, '#596566'], [0.7, '#1f2829'], [1, '#090d0e']]);
    x.beginPath(); x.arc(kx, ky, 30, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(220,235,230,0.5)'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(kx, ky); x.lineTo(kx + 14, ky - 22); x.stroke();
  }

  // sensör kolu (sağ modülden yukarı)
  x.lineCap = 'round';
  x.strokeStyle = lg(x, 1820, 0, 1900, 0, [[0, '#151c1d'], [0.5, '#566466'], [1, '#151c1d']]);
  x.lineWidth = 26;
  x.beginPath(); x.moveTo(1900, 540); x.lineTo(1940, 380); x.lineTo(1880, 250); x.stroke();
  x.fillStyle = '#222c2d';
  for (const [jx, jy] of [[1940, 380], [1900, 540]]) { x.beginPath(); x.arc(jx, jy, 20, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = lg(x, 0, 160, 0, 270, [[0, '#2f3b3d'], [1, '#0c1213']]);
  rr(x, 1780, 160, 170, 110, 16); x.fill();
  x.fillStyle = '#030505';
  x.beginPath(); x.arc(1800 + 30, 214, 30, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(170,205,200,0.35)'; x.lineWidth = 3; x.stroke();
  x.fillStyle = 'rgba(120,170,170,0.25)';
  x.beginPath(); x.arc(1822, 205, 8, 0, Math.PI * 2); x.fill();
  x.lineCap = 'butt';

  // orta modül (CRT)
  module(x, 668, 352, 712, 798, { top: 24, radius: 16 });
  // körük yuvası
  x.fillStyle = lg(x, 0, 330, 0, 352, [[0, '#4c5a5c'], [1, '#222b2d']]);
  rr(x, L.bellows.x - 30, 318, L.bellows.w + 60, 30, 6); x.fill();
  // LED çubuğu yuvası
  x.fillStyle = '#020303';
  rr(x, L.led.x - 12, L.led.y - 10, L.led.w + 24, L.led.h + 20, 6); x.fill();
  x.strokeStyle = 'rgba(180,215,210,0.12)'; x.lineWidth = 2;
  rr(x, L.led.x - 12, L.led.y - 10, L.led.w + 24, L.led.h + 20, 6); x.stroke();
  // CRT çerçevesi: kalın, yuvarlatılmış
  x.fillStyle = lg(x, 0, 430, 0, 960, [[0, '#0b1112'], [1, '#050809']]);
  rr(x, L.crt.x - 44, L.crt.y - 40, L.crt.w + 88, L.crt.h + 80, 40); x.fill();
  x.strokeStyle = 'rgba(190,225,220,0.14)'; x.lineWidth = 3;
  rr(x, L.crt.x - 44, L.crt.y - 40, L.crt.w + 88, L.crt.h + 80, 40); x.stroke();
  x.fillStyle = '#000';
  rr(x, L.crt.x - 8, L.crt.y - 8, L.crt.w + 16, L.crt.h + 16, 26); x.fill();
  // hoparlör ızgarası
  x.fillStyle = '#030606';
  for (let r = 0; r < 12; r++) for (let q = 0; q < 3; q++) { x.beginPath(); x.arc(1336 + q * 16, 498 + r * 19, 4, 0, Math.PI * 2); x.fill(); }
  // tuş yuvaları
  for (const k of L.keys) {
    x.fillStyle = '#020303';
    rr(x, k.x - 5, k.y - 5, L.keySize.w + 10, L.keySize.h + 10, 6); x.fill();
  }
  // CRT altı: kanal yazısı ve ince vida sırası
  engrave(x, `${t('machine.channel')} 06`, L.crt.x, 960, { size: 18, spacing: 0.3 });
  engrave(x, t('machine.focus'), L.crt.x + L.crt.w, 960, { size: 18, spacing: 0.3, align: 'right' });
  vents(x, 760, 1010, 520, 70, 22);
  screw(x, 690, 372); screw(x, 1358, 372); screw(x, 690, 1128); screw(x, 1358, 1128);

  // kablolar tabandan dışarı
  x.strokeStyle = '#05090a'; x.lineWidth = 16;
  x.beginPath(); x.moveTo(30, 1240); x.bezierCurveTo(10, 1250, 0, 1270, -10, 1280); x.stroke();

  grain(x, W, H, 9, 41);
  // ince kir
  const R = seeded(77);
  x.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 40; i++) {
    const px = R() * W, py = 360 + R() * 900, r = 40 + R() * 160;
    x.fillStyle = rg(x, px, py, 0, px, py, r, [[0, 'rgba(0,0,0,0.12)'], [1, 'rgba(0,0,0,0)']]);
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  x.globalCompositeOperation = 'source-over';
  return c;
}

// Ön paneldeki üç tuş (biri amber yanar).
export function paintKey(lit) {
  const c = mk(64, 64), x = c.getContext('2d');
  x.fillStyle = lit ? '#ffd08e' : '#b9bfb8';
  rr(x, 2, 2, 60, 60, 6); x.fill();
  x.fillStyle = 'rgba(0,0,0,0.22)';
  x.fillRect(2, 50, 60, 12);
  x.fillStyle = 'rgba(255,255,255,0.25)';
  x.fillRect(4, 4, 56, 4);
  return c;
}
