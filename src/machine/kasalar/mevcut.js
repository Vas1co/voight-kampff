// Mevcut kasa: üç modül yan yana (sol monitör, ortada CRT, sağ monitör), körük
// orta modülün üstünde, sağda metal kolun ucunda kayıt kamerası.
// Renk şeması tek yerden seçilir: RENK = '<ad>'
//   grisiyah      orta modül ve kamera kutusu gri, yan monitörler ve taban siyah
//   kirmizisiyah  orta modül ve kamera kutusu kırmızı boyalı metal, gerisi siyah
import { lg, rg, rr } from '../../scene/paint.js';
import { t } from '../../core/strings.js';
import { PAL, TAU, label, screw, slots, box, bezel, knob, weather } from './ortak.js';

export const L = {
  left: { x: 104, y: 612, w: 488, h: 372 },
  right: { x: 1456, y: 612, w: 488, h: 372 },
  crt: { x: 700, y: 572, w: 580, h: 332 },
  led: { x: 760, y: 484, w: 528, h: 30 },
  bellows: { x: 700, y: 100, w: 640, h: 350 },
  intake: { x: 881, y: 235 },
  keys: [{ x: 1344, y: 742 }, { x: 1344, y: 806 }, { x: 1344, y: 870 }],
  keySize: { w: 52, h: 50 },
  alarm: { x: 128, y: 1046, w: 300, h: 34 },
  stressLamp: { x: 540, y: 1064 },
  recLamp: { x: 1846, y: 214 },
  calLamp: { x: 1510, y: 1064 },
};

const RENKLER = {
  grisiyah: { center: 'gri', sides: 'siyah', base: 'siyah', arm: 'gri', tint: '#f2f4f3' },
  kirmizisiyah: { center: 'kirmizi', sides: 'siyah', base: 'siyah', arm: 'kirmizi', tint: '#f6f2f1' },
};
const RENK = RENKLER.kirmizisiyah;

export default {
  name: 'Mevcut',
  tint: RENK.tint,
  L,
  key: PAL[RENK.center].key,
  paint(x, W, H) {
    const PB = PAL[RENK.base], PS = PAL[RENK.sides], PC = PAL[RENK.center], PA = PAL[RENK.arm];

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
    box(x, PS, 40, 540, 620, 610, { top: 30, radius: 22 });
    bezel(x, PS, L.left);
    label(x, PS, t('machine.panelLeft'), 300, 567, { size: 18 });
    slots(x, PS, 80, 556, 200, 20, 10, false);
    screw(x, PS, 66, 566); screw(x, PS, 634, 566); screw(x, PS, 66, 1124); screw(x, PS, 634, 1124);
    x.fillStyle = PS.socket; rr(x, L.alarm.x - 12, L.alarm.y - 9, L.alarm.w + 24, L.alarm.h + 18, 8); x.fill();
    label(x, PS, t('machine.anomaly'), L.alarm.x - 4, L.alarm.y - 26, { size: 15 });
    x.fillStyle = PS.socket; x.beginPath(); x.arc(L.stressLamp.x, L.stressLamp.y, 22, 0, TAU); x.fill();
    label(x, PS, t('machine.stress'), L.stressLamp.x, L.stressLamp.y - 42, { size: 15, align: 'center' });

    // sağ modül
    box(x, PS, 1388, 540, 620, 610, { top: 30, radius: 22 });
    bezel(x, PS, L.right);
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
    x.fillStyle = PC.socket; rr(x, L.led.x - 14, L.led.y - 11, L.led.w + 28, L.led.h + 22, 8); x.fill();
    bezel(x, PC, L.crt, { pad: 44, radius: 40 });
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

    weather(x, W, H, PC, { from: 320 });
  },
};
