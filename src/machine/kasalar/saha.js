// Saha: açık duran sert taşıma çantası. Ekranlar arkaya açılmış kapağın içindeki
// panelde; kontroller ve körük öndeki gövdenin tepsisinde. Zeytin yeşili kabuk,
// kauçuk kenar contası, mandallar, menteşe, köpük dolgu, şablon yazılar.
import { lg, rg, rr } from '../../scene/paint.js';
import { t } from '../../core/strings.js';
import { PAL, TAU, label, screw, box, bezel, knob, toggle, sockets, weather, polyPath, scratches, crtRect, monRect, bellowsRect, intakeOf } from './ortak.js';

const bellows = bellowsRect(1340, 806, 420);
export const L = {
  crt: crtRect(724, 168, 600),
  left: monRect(330, 196, 330),
  right: monRect(1388, 196, 330),
  led: { x: 760, y: 572, w: 528, h: 26 },
  bellows,
  intake: intakeOf(bellows),
  keys: [{ x: 760, y: 846 }, { x: 826, y: 846 }, { x: 892, y: 846 }],
  keySize: { w: 52, h: 50 },
  alarm: { x: 286, y: 856, w: 300, h: 30 },
  stressLamp: { x: 664, y: 871 },
  calLamp: { x: 1030, y: 871 },
  recLamp: { x: 1760, y: 96 },
};

