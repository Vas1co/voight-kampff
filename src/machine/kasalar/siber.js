// Siber: tek parça, kalın, pahlı bir dış çerçeve. Ekranlar çerçevenin içindeki
// koyu panelde açılı kirişlerle ayrılır. Üst kenarda düğme sırası, hoparlör ızgarası
// ve eğik bir vizör yarığı; yanlarda tutamak rayları; altta açılı ayaklar.
// Mat siyah, sarı vurgular (kırmızı yalnızca uyarılarda).
import { lg, rg, rr, seeded } from '../../scene/paint.js';
import { t } from '../../core/strings.js';
import { PAL, TAU, label, screw, chamferPath, polyPath, knob, hazard, sockets, toggle, weather, crtRect, monRect, bellowsRect, intakeOf } from './ortak.js';

const Y = '#e8cf1c';
const bellows = bellowsRect(190, 40, 540);
export const L = {
  crt: crtRect(688, 470, 672),
  left: monRect(214, 506, 390),
  right: monRect(1444, 506, 390),
  led: { x: 760, y: 906, w: 528, h: 26 },
  bellows,
  intake: intakeOf(bellows),
  keys: [{ x: 1580, y: 880 }, { x: 1646, y: 880 }, { x: 1712, y: 880 }],
  keySize: { w: 52, h: 50 },
  alarm: { x: 236, y: 896, w: 300, h: 30 },
  stressLamp: { x: 610, y: 911 },
  calLamp: { x: 1470, y: 905 },
  recLamp: { x: 150, y: 400 },
};

