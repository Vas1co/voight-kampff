// 1982: üst üste duran masaüstü istasyon. Kalın siperlikli monitör bir gövde
// kasasının üstüne oturur; yan monitörler gövdenin ön yüzüne gömülüdür, önde
// eğimli bir klavye tablası uzanır. Bej plastik, antrasit ayrıntılar.
import { lg, rr } from '../../scene/paint.js';
import { t } from '../../core/strings.js';
import { PAL, TAU, label, screw, slots, box, bezel, knob, keycaps, sockets, weather, polyPath, crtRect, monRect, bellowsRect, intakeOf } from './ortak.js';

const bellows = bellowsRect(1000, 12, 460);
export const L = {
  crt: crtRect(724, 330, 600),
  left: monRect(232, 796, 350),
  right: monRect(1466, 796, 350),
  led: { x: 760, y: 686, w: 528, h: 26 },
  bellows,
  intake: intakeOf(bellows),
  keys: [{ x: 1560, y: 1150 }, { x: 1626, y: 1150 }, { x: 1692, y: 1150 }],
  keySize: { w: 52, h: 50 },
  alarm: { x: 690, y: 822, w: 300, h: 30 },
  stressLamp: { x: 1070, y: 837 },
  calLamp: { x: 1190, y: 837 },
  recLamp: { x: 1420, y: 330 },
};

export default {
  name: '1982 · istasyon',
  tint: '#fff3dc',
  L,
  key: PAL.bej.key,
  paint(x, W, H) {
    const B = PAL.bej, D = PAL.antrasit;

    // klavye tablası (eğimli) ve kaide
    x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(80, 1250, 1890, 30);
    x.fillStyle = lg(x, 0, 1250, 0, 1280, [[0, D.mid], [1, D.low]]); x.fillRect(84, 1252, 1880, 26);
    x.fillStyle = lg(x, 0, 1084, 0, 1252, [[0, B.top], [0.5, B.face], [1, B.mid]]);
    polyPath(x, [[150, 1084], [1898, 1084], [1962, 1252], [86, 1252]]); x.fill();
    x.strokeStyle = B.edge; x.lineWidth = 2; x.stroke();
    x.fillStyle = B.glint; x.fillRect(152, 1086, 1744, 2.5);
    // klavye yuvası ve tuşlar
    x.fillStyle = D.face; polyPath(x, [[360, 1104], [1500, 1104], [1520, 1236], [340, 1236]]); x.fill();
    const rows = [Array(14).fill(1), [1.5, ...Array(12).fill(1), 1.5], [1.8, ...Array(11).fill(1), 2.2], [2.3, ...Array(10).fill(1), 2.7]];
    keycaps(x, 372, 1112, rows, 66, { gap: 8, h: 22, shear: -4 });
    // canlı tuşların çerçevesi ve sayısal tuş bloğu hissi
    x.fillStyle = D.face; rr(x, 1546, 1104, 216, 132, 8); x.fill();
    keycaps(x, 1560, 1214, [[1, 1, 1]], 52, { gap: 14, h: 14, colors: ['#8e8f8e', '#5d5e5e'] });

    // gövde kasası
    box(x, B, 150, 740, 1748, 344, { top: 28, radius: 14 });
    // kasa ön yüzündeki bölmeler: yan monitörler, ortada sürücü bölmesi
    bezel(x, D, L.left, { pad: 22, radius: 14 });
    bezel(x, D, L.right, { pad: 22, radius: 14 });
    label(x, B, t('machine.panelLeft'), L.left.x, 774, { size: 14 });
    label(x, B, t('machine.panelRight'), L.right.x, 774, { size: 14 });
    x.fillStyle = lg(x, 0, 790, 0, 1068, [[0, D.face], [1, D.low]]);
    polyPath(x, [[660, 790], [1388, 790], [1388, 1068], [700, 1068], [660, 1028]]); x.fill();
    x.fillStyle = '#060707'; rr(x, 700, 900, 520, 18, 3); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(702, 918, 516, 1.5);
    x.fillStyle = '#060707'; rr(x, 700, 960, 520, 18, 3); x.fill();
    x.fillStyle = '#8e8f8e'; rr(x, 1150, 932, 56, 16, 3); x.fill(); rr(x, 1150, 992, 56, 16, 3); x.fill();
    knob(x, 1310, 950, 36); knob(x, 1310, 1030, 22);
    label(x, D, `${t('brand.machine')}`, 700, 1040, { size: 15 });
    sockets(x, D, { ...L, led: { x: -99, y: -99, w: 0, h: 0 }, keys: [], recLamp: { x: -99, y: -99 } }, { t });
    // kasanın yan havalandırmaları ve rozet
    slots(x, B, 170, 760, 46, 300, 10, false);
    slots(x, B, 1832, 760, 46, 300, 10, false);
    x.fillStyle = '#2a2b2c'; rr(x, 1700, 1040, 150, 30, 3); x.fill();
    ['#e0a43a', '#d9cf5a', '#6bb07c', '#5a8fbf'].forEach((c, i) => { x.fillStyle = c; x.fillRect(1710 + i * 16, 1048, 12, 14); });
    label(x, { ink: 'rgba(230,226,214,0.85)', inkHi: 'rgba(0,0,0,0.4)' }, t('brand.model'), 1840, 1055, { size: 13, align: 'right', spacing: 0.12 });
    for (const [sx, sy] of [[166, 756], [1882, 756], [166, 1068], [1882, 1068]]) screw(x, B, sx, sy, 6);

    // monitör: derin, köşeli gövde; üst ve yanlarda gölge düşüren siperlik
    box(x, B, 560, 290, 928, 450, { top: 26, radius: 20 });
    slots(x, B, 584, 330, 40, 120, 6, false);
    slots(x, B, 1424, 330, 40, 120, 6, false);
    bezel(x, B, L.crt, { pad: 40, radius: 34, kind: 'hood', colors: D.bezel });
    x.fillStyle = D.socket; rr(x, L.led.x - 12, L.led.y - 9, L.led.w + 24, L.led.h + 18, 6); x.fill();
    label(x, B, `${t('machine.channel')} 06`, 620, 699, { size: 14 });
    label(x, B, t('machine.focus'), 1430, 699, { size: 14, align: 'right' });
    x.fillStyle = D.socket; x.beginPath(); x.arc(L.recLamp.x, L.recLamp.y, 13, 0, TAU); x.fill();
    for (const [sx, sy] of [[578, 306], [1470, 306], [578, 722], [1470, 722]]) screw(x, B, sx, sy, 6);
    // kablo
    x.strokeStyle = '#141412'; x.lineWidth = 16;
    x.beginPath(); x.moveTo(150, 1000); x.bezierCurveTo(90, 1040, 60, 1200, 20, 1280); x.stroke();

    weather(x, W, H, B, { from: 280, amount: 1.2 });
  },
};