export default {
  name: 'Saha · çanta',
  tint: '#f6f6ee',
  bellowsFront: true, // körük gövdenin önünde, tepsinin içinde
  L,
  key: PAL.zeytin.key,
  paint(x, W, H) {
    const O = PAL.zeytin, D = PAL.siyah;

    // kapak (arkaya açık, üstü hafif dar)
    const lid = (dx = 0, dy = 0) => polyPath(x, [[250 + dx, 36 + dy], [1798 + dx, 36 + dy], [1872 + dx, 712 + dy], [176 + dx, 712 + dy]]);
    x.fillStyle = 'rgba(0,0,0,0.45)'; lid(8, 10); x.fill();
    x.fillStyle = lg(x, 0, 36, 0, 712, [[0, O.hi], [1, O.mid]]); lid(); x.fill();
    x.strokeStyle = '#121310'; x.lineWidth = 14; lid(); x.stroke();
    // kapak içi panel
    x.fillStyle = lg(x, 0, 80, 0, 690, [[0, '#2a2e20'], [1, '#1c1f16']]);
    polyPath(x, [[290, 78], [1758, 78], [1824, 676], [224, 676]]); x.fill();
    // ekranlar
    bezel(x, O, L.left, { pad: 24, radius: 14, colors: O.bezel });
    bezel(x, O, L.right, { pad: 24, radius: 14, colors: O.bezel });
    bezel(x, O, L.crt, { pad: 34, radius: 22, colors: O.bezel });
    x.fillStyle = D.socket; rr(x, L.led.x - 12, L.led.y - 9, L.led.w + 24, L.led.h + 18, 6); x.fill();
    label(x, O, t('machine.panelLeft'), L.left.x, L.left.y + L.left.h + 44, { size: 14 });
    label(x, O, t('machine.panelRight'), L.right.x, L.right.y + L.right.h + 44, { size: 14 });
    for (const [sx, sy] of [[310, 98], [1738, 98], [250, 656], [1798, 656]]) screw(x, O, sx, sy, 6);
    x.fillStyle = D.socket; x.beginPath(); x.arc(L.recLamp.x, L.recLamp.y, 13, 0, TAU); x.fill();
    // kapakla gövdeyi tutan destek kolları
    x.strokeStyle = '#2a2c24'; x.lineWidth = 10; x.lineCap = 'round';
    x.beginPath(); x.moveTo(200, 640); x.lineTo(160, 790); x.moveTo(1848, 640); x.lineTo(1888, 790); x.stroke();
    x.lineCap = 'butt';

    // menteşe bandı
    x.fillStyle = lg(x, 0, 704, 0, 744, [[0, '#2c3022'], [0.5, '#4f5540'], [1, '#1d2017']]); x.fillRect(150, 706, 1748, 36);
    for (let i = 0; i < 6; i++) { x.fillStyle = '#16180f'; x.fillRect(230 + i * 300, 708, 120, 32); x.fillStyle = 'rgba(235,240,205,0.12)'; x.fillRect(230 + i * 300, 710, 120, 2); }

    // gövde
    box(x, O, 110, 750, 1828, 500, { top: 0, radius: 26 });
    x.strokeStyle = '#121310'; x.lineWidth = 12; rr(x, 110, 750, 1828, 500, 26); x.stroke();
    // tepsi (koyu, köpük dolgulu)
    x.fillStyle = '#121410'; rr(x, 180, 790, 1688, 260, 14); x.fill();
    x.fillStyle = lg(x, 0, 790, 0, 1050, [[0, 'rgba(0,0,0,0.6)'], [0.2, 'rgba(40,44,32,0.3)'], [1, 'rgba(30,33,24,0.4)']]); rr(x, 180, 790, 1688, 260, 14); x.fill();
    // kontrol plakası (tepsinin sol kısmı)
    x.fillStyle = lg(x, 0, 806, 0, 1036, [[0, '#3c4130'], [1, '#2b2f21']]); rr(x, 200, 806, 1052, 230, 8); x.fill();
    for (const [sx, sy] of [[214, 820], [1238, 820], [214, 1022], [1238, 1022]]) screw(x, O, sx, sy, 5);
    sockets(x, D, { ...L, led: { x: -99, y: -99, w: 0, h: 0 }, recLamp: { x: -99, y: -99 } }, { t });
    toggle(x, 300, 980, true); toggle(x, 350, 980, true); toggle(x, 400, 980, false); toggle(x, 450, 980, true);
    label(x, O, t('machine.power'), 488, 980, { size: 13 });
    knob(x, 1130, 870, 30); knob(x, 1130, 970, 22);
    x.fillStyle = '#0c0d0a'; rr(x, 640, 962, 380, 30, 4); x.fill();
    label(x, O, `${t('brand.machine')}`, 652, 977, { size: 12 });
    // körük bölmesi (sağda)
    x.fillStyle = lg(x, 0, 806, 0, 1036, [[0, '#0c0d09'], [1, '#22251b']]); rr(x, 1272, 806, 580, 230, 8); x.fill();

    // ön yüz: mandallar, tutamak, şablon yazı, kauçuk ayaklar
    for (const lx of [380, 1560]) {
      x.fillStyle = '#16180f'; rr(x, lx, 1064, 110, 70, 8); x.fill();
      x.fillStyle = lg(x, 0, 1070, 0, 1124, [[0, '#8d907c'], [1, '#43463a']]); rr(x, lx + 12, 1074, 86, 46, 6); x.fill();
      x.fillStyle = '#16180f'; x.fillRect(lx + 30, 1094, 50, 6);
    }
    x.strokeStyle = '#141510'; x.lineWidth = 22; x.lineCap = 'round';
    x.beginPath(); x.moveTo(860, 1150); x.lineTo(880, 1196); x.lineTo(1168, 1196); x.lineTo(1188, 1150); x.stroke();
    x.lineCap = 'butt';
    x.fillStyle = '#1a1c14'; rr(x, 840, 1136, 40, 24, 5); x.fill(); rr(x, 1168, 1136, 40, 24, 5); x.fill();
    x.save();
    x.font = '700 34px "Jost", sans-serif'; if ('letterSpacing' in x) x.letterSpacing = '8px';
    x.fillStyle = 'rgba(232,228,206,0.55)'; x.fillText(`${t('brand.testShort')} ${t('brand.model')}`, 170, 1220);
    x.font = '600 16px "Plex Mono", monospace'; if ('letterSpacing' in x) x.letterSpacing = '3px';
    x.fillText('220V ~ 50HZ   NSN 6625-01-117', 1440, 1216);
    x.restore();
    for (const fx of [150, 1830]) { x.fillStyle = '#0e0f0b'; rr(x, fx, 1250, 68, 28, 6); x.fill(); }
    // köşe koruyucular
    for (const [cx, cy] of [[110, 750], [1938, 750], [110, 1250], [1938, 1250], [176, 712], [1872, 712], [250, 36], [1798, 36]]) {
      x.fillStyle = rg(x, cx - 4, cy - 4, 0, cx, cy, 24, [[0, '#2a2c24'], [1, '#0e0f0b']]);
      x.beginPath(); x.arc(cx, cy, 22, 0, TAU); x.fill();
    }
    scratches(x, W, 760, 1240, 70, 'rgba(235,240,205,0.08)', 61);

    weather(x, W, H, O, { from: 30, amount: 1.4 });
  },
};