export default {
  name: 'Siber · çerçeve',
  tint: '#f4f4f0',
  L,
  key: PAL.gece.key,
  paint(x, W, H) {
    const P = PAL.gece;

    // ayaklar
    for (const fx of [300, 1640]) {
      x.fillStyle = lg(x, 0, 1160, 0, 1276, [[0, P.mid], [1, P.low]]);
      polyPath(x, [[fx, 1160], [fx + 108, 1160], [fx + 150, 1276], [fx - 42, 1276]]); x.fill();
      x.fillStyle = Y; x.fillRect(fx - 30, 1262, 168, 6);
    }
    // yan raylar (tutamaklar)
    for (const [rx, dir] of [[24, 1], [1988, -1]]) {
      x.fillStyle = lg(x, rx, 0, rx + 36, 0, [[0, '#0c0d0e'], [0.5, '#2c3034'], [1, '#0c0d0e']]);
      rr(x, rx, 500, 36, 520, 6); x.fill();
      x.strokeStyle = '#3c4146'; x.lineWidth = 10; x.lineCap = 'round';
      x.beginPath(); x.moveTo(rx + 18, 560); x.lineTo(rx + 18 - dir * 26, 580); x.lineTo(rx + 18 - dir * 26, 940); x.lineTo(rx + 18, 960); x.stroke();
      x.lineCap = 'butt';
    }

    // dış çerçeve
    const fr = (dx = 0, dy = 0) => chamferPath(x, 60 + dx, 330 + dy, 1928, 840, 80, [1, 0.6, 1, 0.6]);
    x.fillStyle = 'rgba(0,0,0,0.5)'; fr(8, 12); x.fill();
    x.fillStyle = lg(x, 0, 330, 0, 1170, [[0, P.hi], [0.25, P.face], [1, P.low]]); fr(); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 3; fr(); x.stroke();
    // çerçevenin pah vurguları
    x.strokeStyle = Y; x.lineWidth = 6;
    x.beginPath(); x.moveTo(60, 330 + 180); x.lineTo(60, 410); x.lineTo(140, 330); x.lineTo(420, 330); x.stroke();
    x.beginPath(); x.moveTo(1988, 1170 - 180); x.lineTo(1988, 1090); x.lineTo(1908, 1170); x.lineTo(1620, 1170); x.stroke();
    // iç panel (koyu çukur)
    const inner = () => chamferPath(x, 150, 424, 1748, 556, 40, [1, 0.5, 1, 0.5]);
    x.fillStyle = '#060707'; inner(); x.fill();
    x.fillStyle = lg(x, 0, 424, 0, 980, [[0, 'rgba(0,0,0,0.6)'], [0.15, 'rgba(30,33,36,0.4)'], [1, 'rgba(20,22,24,0.5)']]); inner(); x.fill();
    x.strokeStyle = '#000'; x.lineWidth = 4; inner(); x.stroke();
    // ekran bölmeleri ve aralarındaki açılı kirişler
    const win = (r, c) => {
      x.fillStyle = P.face; chamferPath(x, r.x - 26, r.y - 26, r.w + 52, r.h + 52, c, [1, 0.3, 1, 0.3]); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 2; x.stroke();
      x.fillStyle = '#030303'; rr(x, r.x - 6, r.y - 6, r.w + 12, r.h + 12, 4); x.fill();
    };
    win(L.left, 30); win(L.right, 30); win(L.crt, 40);
    x.fillStyle = Y;
    polyPath(x, [[L.crt.x - 26, L.crt.y - 26 + 40], [L.crt.x - 26 + 40, L.crt.y - 26], [L.crt.x - 26 + 110, L.crt.y - 26], [L.crt.x - 26, L.crt.y - 26 + 110]]); x.fill();
    x.fillStyle = '#0b0c0d';
    for (const bx of [636, 1392]) { polyPath(x, [[bx, 440], [bx + 22, 440], [bx + 4, 964], [bx - 18, 964]]); x.fill(); }
    label(x, P, t('machine.panelLeft'), L.left.x, L.left.y + L.left.h + 44, { size: 14 });
    label(x, P, t('machine.panelRight'), L.right.x, L.right.y + L.right.h + 44, { size: 14 });

    // üst kenar: vizör yarığı, hoparlör ızgarası, düğme sırası
    x.fillStyle = '#050606'; polyPath(x, [[250, 392], [640, 392], [610, 414], [220, 414]]); x.fill();
    x.fillStyle = 'rgba(255,240,170,0.08)'; polyPath(x, [[256, 394], [636, 394], [632, 397], [252, 397]]); x.fill();
    x.fillStyle = '#0a0b0c'; rr(x, 760, 356, 260, 46, 22); x.fill();
    for (let i = 0; i < 26; i++) for (let j = 0; j < 3; j++) { x.fillStyle = '#26292c'; x.beginPath(); x.arc(780 + i * 9, 368 + j * 11, 2.6, 0, TAU); x.fill(); }
    for (let i = 0; i < 5; i++) knob(x, 1290 + i * 104, 378, 22, ['#8a8e92', '#3a3d40', '#151617']);
    x.strokeStyle = 'rgba(232,207,28,0.5)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(1270, 410); x.lineTo(1740, 410); x.stroke();
    // kayıt merceği (sol üst köşede)
    x.fillStyle = rg(x, 150, 400, 0, 150, 400, 34, [[0, '#2c3034'], [0.7, '#15171a'], [1, '#08090a']]);
    x.beginPath(); x.arc(150, 400, 34, 0, TAU); x.fill();
    x.strokeStyle = '#4a4f54'; x.lineWidth = 4; x.stroke();

    // alt kenar: anahtarlar, sürgü, uyarı şeridi
    sockets(x, P, L, { t });
    toggle(x, 760, 1020, true); toggle(x, 810, 1020, false);
    label(x, P, t('machine.power'), 846, 1020, { size: 13 });
    x.fillStyle = '#0a0b0c'; rr(x, 1000, 1004, 220, 34, 16); x.fill();
    for (let i = 0; i < 5; i++) { x.fillStyle = '#3a3e42'; x.fillRect(1060 + i * 18, 1008, 8, 26); }
    hazard(x, 1300, 1012, 520, 18, Y);
    label(x, P, `${t('machine.caution')} · ${t('machine.voltage')}`, 1300, 1060, { size: 13, spacing: 0.24 });
    label(x, P, `${t('brand.machine')}  ${t('brand.model')}`, 236, 1110, { size: 16, spacing: 0.3 });
    // barkod
    x.fillStyle = '#d9d6c8'; x.fillRect(1700, 1090, 150, 46);
    const R = seeded(77);
    x.fillStyle = '#111';
    for (let bx = 1708; bx < 1842;) { const w = 1 + Math.floor(R() * 4); if (R() > 0.4) x.fillRect(bx, 1094, w, 30); bx += w + 1; }
    x.font = '600 8px "Plex Mono", monospace'; x.fillText('MK-VI-0613-B', 1710, 1132);
    // büyük şablon numara
    x.save(); x.font = '700 110px "Jost", sans-serif'; x.fillStyle = 'rgba(236,214,48,0.1)'; x.fillText('06', 1480, 1150); x.restore();
    for (const [sx, sy] of [[110, 1120], [1940, 380], [600, 360], [1940, 1120]]) screw(x, P, sx, sy, 7);

    weather(x, W, H, P, { from: 300 });
  },
};
